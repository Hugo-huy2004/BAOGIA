import express from 'express';
import Bio from '../models/Bio.js';
import { uploadAvatar, deleteAvatar } from '../utils/cloudinary.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { fetchWithCache, clearCache } from '../utils/cacheHelper.js';
import { encryptText, decryptText, hashPassword, comparePassword } from '../utils/cryptoUtils.js';
import { cleanupExpiredBirthdayNotifications } from '../utils/birthdayAutomation.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { ensureReferralCode, applyReferral } from '../utils/referralService.js';
import { isEduEmail } from '../utils/eduEmail.js';
import { broadcastToEmail } from '../utils/realtime.js';

const router = express.Router();

const TWELVE_MONTHS_MS = 1000 * 60 * 60 * 24 * 365;

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

router.get('/me', async (req, res) => {
  try {
    const { email, displayName, avatarUrl } = req.query;

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
router.post('/me/verification', async (req, res) => {
  try {
    const { email, fullName, birthday, schoolLevel, schoolName, schoolIdCode, phoneZalo, avatarUrl } = req.body;

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
router.post('/me/onboarding', async (req, res) => {
  try {
    const { email, phone, referrerCode } = req.body;
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
router.post('/me/dismiss-notification', async (req, res) => {
  try {
    const { email } = req.body;

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

router.post('/', async (req, res) => {
  try {
    const { 
      email, 
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

router.put('/:id', async (req, res) => {
  try {
    const existing = await Bio.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    
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
router.post('/contacts/sync/:id', async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
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
router.delete('/contacts/:id/:contactId', async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    bio.backedUpContacts = bio.backedUpContacts.filter(c => c._id.toString() !== req.params.contactId);
    await bio.save();
    clearCache(`bio_slug_${bio.slug}`);

    res.json({ success: true, contacts: bio.backedUpContacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;