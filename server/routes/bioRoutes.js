import express from 'express';
import mongoose from 'mongoose';
import Bio from '../models/Bio.js';
import CommunityMessage from '../models/CommunityMessage.js';
import { uploadAvatar, deleteAvatar } from '../utils/cloudinary.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import { fetchWithCache, clearCache } from '../utils/cacheHelper.js';
import { encryptText, decryptText, hashPassword, comparePassword } from '../utils/cryptoUtils.js';
import { cleanupExpiredBirthdayNotifications } from '../utils/birthdayAutomation.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { ensureReferralCode, applyReferral } from '../utils/referralService.js';
import { isEduEmail } from '../utils/eduEmail.js';
import { broadcastToEmail } from '../utils/realtime.js';
import { embedText, cosine } from '../services/embeddingService.js';
import { generate as aiGenerate } from '../services/aiGateway.js';
import { recordSignal, getTopInterests, getPeakHour, getInterestEmbedding, refreshInterestEmbedding } from '../services/userUnderstanding.js';
import { checkAndResetDecoRoom, updateTrashAndPetStatus } from '../utils/decoHelper.js';
import { awardJoy } from '../utils/joyService.js';

const router = express.Router();

const TWELVE_MONTHS_MS = 1000 * 60 * 60 * 24 * 365;

// Ownership guard for /:id routes — the bio's login or contact email must
// match the verified member token (admins may act on any bio).
const ownsBio = (req, bioDoc) =>
  req.isAdminActor ||
  (req.memberEmail &&
    (bioDoc.email === req.memberEmail || bioDoc.contactEmail === req.memberEmail));

// ─── Helper: Append a history entry (capped at 50) ───────────────────────────
const HISTORY_LABELS = {
  displayName:  'Họ và tên',
  headline:     'Biệt danh',
  bio:          'Mô tả bản thân',
  birthday:     'Sinh nhật',
  phone:        'Số điện thoại',
  contactEmail: 'Email liên hệ',
  hobbies:      'Sở thích',
  height:       'Chiều cao',
  weight:       'Cân nặng',
  measurements: 'Số đo',
  address:      'Địa chỉ',
  education:    'Học vấn',
  skills:       'Kỹ năng',
  jobTitle:     'Nghề nghiệp'
};

const pushHistory = (bio, entry) => {
  bio.history.push({ ...entry, timestamp: new Date() });
  if (bio.history.length > 50) {
    bio.history = bio.history.slice(bio.history.length - 50);
  }
  if (bio.email) {
    sendPushNotification(
      bio.email,
      entry.title || 'Thông báo mới',
      entry.detail || 'Bạn có cập nhật mới trong tài khoản.',
      '/member/portal?tab=history'
    ).catch(err => console.error('[pushHistory Notification] Error:', err));
  }
};

const normalizeSlug = (value) => {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const createUniqueSlug = async (baseSlug, ignoreId = null) => {
  let slug = baseSlug || 'bio';
  let suffix = 1;

  while (true) {
    const query = { slug };
    if (ignoreId) query._id = { $ne: ignoreId };

    const existing = await Bio.findOne(query);
    if (!existing) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const removeExpiredBioIfNeeded = async (bio) => {
  if (bio && bio.expiresAt && new Date(bio.expiresAt).getTime() <= Date.now()) {
    await Bio.deleteOne({ _id: bio._id });
    return null;
  }

  return bio;
};

const processSecretLinks = async (newLinks, existingLinks = []) => {
  if (!newLinks || !Array.isArray(newLinks)) return [];
  const result = [];
  for (const link of newLinks) {
    let newLink = { ...link };
    const oldLink = existingLinks.find(l => l.id === link.id);
    
    if (newLink.password) {
      if (!newLink.password.startsWith('$2a$') && !newLink.password.startsWith('$2b$')) {
         newLink.password = await hashPassword(newLink.password);
      }
    } else if (oldLink && oldLink.password) {
      newLink.password = oldLink.password;
    }
    
    if (newLink.url) {
      if (!newLink.url.startsWith('enc:')) {
         newLink.url = encryptText(newLink.url);
      }
    } else if (oldLink && oldLink.url) {
      newLink.url = oldLink.url;
    }
    
    result.push(newLink);
  }
  return result;
};

// POST: Bulk approve all pending bios
router.post('/bulk-approve-pending', requireAdmin, async (req, res) => {
  try {
    const pendingBios = await Bio.find({ status: 'pending' });
    let count = 0;

    for (const bio of pendingBios) {
      if (bio.verificationRequest && bio.verificationRequest.submitted) {
        bio.displayName = bio.verificationRequest.fullName || bio.displayName;
        bio.birthday = bio.verificationRequest.birthday || bio.birthday;
        bio.phone = bio.verificationRequest.phoneZalo || bio.phone;
        if (bio.verificationRequest.schoolName) {
          bio.education = `${bio.verificationRequest.schoolLevel || ''} - ${bio.verificationRequest.schoolName}`.trim().replace(/^- /, '');
        }
        bio.verificationRequest.notifiedStatus = 'approved';
      }

      bio.status = 'active';
      bio.isEduVerified = true;
      // Extend so the member gets a full 365 days counted from their original
      // signup date, replacing whatever trial/expiry they had before.
      bio.expiresAt = new Date(new Date(bio.createdAt).getTime() + TWELVE_MONTHS_MS);
      pushHistory(bio, {
        type: 'profile_updated',
        icon: 'verified',
        title: 'Tài khoản đã được duyệt tự động! 🎉',
        detail: 'Quản trị viên đã duyệt hàng loạt tài khoản của bạn lên trạng thái hoạt động.'
      });

      await bio.save();
      await removeDuplicateIdentityAccounts(bio);
      clearCache(`bio_slug_${bio.slug}`);
      broadcastToEmail(bio.email, { type: 'bio_status_update', status: bio.status, isEduVerified: true, expiresAt: bio.expiresAt });
      count++;
    }

    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch all bios (for Admin Panel) with search, filter, pagination, and stats
router.get('/', requireAdmin, async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      expiration = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search.trim()) {
      query.$or = [
        { displayName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (status && ['active', 'locked', 'pending', 'rejected'].includes(status)) {
      query.status = status;
    }

    if (expiration) {
      const now = new Date();
      if (expiration === 'active') {
        query.$or = [
          { expiresAt: { $gt: now } },
          { expiresAt: null }
        ];
      } else if (expiration === 'expired') {
        query.expiresAt = { $lte: now };
      } else if (expiration === 'lifetime') {
        query.expiresAt = null;
      }
    }

    const sortObj = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    sortObj[sortBy] = order;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Run parallel counts & query
    const [bios, totalMatched, totalCount, activeCount, lockedCount, pendingCount, rejectedCount, lifetimeCount] = await Promise.all([
      Bio.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Bio.countDocuments(query),
      Bio.countDocuments(),
      Bio.countDocuments({ status: 'active' }),
      Bio.countDocuments({ status: 'locked' }),
      Bio.countDocuments({ status: 'pending' }),
      Bio.countDocuments({ status: 'rejected' }),
      Bio.countDocuments({ expiresAt: null })
    ]);

    res.json({
      bios,
      pagination: {
        totalMatched,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalMatched / limitNum)
      },
      stats: {
        total: totalCount,
        active: activeCount,
        locked: lockedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        lifetime: lifetimeCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A person should only ever hold one verified account. If they previously
// signed up under a different email (edu + non-edu by mistake, or two
// trial attempts) and this verification reveals the same identity (same
// phone or same student ID), the other email's Bio is deleted outright —
// keeping only the one that just got verified.
async function removeDuplicateIdentityAccounts(bio) {
  const phone = bio.verificationRequest?.phoneZalo;
  const schoolIdCode = bio.verificationRequest?.schoolIdCode;
  const identityFilters = [];
  if (phone) identityFilters.push({ 'verificationRequest.phoneZalo': phone });
  if (schoolIdCode) identityFilters.push({ 'verificationRequest.schoolIdCode': schoolIdCode });
  if (!identityFilters.length) return;

  await Bio.deleteMany({ _id: { $ne: bio._id }, $or: identityFilters });
}

// PATCH: Lock/Unlock/Approve/Reject bio
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'locked', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const bio = await Bio.findById(id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    // Auto-fill profile fields + extend to a full year when approving a
    // submitted verification request — covers both the legacy pending→active
    // gate and the new flow where non-edu trial members are already 'active'
    // and just need their submitted request approved.
    const isApprovingVerification = status === 'active' && bio.verificationRequest?.submitted && !bio.isEduVerified;
    if (isApprovingVerification) {
      bio.displayName = bio.verificationRequest.fullName || bio.displayName;
      bio.birthday = bio.verificationRequest.birthday || bio.birthday;
      bio.phone = bio.verificationRequest.phoneZalo || bio.phone;
      if (bio.verificationRequest.schoolName) {
        bio.education = `${bio.verificationRequest.schoolLevel || ''} - ${bio.verificationRequest.schoolName}`.trim().replace(/^- /, '');
      }
      bio.verificationRequest.notifiedStatus = 'approved';
      bio.isEduVerified = true;
      // Extend so the member gets a full 365 days counted from their original
      // signup date, replacing whatever trial/expiry they had before.
      bio.expiresAt = new Date(new Date(bio.createdAt).getTime() + TWELVE_MONTHS_MS);
    } else if (status === 'rejected') {
      if (bio.verificationRequest) {
        bio.verificationRequest.notifiedStatus = 'rejected';
      }
    }

    // Rejecting an already-active trial member's verification just declines
    // the edu upgrade — it must NOT lock them out of their running 30-day
    // trial. Only a legacy 'pending'-gated account actually moves to the
    // hard 'rejected' (no-access) state.
    if (status === 'rejected' && bio.status === 'active') {
      bio.verificationRequest.submitted = false;
    } else {
      bio.status = status;
    }
    await bio.save();
    if (isApprovingVerification) await removeDuplicateIdentityAccounts(bio);

    // Clear public cache so guest devices reflect status changes instantly
    clearCache(`bio_slug_${bio.slug}`);
    if (isApprovingVerification || status === 'rejected') {
      broadcastToEmail(bio.email, { type: 'bio_status_update', status: bio.status, isEduVerified: bio.isEduVerified, expiresAt: bio.expiresAt });
    }

    res.json({ bio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', requireMember, async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.query;
    const email = req.memberEmail;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    let doc = await Bio.findOne({ email });
    if (!doc) {
      doc = await Bio.findOne({ contactEmail: email });
    }
    let bioDoc = await removeExpiredBioIfNeeded(doc);

    // Auto-create a placeholder Bio document if it doesn't exist and we have the Google displayName
    if (!bioDoc && displayName) {
      const isEdu = await isEduEmail(email);
      const baseSlug = normalizeSlug(displayName);
      const newSlug = await createUniqueSlug(baseSlug);

      // Edu emails get full 1-year access immediately and are considered
      // verified outright — no form, no admin step. Everyone else gets a
      // 30-day trial with full portal access right away (no blocking
      // "pending" gate) and can submit verification any time from the
      // "Sinh viên chưa xác minh" tab to extend to a full year on approval.
      const expiresAt = new Date();
      if (isEdu) expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      else expiresAt.setDate(expiresAt.getDate() + 30);

      const welcomeHistory = [
        {
          type: 'welcome',
          icon: 'celebration',
          title: 'Chào mừng bạn đến với Hugo Studio! 🎉',
          detail: `Xin chào ${displayName}! Trang Bio cá nhân của bạn đã được khởi tạo thành công. Hãy thoả sức sáng tạo và cá nhân hoá trang Bio của mình nhé — chúng tôi luôn đồng hành cùng bạn.`,
          timestamp: new Date()
        }
      ];

      bioDoc = new Bio({
        email,
        displayName,
        avatarUrl: avatarUrl || '',
        slug: newSlug,
        status: 'active',
        isEduVerified: isEdu,
        expiresAt,
        history: welcomeHistory,
        createdAt: new Date()
      });
      
      await bioDoc.save();
      if (global.validSlugs) global.validSlugs.add(bioDoc.slug);
      // NOTE: referralCode is intentionally NOT generated here — it's generated
      // lazily after the onboarding modal has a chance to collect the phone
      // number, so phone-derived codes are the common case (see ensureReferralCode).
    }

    // Self-heal: accounts created while edu emails still went through the
    // 30-day-trial-then-verify flow are stuck on isEduVerified=false forever
    // since nothing re-checks them after creation — catch that here on every
    // portal load instead of needing a one-off migration script.
    if (bioDoc && bioDoc.status === 'active' && !bioDoc.isEduVerified && (await isEduEmail(bioDoc.email))) {
      bioDoc.isEduVerified = true;
      bioDoc.expiresAt = new Date(new Date(bioDoc.createdAt).getTime() + TWELVE_MONTHS_MS);
      await bioDoc.save();
    }

    if (bioDoc) {
      // Check if maintenance is overdue by more than 3 months (90 days)
      if (bioDoc.completedLessons && bioDoc.completedLessons.length > 0 && !bioDoc.hugoCoderAll7Lifetime) {
        const expiresAt = bioDoc.featureSubscriptions?.hugoCoder?.expiresAt;
        if (expiresAt && Date.now() > new Date(expiresAt).getTime() + 90 * 24 * 60 * 60 * 1000) {
          bioDoc.completedLessons = [];
          bioDoc.markModified('completedLessons');
          await bioDoc.save();
        }
      }

      await cleanupExpiredBirthdayNotifications(bioDoc);
      const bioObj = bioDoc.toObject();
      if (bioObj.secretLinks && Array.isArray(bioObj.secretLinks)) {
        bioObj.secretLinks = bioObj.secretLinks.map(link => ({
          ...link,
          url: decryptText(link.url),
          password: '' // Hide hashed password from frontend, allow user to input new one if needed
        }));
      }
      return res.json({ bio: bioObj });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Strips a leading school-level token (TH/THCS/THPT/ĐH/CĐ and common spellings)
// from a school name so "THCS Nguyễn Du" becomes "Nguyễn Du" regardless of
// whether the user typed the level into the name field by habit.
const SCHOOL_LEVEL_PREFIX = /^(tiểu học|trung học cơ sở|trung học phổ thông|cao đẳng|đại học|thcs|thpt|cđ|đh|th)[\s.:-]+/i;
function stripSchoolLevelPrefix(name) {
  return String(name || '').trim().replace(SCHOOL_LEVEL_PREFIX, '').trim();
}

// POST /me/verification - Submit the mandatory profile/verification form.
// Edu emails self-approve immediately (no admin wait); everyone else still
// queues for admin review (see PATCH /:id/status). Phone is just a plain
// field here — no SMS OTP requirement, since members change numbers often
// and forcing OTP just to submit this form was too much friction.
router.post('/me/verification', requireMember, async (req, res) => {
  try {
    const { fullName, birthday, schoolLevel, schoolName, schoolIdCode, phoneZalo, avatarUrl } = req.body;
    const email = req.memberEmail;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    bio.verificationRequest = {
      fullName: fullName || '',
      birthday: birthday || '',
      schoolLevel: schoolLevel || '',
      schoolName: stripSchoolLevelPrefix(schoolName),
      schoolIdCode: schoolIdCode || '',
      phoneZalo: phoneZalo || '',
      avatarUrl: avatarUrl || '',
      submitted: true,
      notifiedStatus: 'none'
    };
    bio.phone = phoneZalo;

    const isEdu = await isEduEmail(email);
    if (isEdu) {
      // Edu identity is already proven by the email domain + a verified phone
      // — no human needs to review this, approve it on the spot.
      bio.displayName = bio.verificationRequest.fullName || bio.displayName;
      bio.birthday = bio.verificationRequest.birthday || bio.birthday;
      if (bio.verificationRequest.schoolName) {
        bio.education = `${bio.verificationRequest.schoolLevel || ''} - ${bio.verificationRequest.schoolName}`.trim().replace(/^- /, '');
      }
      bio.verificationRequest.notifiedStatus = 'approved';
      bio.isEduVerified = true;
      bio.expiresAt = new Date(new Date(bio.createdAt).getTime() + TWELVE_MONTHS_MS);
    }

    await bio.save();
    if (isEdu) await removeDuplicateIdentityAccounts(bio);
    clearCache(`bio_slug_${bio.slug}`);
    if (isEdu) {
      broadcastToEmail(bio.email, { type: 'bio_status_update', status: bio.status, isEduVerified: true, expiresAt: bio.expiresAt });
    }

    res.json({ success: true, bio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/onboarding - One-time post-signup step: collect phone (so referral
// codes can be phone-derived) and optionally apply a referrer's code.
router.post('/me/onboarding', requireMember, async (req, res) => {
  try {
    const { phone, referrerCode } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    if (phone && String(phone).trim()) {
      bio.phone = String(phone).trim();
    }

    const referralCode = await ensureReferralCode(bio);

    let referralResult = null;
    let referralError = null;
    if (referrerCode && String(referrerCode).trim()) {
      try {
        referralResult = await applyReferral(bio, referrerCode);
      } catch (err) {
        referralError = err.message;
      }
    }

    bio.onboardingCompleted = true;
    await bio.save();

    res.json({
      success: true,
      referralCode,
      joyAwarded: referralResult?.joyAwarded || 0,
      bioExtendedDays: referralResult?.bioExtendedDays || 0,
      referralError
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/dismiss-notification - Dismiss approval/rejection banner state
router.post('/me/dismiss-notification', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    if (bio.verificationRequest) {
      bio.verificationRequest.notifiedStatus = 'done';
      await bio.save();
    }

    res.json({ success: true, bio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Haversine distance in kilometers between two lat/lng points.
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const ANOMALY_RADIUS_KM = 50;

// POST /me/check-location  { email, lat, lng }  — member opts in via the
// browser's native geolocation permission prompt (no separate consent UI
// needed, the prompt itself IS the consent). First reading becomes the
// trusted reference point; later readings further than 50km flag `anomaly:
// true` so the client can force a re-login. Never blocks/denies anything
// server-side — enforcement (logout + redirect) happens client-side in
// useLocationGuard.js, consistent with how this codebase has no session-
// revocation list for its stateless JWTs.
router.post('/me/check-location', requireMember, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const email = req.memberEmail;
    if (!email || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'email, lat and lng are required' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    if (!bio.trustedLocation?.lat) {
      bio.trustedLocation = { lat, lng, updatedAt: new Date() };
      bio.lastLocationCheck = { lat, lng, distanceKm: 0, checkedAt: new Date() };
      await bio.save();
      return res.json({ success: true, anomaly: false, distanceKm: 0, trustedSet: true });
    }

    const distance = distanceKm(bio.trustedLocation.lat, bio.trustedLocation.lng, lat, lng);
    bio.lastLocationCheck = { lat, lng, distanceKm: distance, checkedAt: new Date() };
    await bio.save();

    res.json({ success: true, anomaly: distance > ANOMALY_RADIUS_KM, distanceKm: Math.round(distance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/reset-trusted-location  { email, lat, lng } — member confirms
// "yes this is really me, this is my new normal location" after a forced
// re-login from an anomaly, so they aren't logged out again immediately.
router.post('/me/reset-trusted-location', requireMember, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const email = req.memberEmail;
    if (!email || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'email, lat and lng are required' });
    }
    const bio = await Bio.findOneAndUpdate(
      { email },
      { $set: { trustedLocation: { lat, lng, updatedAt: new Date() } } },
      { new: true }
    );
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    
    // Thuật toán O(1) Bloom Filter: Chặn ngay nếu Slug không tồn tại trong DB (Tránh DDoS DB)
    if (global.validSlugs && !global.validSlugs.has(slug)) {
      return res.status(404).json({ error: 'Bio not found (Bloom Filter rejected)' });
    }

    const cacheKey = `bio_slug_${slug}`;
    
    // Kích hoạt Single-flight & Stale-while-revalidate (giữ fresh trong 60 giây)
    const bio = await fetchWithCache(cacheKey, 60000, async () => {
      const found = await Bio.findOne({ slug });
      if (found) {
        await checkAndResetDecoRoom(found);
        await updateTrashAndPetStatus(found);
      }
      const bioDoc = await removeExpiredBioIfNeeded(found);
      if (bioDoc) {
        const doc = bioDoc.toObject();
        // Remove sensitive info for public view
        if (doc.secretLinks && Array.isArray(doc.secretLinks)) {
          doc.secretLinks = doc.secretLinks.map(link => ({
            id: link.id,
            title: link.title,
            hasPassword: !!link.password
          }));
        }
        return doc;
      }
      return null;
    });

    if (!bio) {
      // Nếu không tìm thấy, xóa khỏi Bloom Filter
      if (global.validSlugs) global.validSlugs.delete(slug);
      return res.status(404).json({ error: 'Bio not found' });
    }

    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.json({ bio });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/slug/:slug/secret-link/:linkId/unlock', async (req, res) => {
  try {
    const { slug, linkId } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Mật khẩu không được để trống' });
    }

    const bioDoc = await Bio.findOne({ slug });
    if (!bioDoc) return res.status(404).json({ error: 'Bio not found' });
    
    const link = (bioDoc.secretLinks || []).find(l => l.id === linkId);
    if (!link) return res.status(404).json({ error: 'Secret link not found' });
    
    const isValid = await comparePassword(password, link.password);
    if (!isValid) return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    
    const decryptedUrl = decryptText(link.url);
    return res.json({ url: decryptedUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const {
      displayName,
      headline = '', 
      bio = '',
      birthday = '',
      phone = '',
      hobbies = '',
      height = '',
      weight = '',
      measurements = '',
      address = '',
      education = '',
      skills = '',
      jobTitle = '',
      contactEmail = '',
      socialLinks = {},
      theme = {},
      pricing = { standard: '', premium: '', custom: '' },
      portfolio = [],
      services = [],
      secretLinks = [],
      baseSlug = ''
    } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and Display Name are required' });
    }

    const newSlug = await createUniqueSlug(baseSlug || normalizeSlug(displayName));

    const welcomeHistory = [
      {
        type: 'welcome',
        icon: 'celebration',
        title: 'Chào mừng bạn đến với Hugo Studio! 🎉',
        detail: `Xin chào ${displayName}! Trang Bio cá nhân của bạn đã được khởi tạo thành công. Hãy thoả sức sáng tạo và cá nhân hoá trang Bio của mình nhé — chúng tôi luôn đồng hành cùng bạn.`,
        timestamp: new Date()
      },
      {
        type: 'bio_link',
        icon: 'link',
        title: 'Bio Link của bạn đã sẵn sàng',
        detail: `Đường dẫn Bio công khai của bạn là: hugowishpax.studio/bio/${newSlug}`,
        timestamp: new Date()
      }
    ];

    const newBio = new Bio({
      email,
      displayName,
      slug: newSlug,
      headline,
      bio,
      birthday,
      phone,
      hobbies,
      height,
      weight,
      measurements,
      address,
      education,
      skills,
      jobTitle,
      contactEmail,
      socialLinks,
      theme,
      pricing,
      portfolio,
      services,
      secretLinks: await processSecretLinks(secretLinks || []),
      history: welcomeHistory,
      createdAt: new Date(),
    });

    const savedBio = await newBio.save();
    
    // Cập nhật Bloom Filter
    if (global.validSlugs) global.validSlugs.add(savedBio.slug);

    return res.status(201).json(savedBio);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireMember, async (req, res) => {
  try {
    const existing = await Bio.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    // _id is exposed on the public bio page — without this check anyone could
    // overwrite any member's bio.
    if (!ownsBio(req, existing)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa Bio này.' });
    }
    const previousSlug = existing.slug;

    // Xóa Cache nếu bio bị chỉnh sửa
    clearCache(`bio_slug_${existing.slug}`);
    
    const { 
      displayName, 
      headline = '', 
      bio = '',
      birthday = '',
      phone = '',
      hobbies = '',
      height = '',
      weight = '',
      measurements = '',
      address = '',
      education = '',
      skills = '',
      jobTitle = '',
      contactEmail = '',
      avatarUrl,
      links = [],
      theme = {},
      tabs = [],
      projects = [],
      services = [],
      secretLinks = []
    } = req.body;

    // Handle avatar update / delete / overwrite
    if (avatarUrl !== undefined) {
      if (avatarUrl && avatarUrl.startsWith('data:image')) {
        existing.avatarUrl = await uploadAvatar(avatarUrl, existing.email, existing.avatarUrl);
      } else if (avatarUrl === '') {
        if (existing.avatarUrl) {
          await deleteAvatar(existing.avatarUrl);
        }
        existing.avatarUrl = '';
      }
    }

    // Once a verification request has been approved, the fields it set
    // (name/birthday/phone/education) are fixed — silently ignore any
    // incoming change to them instead of rejecting the whole save, so a
    // direct API call can't bypass the UI lock in PersonalInfoSubTab.
    const lockedDisplayName = existing.isEduVerified ? existing.displayName : displayName;
    const lockedBirthday = existing.isEduVerified ? existing.birthday : birthday;
    const lockedPhone = existing.isEduVerified ? existing.phone : phone;
    const lockedEducation = existing.isEduVerified ? existing.education : education;
    // Members get exactly one email — the one they signed in with. The
    // separate "Contact Email" field is banned outright (not just for
    // verified accounts) so it can never be (re)introduced via direct API
    // calls now that the UI field is gone; existing legacy values are left
    // alone since other routes still fall back to matching by contactEmail.
    const lockedContactEmail = existing.contactEmail;

    const nextDisplayName = lockedDisplayName || existing.displayName;
    const nextSlugBase = normalizeSlug(nextDisplayName || existing.email.split('@')[0]);
    const nextSlug = await createUniqueSlug(nextSlugBase, existing._id);

    // Apply strict property-level defaults
    // NOTE: template is intentionally NOT taken from req.body here. 'brutalism'
    // and 'flat' cost 150 JOY/month (see POST /api/joy/subscribe-bio-theme) —
    // this generic free PUT only ever preserves the existing template, except
    // for the free downgrade back to 'default'.
    const nextTemplate = theme.template === 'default' ? 'default' : (existing.theme?.template || 'default');
    const finalTheme = {
      bgColor: theme.bgColor || '#ffffff',
      textColor: theme.textColor || '#0f172a',
      accentColor: theme.accentColor || '#6366f1',
      pattern: theme.pattern || 'none',
      preset: theme.preset || 'default',
      btnRadius: typeof theme.btnRadius === 'number' ? theme.btnRadius : 16,
      btnBorderWidth: typeof theme.btnBorderWidth === 'number' ? theme.btnBorderWidth : 0,
      btnShadow: typeof theme.btnShadow === 'number' ? theme.btnShadow : 4,
      template: nextTemplate
    };

    // ── Track field changes for history ──────────────────────────────────────
    const textFields = ['displayName','headline','bio','birthday','phone','contactEmail','hobbies','height','weight','measurements','address','education','skills','jobTitle'];
    const fieldValues = { displayName: nextDisplayName, headline, bio, birthday: lockedBirthday, phone: lockedPhone, contactEmail: lockedContactEmail, hobbies, height, weight, measurements, address, education: lockedEducation, skills, jobTitle };

    let updatedFieldsDetail = [];

    for (const field of textFields) {
      const oldVal = (existing[field] || '').toString().trim();
      const newVal = (fieldValues[field] || '').toString().trim();
      if (oldVal !== newVal && (oldVal || newVal)) {
        const label = HISTORY_LABELS[field] || field;
        if (!oldVal) {
          updatedFieldsDetail.push(`• Đã bổ sung mới [${label}]: "${newVal}"`);
        } else if (!newVal) {
          updatedFieldsDetail.push(`• Đã xóa trống [${label}] (Nội dung cũ: "${oldVal}")`);
        } else {
          updatedFieldsDetail.push(`• Đã thay đổi [${label}]: Từ "${oldVal.substring(0,60)}" ➔ Thành "${newVal.substring(0,60)}"`);
        }
      }
    }

    if (updatedFieldsDetail.length > 0) {
      pushHistory(existing, { 
        type: 'profile_updated', 
        icon: 'edit_document', 
        title: 'Đã cập nhật thông tin hồ sơ', 
        detail: `Chi tiết các thay đổi của bạn:\n${updatedFieldsDetail.join('\n')}`
      });
    }

    // Track link changes
    let linksDetail = [];
    const oldLinkUrls = (existing.links || []).map(l => l.url);
    const newLinkUrls = (links || []).map(l => l.url);
    for (const lnk of (links || [])) {
      if (!oldLinkUrls.includes(lnk.url)) {
        linksDetail.push(`• Đã gắn thêm liên kết: ${lnk.label} (${lnk.url})`);
      }
    }
    for (const lnk of (existing.links || [])) {
      if (!newLinkUrls.includes(lnk.url)) {
        linksDetail.push(`• Đã gỡ bỏ liên kết: ${lnk.label} (${lnk.url})`);
      }
    }
    
    if (linksDetail.length > 0) {
      pushHistory(existing, { 
        type: 'link_added', 
        icon: 'link', 
        title: 'Đã thay đổi liên kết mạng xã hội', 
        detail: `Chi tiết các thay đổi liên kết:\n${linksDetail.join('\n')}`
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    existing.displayName = nextDisplayName;
    existing.headline = headline;
    existing.bio = bio;
    existing.birthday = lockedBirthday;
    existing.phone = lockedPhone;
    existing.hobbies = hobbies;
    existing.height = height;
    existing.weight = weight;
    existing.measurements = measurements;
    existing.address = address;
    existing.education = lockedEducation;
    existing.skills = skills;
    existing.jobTitle = jobTitle;
    existing.contactEmail = lockedContactEmail;
    existing.links = links;
    existing.theme = finalTheme;
    existing.tabs = tabs;
    existing.projects = projects;
    existing.services = services;
    existing.secretLinks = await processSecretLinks(secretLinks || [], existing.secretLinks || []);
    existing.slug = nextSlug;
    existing.status = 'active';

    await existing.save();

    // Keep the in-memory valid-slug set consistent on rename — otherwise the
    // new slug 404s (not in set) while the old one stays "valid" forever.
    if (global.validSlugs && previousSlug !== existing.slug) {
      global.validSlugs.delete(previousSlug);
      global.validSlugs.add(existing.slug);
    }

    return res.json({ bio: existing });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await Bio.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    if (existing.avatarUrl) {
      await deleteAvatar(existing.avatarUrl);
    }
    await Bio.findByIdAndDelete(req.params.id);
    
    // Xóa khỏi Cache và Bloom Filter
    clearCache(`bio_slug_${existing.slug}`);
    if (global.validSlugs) global.validSlugs.delete(existing.slug);

    res.json({ message: 'Bio deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /contacts/sync/:id - Batch synchronize contacts from mobile
router.post('/contacts/sync/:id', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    if (!ownsBio(req, bio)) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên Bio này.' });
    }

    const incoming = req.body.contacts || [];
    const existingPhones = new Set(bio.backedUpContacts.map(c => (c.phone || '').replace(/\s+/g, '')));
    
    let addedCount = 0;
    for (const c of incoming) {
      const tel = (c.phone || c.tel || c.telUrl || '').replace(/\s+/g, '').trim();
      const name = (c.name || '').trim();
      if (!name) continue;

      if (!tel || !existingPhones.has(tel)) {
        bio.backedUpContacts.push({
          name,
          phone: tel,
          email: (c.email || '').trim()
        });
        if (tel) {
          existingPhones.add(tel);
        }
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await bio.save();
      clearCache(`bio_slug_${bio.slug}`);
    }

    res.json({ success: true, count: addedCount, contacts: bio.backedUpContacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /contacts/:id/:contactId - Delete a single backed up contact
router.delete('/contacts/:id/:contactId', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    if (!ownsBio(req, bio)) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên Bio này.' });
    }

    bio.backedUpContacts = bio.backedUpContacts.filter(c => c._id.toString() !== req.params.contactId);
    await bio.save();
    clearCache(`bio_slug_${bio.slug}`);

    res.json({ success: true, contacts: bio.backedUpContacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── AI Content Moderation Helper for Community Posts/Comments ────────────────
// A super-fast flash model is used so the sequential queue drains quickly.
const MODERATION_MODEL = process.env.GEMINI_MODERATION_MODEL || 'gemini-2.5-flash';

function heuristicAudit(text) {
  const t = (text || '').toLowerCase();
  const hasQuestion = text.includes('?') || t.includes('hỏi') || t.includes('sao') || t.includes('thế nào') || t.includes('how') || t.includes('what') || t.includes('why');
  return {
    sentiment: 'tích cực',
    category: hasQuestion ? 'câu hỏi' : 'chia sẻ',
    status: 'approved',
    rejectReason: ''
  };
}

async function auditContent(text) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) return heuristicAudit(text);

  try {
    const prompt = `Bạn là hệ thống kiểm duyệt và phân loại nội dung tự động cho mạng xã hội học sinh - sinh viên (HSSV).
Phân tích bài viết và trả về DUY NHẤT một chuỗi JSON hợp lệ với các trường:
- "sentiment": "tích cực" hoặc "tiêu cực".
- "category": "câu hỏi" nếu bài viết đang hỏi/nhờ giải đáp; "chia sẻ" nếu đang chia sẻ thông tin/kinh nghiệm.
- "status": "approved" hoặc "rejected". Trả "rejected" nếu: chứa từ ngữ tục tĩu, quấy rối, kích động thù địch, vi phạm pháp luật; HOẶC ngôn ngữ KHÔNG phải tiếng Việt và cũng KHÔNG phải tiếng Anh (chỉ chấp nhận VI/EN).
- "rejectReason": nếu rejected, giải thích ngắn gọn lý do (tiếng Việt); nếu approved để chuỗi rỗng "".

Bài viết: "${text.replace(/"/g, '\\"')}"

LƯU Ý: Chỉ trả về JSON thô, không markdown, không giải thích thêm.`;

    const botText = await aiGenerate(prompt, { model: MODERATION_MODEL });
    if (!botText) return heuristicAudit(text);
    const cleanJson = botText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      sentiment: parsed.sentiment === 'tiêu cực' ? 'tiêu cực' : 'tích cực',
      category: parsed.category === 'câu hỏi' ? 'câu hỏi' : 'chia sẻ',
      status: parsed.status === 'rejected' ? 'rejected' : 'approved',
      rejectReason: parsed.status === 'rejected' ? String(parsed.rejectReason || 'Nội dung không phù hợp').slice(0, 300) : ''
    };
  } catch (err) {
    console.error('[Gemini Audit] Failed:', err);
    return heuristicAudit(text);
  }
}

// Lightweight comment moderation — a profanity/harassment blocklist, no AI.
// Comments are short (emoji, teencode, "gg wp", "cảm ơn nha"); running them
// through the post-oriented AI audit (which enforces VI/EN + flags jargon) was
// falsely rejecting normal replies. Only block clear toxicity here.
const COMMENT_BAD_WORDS = ['địt', 'đụ ', 'đụ,', 'lồn', 'cặc', 'buồi', 'đĩ', 'đmm', ' đm ', 'vcl', 'vãi lồn', 'thằng chó', 'đồ chó', 'óc chó', 'súc vật', 'hiếp dâm', 'fuck', 'bitch', 'asshole', 'nigger', 'rape'];
function moderateComment(text) {
  const t = ` ${(text || '').toLowerCase()} `;
  return COMMENT_BAD_WORDS.some((w) => t.includes(w))
    ? { status: 'rejected', rejectReason: 'Bình luận chứa nội dung không phù hợp' }
    : { status: 'approved' };
}

// ─── Sequential AI moderation queue ──────────────────────────────────────────
// Posts are created as 'pending' and drained ONE AT A TIME here, so a burst of
// simultaneous posts never fires many concurrent AI calls (avoids rate limits /
// slow responses). Each job re-reads the post, moderates, then publishes.
let moderationChain = Promise.resolve();

async function moderateOnePost(postId) {
  const post = await CommunityMessage.findById(postId);
  if (!post || post.status !== 'pending') return;

  const audit = await auditContent(post.message);

  if (audit.status === 'rejected') {
    post.status = 'rejected';
    post.rejectReason = audit.rejectReason || 'Nội dung không phù hợp';
    post.moderatedAt = new Date();
    await post.save();
    return;
  }

  post.sentiment = audit.sentiment;
  post.category = audit.category;      // AI decides the tag, not the author
  post.status = 'approved';
  post.rejectReason = '';
  post.moderatedAt = new Date();
  // Semantic embedding for personalised feed + semantic search (null if no API key).
  try {
    const vec = await embedText(post.message);
    if (vec) post.embedding = vec;
  } catch { /* non-fatal */ }
  await post.save();

  // Learn the author's interests from what they publish (real user posts only).
  if (!post.isBot) {
    recordSignal(post.senderEmail, { text: post.message, category: post.category, weight: 2 });
  }

  // Reward the author only once the post is actually published
  try {
    await awardJoy(post.senderEmail, 15, 'community_post', 'Đăng bài viết mới lên cộng đồng');
  } catch (err) {
    console.warn('[Community JOY] award warning:', err.message);
  }

  // Broadcast push notifications to nearby neighbors (best-effort, non-blocking)
  broadcastCommunityPush(post).catch(err => console.error('[Community Push]', err));
}

function enqueueModeration(postId) {
  moderationChain = moderationChain
    .then(() => moderateOnePost(postId))
    .catch(err => console.error('[Moderation Queue] job failed:', err));
  return moderationChain;
}

// Push helper extracted so both the queue and startup requeue can reuse it.
async function broadcastCommunityPush(post) {
  try {
    const email = post.senderEmail;
    const lat = post.location?.lat;
    const lng = post.location?.lng;
    const senderBio = await Bio.findOne({ email }, 'address').lean();
    const title = `[Cộng đồng] Bài viết mới từ ${post.senderName}`;
    const body = (post.message || '').substring(0, 80);
    const url = '/member/account';

    const candidates = await Bio.find(
      { email: { $ne: email } },
      'email slug displayName trustedLocation lastLocationCheck address'
    ).lean();

    for (const cand of candidates) {
      let cLat = null, cLng = null;
      if (cand.lastLocationCheck && cand.lastLocationCheck.lat !== null) {
        cLat = cand.lastLocationCheck.lat; cLng = cand.lastLocationCheck.lng;
      } else if (cand.trustedLocation && cand.trustedLocation.lat !== null) {
        cLat = cand.trustedLocation.lat; cLng = cand.trustedLocation.lng;
      }
      let isNear = false;
      if (cLat !== null && cLng !== null && lat != null && lng != null) {
        const dist = distanceKm(lat, lng, cLat, cLng);
        if (dist !== null && dist <= 50) isNear = true;
      } else if (senderBio?.address && cand.address) {
        const clean = str => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
        const reqWords = clean(senderBio.address).filter(w => w.length >= 3);
        const candWords = clean(cand.address).filter(w => w.length >= 3);
        if (reqWords.some(w => candWords.includes(w))) isNear = true;
      }
      if (isNear) sendPushNotification(cand.email, title, body, url).catch(() => {});
    }
  } catch (err) {
    console.error('[Community Chat Push] Broadcast failed:', err);
  }
}

// On boot, resume moderating any posts left 'pending' from a previous run.
(async () => {
  try {
    const pending = await CommunityMessage.find({ status: 'pending' }, '_id').sort({ createdAt: 1 }).lean();
    pending.forEach(p => enqueueModeration(p._id));
    if (pending.length) console.log(`[Moderation Queue] Requeued ${pending.length} pending post(s).`);
  } catch (err) {
    console.warn('[Moderation Queue] Requeue skipped:', err.message);
  }
})();

// Hugo Studio accent palette for the anonymous avatar disc (picked at post time).
const ANON_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

// Anonymous posts keep the real senderEmail in the DB (ownership checks) but it
// must never reach other readers' clients.
const maskAnonPost = (doc, viewerEmail) => {
  const p = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  if (p.anonymous && p.senderEmail !== viewerEmail) p.senderEmail = 'anon';
  return p;
};

// GET /community/chat - Fetch approved posts (and current user's pending/rejected ones)
// ?rank=smart → personalise order by the requester's interest embedding.
router.get('/community/chat', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const smart = req.query.rank === 'smart';

    const query = { $or: [{ status: 'approved' }, { senderEmail: email }] };

    if (!smart) {
      const messages = await CommunityMessage.find(query).sort({ createdAt: -1 }).limit(300);
      return res.json({ success: true, messages: messages.map((m) => maskAnonPost(m, email)) });
    }

    // Smart ranking: blend semantic relevance (cosine to interest vector) with
    // recency. Falls back to chronological when embeddings aren't available.
    const { vec: interestVec, at } = await getInterestEmbedding(email);

    // Refresh a stale/missing interest embedding in the background for next time.
    if (!at || Date.now() - new Date(at).getTime() > 6 * 60 * 60 * 1000) {
      refreshInterestEmbedding(email).catch(() => {});
    }

    const docs = await CommunityMessage.find(query).select('+embedding').sort({ createdAt: -1 }).limit(300).lean();

    if (interestVec) {
      const now = Date.now();
      const HALF_LIFE = 48 * 60 * 60 * 1000; // recency half-life ~2 days
      for (const d of docs) {
        const rel = d.embedding?.length ? cosine(interestVec, d.embedding) : 0; // -1..1
        const ageMs = now - new Date(d.createdAt).getTime();
        const recency = Math.pow(0.5, ageMs / HALF_LIFE); // 0..1
        d._score = 0.62 * ((rel + 1) / 2) + 0.38 * recency;
      }
      docs.sort((a, b) => (b._score || 0) - (a._score || 0));
    }
    // Never ship the big vectors / internal score to the client.
    for (const d of docs) { delete d.embedding; delete d._score; maskAnonPost(d, email); }

    res.json({ success: true, messages: docs, personalized: !!interestVec });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /community/search?q= - Semantic search over approved posts.
router.get('/community/search', requireMember, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ success: true, messages: [] });

    const qVec = await embedText(q);
    const docs = await CommunityMessage.find({ status: 'approved' }).select('+embedding').sort({ createdAt: -1 }).limit(300).lean();

    if (qVec) {
      for (const d of docs) d._score = d.embedding?.length ? cosine(qVec, d.embedding) : 0;
      docs.sort((a, b) => (b._score || 0) - (a._score || 0));
    } else {
      // No embeddings → keyword fallback.
      const nq = q.toLowerCase();
      const hit = docs.filter((d) => (d.message || '').toLowerCase().includes(nq) || (d.senderName || '').toLowerCase().includes(nq));
      hit.length && (docs.length = 0, docs.push(...hit));
    }
    const top = docs.slice(0, 40);
    for (const d of top) { delete d.embedding; delete d._score; maskAnonPost(d, req.memberEmail); }
    res.json({ success: true, messages: top, semantic: !!qVec });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /community/insights - the requester's "chân dung số" (transparency + UI).
router.get('/community/insights', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const [interests, peakHour] = await Promise.all([getTopInterests(email, 8), getPeakHour(email)]);
    res.json({ success: true, interests, peakHour });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /community/chat - Send a new community post
router.post('/community/chat', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { message, lat, lng, anonymous } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung bài viết không được trống' });
    }

    // Enforce word limit (350 words)
    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount > 350) {
      return res.status(400).json({ error: `Bài viết quá dài (${wordCount}/350 từ). Vui lòng rút ngắn lại.` });
    }

    if (lat === null || lng === null || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'Cần có tọa độ địa lý để đăng bài viết.' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    // Anonymous posting is a paid option: fail fast before saving anything.
    if (anonymous && (bio.joyBalance || 0) < 20) {
      return res.status(400).json({ error: `Bạn cần 20 JOY để đăng bài ẩn danh (hiện có ${bio.joyBalance || 0} JOY).` });
    }

    // Create the post as 'pending' and hand it to the sequential AI queue.
    // Tag/sentiment are filled in by the queue on approval; the author does not
    // choose the tag. The response returns immediately so the client can show
    // a "đang xét duyệt" state without waiting on the AI call.
    const newMsg = new CommunityMessage({
      senderEmail: email,
      senderName: anonymous ? 'Người ẩn danh' : (bio.displayName || email.split('@')[0]),
      senderAvatar: anonymous ? '' : (bio.avatarUrl || ''),
      senderSlug: anonymous ? '' : (bio.slug || ''),
      anonymous: !!anonymous,
      anonColor: anonymous ? ANON_COLORS[Math.floor(Math.random() * ANON_COLORS.length)] : '',
      message: message.trim(),
      location: { lat, lng },
      status: 'pending',
      createdAt: new Date()
    });

    await newMsg.save();

    // Charge AFTER the post exists so the ledger receipt can reference it
    // (refId = post id → a proper invoice row in the JOY history). If the
    // charge fails the post is rolled back — never post anonymously for free.
    let joyBalance;
    if (anonymous) {
      try {
        const receipt = await awardJoy(email, -20, 'community_anon_post', 'Đăng bài ẩn danh trên cộng đồng (-20 JOY)', {
          refId: String(newMsg._id),
          notificationTitle: 'Hóa đơn: Đăng bài ẩn danh',
          notificationMessage: `Đã trừ 20 JOY cho bài đăng ẩn danh #${String(newMsg._id).slice(-6).toUpperCase()}.`
        });
        joyBalance = receipt.balance;
      } catch (err) {
        await CommunityMessage.deleteOne({ _id: newMsg._id });
        if (err.message === 'INSUFFICIENT_JOY') {
          return res.status(400).json({ error: 'Bạn cần 20 JOY để đăng bài ẩn danh.' });
        }
        throw err;
      }
    }

    enqueueModeration(newMsg._id);

    res.json({ success: true, message: newMsg, ...(anonymous ? { joyCharged: 20, joyBalance } : {}) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /community/chat/:id - Edit an existing post
router.put('/community/chat/:id', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { message } = req.body;
    const { id } = req.params;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Nội dung bài viết không được trống' });
    }

    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount > 350) {
      return res.status(400).json({ error: `Bài viết quá dài (${wordCount}/350 từ). Vui lòng rút ngắn lại.` });
    }

    const post = await CommunityMessage.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    if (post.senderEmail !== email) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa bài viết của người khác' });
    }

    // Edits are re-moderated through the same queue: reset to pending, then
    // the AI re-checks language and re-tags. The cached on-demand glossary is
    // invalidated because the content changed.
    post.message = message.trim();
    post.status = 'pending';
    post.rejectReason = '';
    post.glossary = [];
    post.glossaryAt = null;
    post.updatedAt = new Date();

    await post.save();
    enqueueModeration(post._id);
    res.json({ success: true, message: post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /community/chat/:id - Delete a post
router.delete('/community/chat/:id', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { id } = req.params;

    const post = await CommunityMessage.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    if (post.senderEmail !== email) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bài viết này' });
    }

    await CommunityMessage.deleteOne({ _id: id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /community/chat/:id/resolve - Author marks their question thread answered
router.post('/community/chat/:id/resolve', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { id } = req.params;

    const post = await CommunityMessage.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }
    if (post.senderEmail !== email) {
      return res.status(403).json({ error: 'Chỉ tác giả mới có thể đánh dấu' });
    }
    if (post.category !== 'câu hỏi') {
      return res.status(400).json({ error: 'Chỉ áp dụng cho bài Câu hỏi' });
    }

    post.resolved = !post.resolved;
    post.updatedAt = new Date();
    await post.save();

    res.json({ success: true, resolved: post.resolved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /community/chat/:id/glossary - Build the term glossary on demand.
// Generated once per post (cached via glossaryAt) and only when a reader asks,
// so we never spend tokens explaining posts nobody needs explained.
router.post('/community/chat/:id/glossary', requireMember, async (req, res) => {
  try {
    const post = await CommunityMessage.findById(req.params.id);
    if (!post || post.status !== 'approved') {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }
    if (post.glossaryAt) {
      return res.json({ success: true, glossary: post.glossary });
    }

    let glossary = [];
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const prompt = `Tìm TỐI ĐA 3 thuật ngữ HỌC THUẬT / chuyên ngành thật sự khó trong bài viết dưới đây mà học sinh - sinh viên có thể chưa hiểu. BỎ QUA từ viết tắt thông dụng, teencode, tiếng lóng, tên riêng phổ biến — chỉ giữ thuật ngữ học thuật. Trả về DUY NHẤT JSON dạng [{"term":"...","definition":"..."}], mỗi định nghĩa đúng 1 câu ngắn gọn, cùng ngôn ngữ với bài viết. Nếu không có thuật ngữ nào, trả về [].

Bài viết: "${post.message.replace(/"/g, '\\"')}"`;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODERATION_MODEL}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
          }
        );
        if (response.ok) {
          const data = await response.json();
          const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            glossary = parsed
              .filter(g => g && g.term && g.definition)
              .slice(0, 3)
              .map(g => ({ term: String(g.term).slice(0, 120), definition: String(g.definition).slice(0, 300) }));
          }
        }
      } catch (err) {
        console.error('[Glossary] generation failed:', err.message);
      }
    }

    post.glossary = glossary;
    post.glossaryAt = new Date();
    await post.save();

    res.json({ success: true, glossary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /community/chat/:id/like - Toggle liking a post (+5 JOY reward)
router.post('/community/chat/:id/like', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { id } = req.params;

    const post = await CommunityMessage.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const bio = await Bio.findOne({ email });
    const displayName = bio?.displayName || email.split('@')[0];

    const hasLiked = post.likes.includes(email);
    if (hasLiked) {
      post.likes = post.likes.filter(e => e !== email);
    } else {
      post.likes.push(email);
    }
    await post.save();

    // Respond immediately; JOY reward + push happen in the background so the
    // like feels instant.
    res.json({ success: true, likes: post.likes });

    (async () => {
      try {
        await awardJoy(
          post.senderEmail,
          hasLiked ? -5 : 5,
          'community_like_received',
          hasLiked ? `Bài viết bị bỏ thả tim bởi ${displayName}` : `Bài viết được thả tim bởi ${displayName}`
        );
      } catch (err) {
        console.warn('[Like Reward] Balance update warning:', err.message);
      }
      if (!hasLiked && post.senderEmail !== email && !post.isBot) {
        sendPushNotification(
          post.senderEmail,
          '❤️ Bài viết được thả tim',
          `${displayName} đã thích bài viết của bạn`,
          '/member/account'
        ).catch(() => {});
      }
      // Liking something signals interest in that topic.
      if (!hasLiked) recordSignal(email, { text: post.message, category: post.category, weight: 1 });
    })();
    return;
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /community/chat/:id/comments - Add a reply comment (+7 JOY reward)
router.post('/community/chat/:id/comments', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Bình luận không được trống' });
    }

    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount > 350) {
      return res.status(400).json({ error: `Bình luận quá dài (${wordCount}/350 từ). Vui lòng rút ngắn lại.` });
    }

    const post = await CommunityMessage.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    // Fast, lenient comment moderation (blocklist only — no AI, no VI/EN gate).
    const audit = moderateComment(message.trim());
    if (audit.status === 'rejected') {
      return res.status(400).json({ error: 'Bình luận chứa nội dung không phù hợp.' });
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      senderEmail: email,
      senderName: bio.displayName || email.split('@')[0],
      senderAvatar: bio.avatarUrl || '',
      message: message.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    // Respond immediately; JOY reward + push run in the background.
    res.json({ success: true, comments: post.comments });

    (async () => {
      try {
        await awardJoy(email, 7, 'community_comment', 'Bình luận bài viết cộng đồng');
      } catch (err) {
        console.warn('[Comment Reward] warning:', err.message);
      }
      if (post.senderEmail !== email && !post.isBot) {
        sendPushNotification(
          post.senderEmail,
          '💬 Bình luận mới về bài của bạn',
          `${newComment.senderName}: ${message.trim().slice(0, 60)}`,
          '/member/account'
        ).catch(() => {});
      }
      // Commenting is a strong interest signal (they engaged deeply).
      recordSignal(email, { text: `${message} ${post.message}`, category: post.category, weight: 1.5 });
    })();
    return;
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /community/chat/:id/comments/:commentId - Edit a reply comment
router.put('/community/chat/:id/comments/:commentId', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { id, commentId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Bình luận không được trống' });
    }

    const wordCount = message.trim().split(/\s+/).length;
    if (wordCount > 350) {
      return res.status(400).json({ error: `Bình luận quá dài (${wordCount}/350 từ). Vui lòng rút ngắn lại.` });
    }

    const post = await CommunityMessage.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    if (comment.senderEmail !== email) {
      return res.status(403).json({ error: 'Bạn không có quyền sửa bình luận này' });
    }

    // Perform AI pre-moderation on edit
    const audit = await auditContent(message.trim());
    if (audit.status === 'rejected') {
      return res.status(400).json({ error: 'Nội dung chỉnh sửa bị từ chối phê duyệt do không phù hợp.' });
    }

    comment.message = message.trim();
    comment.updatedAt = new Date();

    await post.save();
    res.json({ success: true, comments: post.comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /community/chat/:id/comments/:commentId - Delete a reply comment
router.delete('/community/chat/:id/comments/:commentId', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { id, commentId } = req.params;

    const post = await CommunityMessage.findById(id);
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Không tìm thấy bình luận' });
    }

    if (comment.senderEmail !== email) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này' });
    }

    post.comments.pull(commentId);
    await post.save();

    res.json({ success: true, comments: post.comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;