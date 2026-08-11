import express from 'express';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import Bio from '../models/Bio.js';
import ArcadeScore from '../models/ArcadeScore.js';
import { uploadAvatar, deleteAvatar } from '../utils/cloudinary.js';
import { requireAdmin, requireMember, attachMemberAge } from '../middleware/authMiddleware.js';
import { bioAge, isMinorAge } from '../utils/memberAge.js';
import { missingProfileFields, applyProfileValues, describeField } from '../utils/profileRequirements.js';
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
import { getStageCertificate } from '../utils/coderExamService.js';
import InAppNotification from '../models/InAppNotification.js';
import NotificationSubscription from '../models/NotificationSubscription.js';
import { discoverPlaces } from '../services/discoveryService.js';
import CommunityPlace from '../models/CommunityPlace.js';
import webpush from 'web-push';
import rateLimit from 'express-rate-limit';
import { appInstallationPolicy } from '../../shared/appInstallationPolicy.js';
import { findActiveSecurityBlock, sendSecurityBlockResponse } from '../services/securityEnforcement.js';

const discoverLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Bạn đang tìm kiếm quá nhanh. Vui lòng đợi một chút.' }
});

const checkLocationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Bạn đang cập nhật vị trí quá nhanh. Vui lòng đợi vài phút.' }
});

const skinAnalysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Bạn đang thực hiện quét da quá thường xuyên. Vui lòng đợi 15 phút.' }
});

const router = express.Router();

const TWELVE_MONTHS_MS = 1000 * 60 * 60 * 24 * 365;

async function rejectBlacklistedPhone(res, phone) {
  if (!phone || !String(phone).trim()) return false;
  const block = await findActiveSecurityBlock({ phone });
  if (!block) return false;
  sendSecurityBlockResponse(res, block);
  return true;
}

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
      '/member/activity'
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
    const [bios, totalMatched, totalCount, activeCount, lockedCount, pendingCount, rejectedCount, lifetimeCount, locationAnomalyCount] = await Promise.all([
      Bio.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Bio.countDocuments(query),
      Bio.countDocuments(),
      Bio.countDocuments({ status: 'active' }),
      Bio.countDocuments({ status: 'locked' }),
      Bio.countDocuments({ status: 'pending' }),
      Bio.countDocuments({ status: 'rejected' }),
      Bio.countDocuments({ expiresAt: null }),
      Bio.countDocuments({ locationAnomaly: true })
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
        lifetime: lifetimeCount,
        locationAnomaly: locationAnomalyCount
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

// PATCH: gắn/gỡ hạng danh dự Star-VIP. Star-14 và Star-18 suy ra từ ngày sinh
// nên không có (và không cần) endpoint sửa tay — chỉ hạng danh dự là quyết định
// của con người.
router.patch('/:id/vip', requireAdmin, async (req, res) => {
  try {
    const starVip = Boolean(req.body?.starVip);
    const bio = await Bio.findByIdAndUpdate(req.params.id, { $set: { starVip } }, { new: true });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    clearCache(`bio_slug_${bio.slug}`);
    res.json({ success: true, starVip: bio.starVip });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Lock/Unlock/Approve/Reject bio
router.patch('/:id/status', requireAdmin, async (req, res) => {
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

// DELETE /bios/:id (Admin only) - Vĩnh viễn xóa tài khoản người dùng và toàn bộ dữ liệu đi kèm (bao gồm ArcadeScore)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const bio = await Bio.findById(id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    }

    const userEmail = bio.email;
    const userDisplayName = bio.displayName;

    // 1. Xóa hồ sơ Bio
    await Bio.deleteOne({ _id: id });

    // 2. Xóa toàn bộ điểm Arcade liên quan (xoá triệt để khỏi Bảng xếp hạng)
    const scoreFilters = [];
    if (userEmail) scoreFilters.push({ email: userEmail });
    if (userDisplayName) scoreFilters.push({ displayName: userDisplayName });

    if (scoreFilters.length > 0) {
      await ArcadeScore.deleteMany({ $or: scoreFilters });
    }

    // 3. Clear public cache
    if (bio.slug) clearCache(`bio_slug_${bio.slug}`);

    res.json({ success: true, message: `Đã xóa vĩnh viễn tài khoản của ${userDisplayName || userEmail}` });
  } catch (error) {
    console.error('Delete user error:', error);
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
      // Kèm luôn "hồ sơ còn thiếu gì" để portal khỏi tự đoán bằng luật riêng —
      // đó chính là chỗ trước đây client và server lệch nhau.
      bioObj.profileMissing = missingProfileFields(bioDoc).map(describeField);
      return res.json({ bio: bioObj });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /me/bootstrap — Eager Load Consolidated User Context
router.get('/me/bootstrap', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const [bioDoc, unreadCount, recentNotifications] = await Promise.all([
      Bio.findOne({ $or: [{ email }, { contactEmail: email }] }),
      InAppNotification.countDocuments({ email, read: false }).catch(() => 0),
      InAppNotification.find({ email }).sort({ createdAt: -1 }).limit(5).catch(() => [])
    ]);

    if (!bioDoc) {
      return res.status(404).json({ error: 'Bio profile not found' });
    }

    const recentContacts = (bioDoc.recentTransferContacts || []).slice(0, 5);
    const bioObj = bioDoc.toObject();
    if (bioObj.secretLinks && Array.isArray(bioObj.secretLinks)) {
      bioObj.secretLinks = bioObj.secretLinks.map(link => ({
        ...link,
        url: decryptText(link.url),
        password: ''
      }));
    }
    bioObj.installedUtilities = appInstallationPolicy.normalizeInstalled(bioObj.installedUtilities);
    bioObj.homeScreenUtilities = appInstallationPolicy.normalizeHomeScreen(
      bioObj.homeScreenUtilities,
      bioObj.installedUtilities,
    );

    const payload = {
      bio: bioObj,
      wallet: {
        balance: bioDoc.joyBalance || 0,
        currency: 'JOY',
        hasPin: !!bioDoc.transactionPin,
        referralCode: bioDoc.referralCode || '',
        referralCount: bioDoc.referralCount || 0
      },
      workspace: {
        installedApps: appInstallationPolicy.normalizeInstalled(bioDoc.installedUtilities),
        homeScreenApps: appInstallationPolicy.normalizeHomeScreen(
          bioDoc.homeScreenUtilities,
          bioDoc.installedUtilities,
        ),
      },
      notifications: {
        unreadCount,
        recent: recentNotifications
      },
      recentContacts,
      serverTime: new Date().toISOString()
    };

    const etagSeed = JSON.stringify({
      updatedAt: bioDoc.updatedAt || bioDoc.createdAt,
      unreadCount,
      balance: payload.wallet.balance,
      installedApps: payload.workspace.installedApps,
      coderAccess: {
        all: Boolean(bioDoc.hugoCoderAll7Lifetime),
        basic: Boolean(bioDoc.hugoCoderBasicLifetime),
        intermediate: Boolean(bioDoc.hugoCoderIntermediateLifetime),
        advanced: Boolean(bioDoc.hugoCoderAdvancedLifetime),
        security: Boolean(bioDoc.hugoCoderSecurityLifetime),
        project: Boolean(bioDoc.hugoCoderUltimateLifetime),
        devops: Boolean(bioDoc.hugoCoderDevopsLifetime)
      }
    });
    const etag = `W/"${createHash('sha256').update(etagSeed).digest('base64url').slice(0, 32)}"`;

    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    return res.json(payload);
  } catch (error) {
    console.error('[Bootstrap API Error]', error);
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
    if (await rejectBlacklistedPhone(res, phoneZalo)) return;

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
// GET /me/profile-gaps — hồ sơ còn thiếu thông tin bắt buộc nào. Client dựng
// form từ đúng danh sách này, nên không bao giờ hỏi thừa hay hỏi thiếu.
router.get('/me/profile-gaps', requireMember, async (req, res) => {
  try {
    let bio = await Bio.findOne({ email: req.memberEmail });
    if (!bio) bio = await Bio.findOne({ contactEmail: req.memberEmail });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });
    res.json({
      missing: missingProfileFields(bio).map(describeField),
      onboardingCompleted: Boolean(bio.onboardingCompleted),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/onboarding — ghi những thông tin client vừa điền (mục nào gửi thì
// ghi mục đó), sinh mã giới thiệu và áp mã người giới thiệu nếu có.
router.post('/me/onboarding', requireMember, async (req, res) => {
  try {
    const { referrerCode } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (await rejectBlacklistedPhone(res, req.body.phone)) return;

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    try {
      applyProfileValues(bio, req.body);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const referralCode = await ensureReferralCode(bio);

    // Mã giới thiệu áp được hay không KHÔNG được làm hỏng phần lưu hồ sơ —
    // trước đây một lỗi ở đây là mất cả hai.
    let referralResult = null;
    let referralError = null;
    if (referrerCode && String(referrerCode).trim()) {
      try {
        referralResult = await applyReferral(bio, referrerCode);
      } catch (err) {
        referralError = err.message;
      }
    }

    const stillMissing = missingProfileFields(bio);
    bio.onboardingCompleted = stillMissing.length === 0;
    await bio.save();

    res.json({
      success: true,
      referralCode,
      joyAwarded: referralResult?.joyAwarded || 0,
      bioExtendedDays: referralResult?.bioExtendedDays || 0,
      referralError,
      missing: stillMissing.map(describeField),
      onboardingCompleted: bio.onboardingCompleted,
      profile: {
        phone: bio.phone || '',
        birthDay: bio.birthDay || 0,
        birthMonth: bio.birthMonth || 0,
        birthYear: bio.birthYear || 0,
      },
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
router.post('/me/check-location', requireMember, checkLocationLimiter, async (req, res) => {
  try {
    const { lat, lng, force } = req.body;
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
    
    // Check if they stayed in place (dist < 150m for 10-15 mins)
    const prevCheck = bio.lastLocationCheck;
    let stayedInLocation = false;
    if (prevCheck && prevCheck.lat && prevCheck.checkedAt) {
      const timeDiffMins = (Date.now() - new Date(prevCheck.checkedAt).getTime()) / (60 * 1000);
      const distMeters = distanceKm(prevCheck.lat, prevCheck.lng, lat, lng) * 1000;
      
      // Stayed within 150m for between 10 and 45 minutes
      if (distMeters < 150 && timeDiffMins >= 10 && timeDiffMins <= 45) {
        stayedInLocation = true;
      }
    }

    bio.lastLocationCheck = { lat, lng, distanceKm: distance, checkedAt: new Date() };
    await bio.save();

    // Trigger recommendation if stayed in location or forced via request
    if (stayedInLocation || force === true) {
      (async () => {
        try {
          let addressName = '';
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
              headers: { 'User-Agent': 'HugoStudio/1.0 (support@hugostudio.vn)' }
            });
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              addressName = geoData.display_name || '';
            }
          } catch (geoErr) {
            console.warn('[Nominatim] Reverse geocoding failed:', geoErr.message);
          }

          // Chỉ dùng địa điểm THẬT (Google khi có key, OpenStreetMap khi không).
          // Không tìm được quán thật nào quanh đây thì không gửi gợi ý —
          // tuyệt đối không sinh dữ liệu giả.
          let placesList = [];
          try {
            const { places } = await discoverPlaces({ lat, lng });
            placesList = places.slice(0, 8);
          } catch (discErr) {
            console.warn('[LocalRec] discoverPlaces failed:', discErr.message);
          }
          if (placesList.length === 0) return;

          const title = 'Bạn đang dừng chân tại ' + (addressName ? addressName.split(',')[0] : 'khu vực này') + '?';
          const body = 'Hugo tìm thấy ' + placesList.length + ' địa điểm ăn uống, giải trí có thật gần bạn. Mở tab Khám phá xem ngay nhé!';
          // Route thật là /member/map (xem App.jsx). '/member/portal?tab=map'
          // không khớp route nào — bấm vào thông báo là rơi về trang trắng.
          const url = '/member/map';

          await InAppNotification.create({
            email,
            // 'inbox' KHÔNG có trong enum của schema → Mongoose từ chối và
            // thông báo này chưa bao giờ được lưu. Xem InAppNotification.js.
            type: 'info',
            category: 'system',
            title,
            message: body,
            actionUrl: url
          });

          const subs = await NotificationSubscription.find({ email });
          if (subs.length) {
            for (const sub of subs) {
              try {
                await webpush.sendNotification(sub.subscription, JSON.stringify({
                  title,
                  body,
                  icon: '/image/avt7.png',
                  badge: '/image/badge.png',
                  url,
                  tag: 'local_rec'
                }));
              } catch (pushErr) {
                if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                  await NotificationSubscription.deleteOne({ _id: sub._id });
                }
              }
            }
          }

          await Bio.updateOne({ email }, { $set: { lastRecommendationAt: new Date() } });
        } catch (err) {
          console.error('[LocalRec] Error generating local recommendations:', err.message);
        }
      })();
    }

    const isAnomaly = distance > 50;
    if (isAnomaly) {
      bio.locationAnomaly = true;
      await bio.save();
    }

    res.json({ success: true, anomaly: isAnomaly, distanceKm: Math.round(distance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/reset-trusted-location  { email, lat, lng, pin } — member confirms
// "yes this is really me, this is my new normal location" after a forced
// re-login from an anomaly, so they aren't logged out again immediately.
router.post('/me/reset-trusted-location', requireMember, async (req, res) => {
  try {
    const { lat, lng, pin } = req.body;
    const email = req.memberEmail;
    if (!email || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'email, lat and lng are required' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    if (bio.transactionPin) {
      if (!pin) {
        return res.status(400).json({ error: 'Xác thực mã PIN là bắt buộc để khôi phục vị trí.' });
      }
      const isValid = await comparePassword(String(pin), bio.transactionPin);
      if (!isValid) {
        return res.status(403).json({ error: 'Mã PIN xác thực không chính xác.' });
      }
    }

    bio.trustedLocation = { lat, lng, updatedAt: new Date() };
    bio.locationAnomaly = false; // Reset anomaly state
    await bio.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /me/discover?lat=&lng=&category=&q=&open=&sort= — live nearby places
// (Google Places khi có GOOGLE_MAPS_API_KEY, fallback OpenStreetMap), lọc và
// xếp hạng theo cá tính người dùng (UserProfile.interests).
// Địa điểm không hợp với thành viên dưới 18 — lọc khỏi kết quả Khám phá thay
// vì chỉ ẩn nút trên giao diện.
const ADULT_VENUE_RE = /(\bbar\b|\bpub\b|beer|bia hơi|bia tươi|rượu|wine|whisky|cocktail|club|lounge|karaoke|casino|shisha|vape|cigar|thuốc lá|massage|hookah|nightlife)/i;

const INTEREST_CATEGORY_KEYWORDS = {
  cafe: /cà phê|cafe|coffee|trà|đồ uống|check-?in|discover_cafe/i,
  food: /ăn|food|món|ẩm thực|nấu|quán|discover_food/i,
  play: /game|chơi|phim|nhạc|giải trí|thể thao|du lịch|arcade|discover_play/i
};

// Time-of-day category boost (hour is the CLIENT's local hour — server may be UTC).
function timeOfDayBoosts(hour) {
  if (hour >= 6 && hour < 11) return { cafe: 2, food: 1 };        // sáng: cà phê, ăn sáng
  if (hour >= 11 && hour < 14) return { food: 2.5 };              // trưa: ăn uống
  if (hour >= 14 && hour < 17) return { cafe: 2 };                // xế: cà phê chill
  if (hour >= 17 && hour < 22) return { food: 1.5, play: 2 };     // tối: ăn tối, vui chơi
  return { play: 1.5 };                                           // khuya
}

function parseDiscoveryBounds(raw) {
  const values = String(raw || "").split(",").map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) return null;
  const [west, south, east, north] = values;
  if (west >= east || south >= north) return null;
  return { west, south, east, north };
}

function clusterDiscoveryPlaces(places, zoom = 14) {
  if (zoom >= 15 || places.length < 2) return places;
  const cellSize = Math.max(0.0015, 360 / (2 ** (zoom + 5)));
  const buckets = new Map();

  for (const place of places) {
    const key = `${Math.floor(place.lat / cellSize)}:${Math.floor(place.lng / cellSize)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(place);
  }

  return [...buckets.entries()].map(([key, bucket]) => {
    if (bucket.length === 1) return bucket[0];
    const lats = bucket.map((item) => item.lat);
    const lngs = bucket.map((item) => item.lng);
    return {
      id: `cluster-${zoom}-${key}`,
      cluster: true,
      pointCount: bucket.length,
      lat: lats.reduce((sum, value) => sum + value, 0) / bucket.length,
      lng: lngs.reduce((sum, value) => sum + value, 0) / bucket.length,
      bounds: [
        Math.min(...lngs),
        Math.min(...lats),
        Math.max(...lngs),
        Math.max(...lats),
      ],
    };
  });
}

router.get('/me/discover', requireMember, attachMemberAge, discoverLimiter, async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    const category = ['food', 'cafe', 'play'].includes(req.query.category) ? req.query.category : '';
    const q = String(req.query.q || '').slice(0, 80);
    const openOnly = req.query.open === '1';
    const sort = req.query.sort || 'smart';
    const bounds = parseDiscoveryBounds(req.query.bbox);
    const zoom = Math.min(20, Math.max(1, Number(req.query.zoom) || 14));
    const queryLat = bounds ? (bounds.south + bounds.north) / 2 : lat;
    const queryLng = bounds ? (bounds.west + bounds.east) / 2 : lng;
    const clientHour = Number.isInteger(Number(req.query.hour)) && Number(req.query.hour) >= 0 && Number(req.query.hour) < 24
      ? Number(req.query.hour)
      : new Date().getHours();

    const [{ places, source }, interests, communityDocs] = await Promise.all([
      discoverPlaces({ lat: queryLat, lng: queryLng, category, q }).catch(err => {
        console.warn('[Discovery] discoverPlaces failed:', err.message);
        return { places: [], source: 'none' };
      }),
      getTopInterests(req.memberEmail, 12).catch(() => []),
      CommunityPlace.find(bounds ? {
        lat: { $gte: bounds.south, $lte: bounds.north },
        lng: { $gte: bounds.west, $lte: bounds.east },
        ...(category ? { category } : {})
      } : {}).limit(300).lean().catch(() => [])
    ]);

    // Venues added by members themselves, merged in within the same radius
    const qLower = q.toLowerCase();
    const communityPlaces = communityDocs
      .filter(c =>
        (!category || c.category === category) &&
        (!qLower || c.name.toLowerCase().includes(qLower) || (c.services || '').toLowerCase().includes(qLower)) &&
        (bounds || distanceKm(lat, lng, c.lat, c.lng) * 1000 <= 2500))
      .map(c => ({
        id: `cp-${c._id}`,
        name: c.name,
        category: c.category,
        lat: c.lat,
        lng: c.lng,
        rating: null,
        ratingCount: null,
        openNow: null,
        address: c.address || '',
        priceRange: '',
        review: '',
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${c.lat},${c.lng}`)}`,
        website: c.website || '',
        services: c.services || '',
        menu: c.menu || '',
        phone: c.phone || '',
        source: 'community',
        mine: c.email === req.memberEmail
      }));

    // Which categories match this user's learned interests?
    // Topics 'cafe'/'food'/'play' map 1-1; the regexes catch related topics
    // (e.g. 'game' interest boosts 'play' places).
    const boosts = {};
    for (const { topic, weight } of interests) {
      const w = Math.min(weight, 3);
      if (INTEREST_CATEGORY_KEYWORDS[topic]) {
        boosts[topic] = Math.max(boosts[topic] || 0, w);
        continue;
      }
      for (const [cat, re] of Object.entries(INTEREST_CATEGORY_KEYWORDS)) {
        if (re.test(topic)) boosts[cat] = Math.max(boosts[cat] || 0, w);
      }
    }
    const todBoosts = timeOfDayBoosts(clientHour);

    let result = [...places, ...communityPlaces].map(p => {
      const distM = Math.round(distanceKm(lat, lng, p.lat, p.lng) * 1000);
      const interestBoost = boosts[p.category] || 0;
      const todBoost = todBoosts[p.category] || 0;
      const trusted = (p.ratingCount || 0) >= 50; // enough reviews to trust the rating
      // Proximity dominates: -1 điểm mỗi 200m — quán 2km phải xuất sắc vượt
      // trội mới thắng nổi quán ngay cạnh bạn.
      const score =
        (p.rating || 3.5) * (trusted ? 2.2 : 1.8) +
        (p.openNow === true ? 3 : p.openNow === false ? -6 : 0) +
        interestBoost * 2 +
        todBoost +
        (p.source === 'community' ? 2 : 0) -
        distM / 200;

      // Human-readable "why this place" chips, ordered by strength
      const reasons = [];
      if (p.source === 'community') reasons.push('Quán của thành viên');
      if (distM <= 500) reasons.push('Rất gần bạn');
      if (interestBoost > 0) reasons.push('Hợp gu của bạn');
      if (p.openNow === true) reasons.push('Đang mở cửa');
      if ((p.rating || 0) >= 4.5 && trusted) reasons.push('Đánh giá rất cao');
      if (todBoost >= 2) reasons.push('Hợp khung giờ này');

      return { ...p, distM, score: Math.round(score * 100) / 100, reasons: reasons.slice(0, 3) };
    });

    if (openOnly) result = result.filter(p => p.openNow !== false);
    if (bounds) {
      result = result.filter((place) => (
        place.lng >= bounds.west
        && place.lng <= bounds.east
        && place.lat >= bounds.south
        && place.lat <= bounds.north
      ));
    }
    if (sort === 'near') result.sort((a, b) => a.distM - b.distM);
    else if (sort === 'top') result.sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.distM - b.distM);
    else result.sort((a, b) => b.score - a.score);

    if (isMinorAge(req.memberAge)) {
      result = result.filter((place) => !ADULT_VENUE_RE.test(`${place.name || ''} ${place.address || ''} ${place.category || ''}`));
    }

    const visiblePlaces = result.slice(0, 120);
    res.json({
      success: true,
      source,
      personalized: Object.keys(boosts).length > 0,
      places: visiblePlaces,
      mapFeatures: clusterDiscoveryPlaces(visiblePlaces, zoom),
      viewport: bounds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/discover/tap { name, category } — learning signal: every place the
// member opens teaches UserProfile.interests, so "Hợp gu" gets smarter over time.
router.post('/me/discover/tap', requireMember, attachMemberAge, discoverLimiter, async (req, res) => {
  const { name, category } = req.body || {};
  // Không xây hồ sơ thói quen đi lại của thành viên dưới 18.
  if (!isMinorAge(req.memberAge) && typeof name === 'string' && ['food', 'cafe', 'play'].includes(category)) {
    recordSignal(req.memberEmail, {
      text: name.slice(0, 120),
      category: `discover_${category}`,
      weight: 1.5
    });
  }
  res.status(204).end();
});

// POST /me/discover/places — member registers their own venue (name, services,
// menu…) so other members can find it on the Discovery map.
router.post('/me/discover/places', requireMember, discoverLimiter, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { name, category, lat, lng, address, services, menu, phone, website } = req.body || {};
    if (!name || typeof name !== 'string' || !['food', 'cafe', 'play'].includes(category) ||
        !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'Cần tên quán, danh mục và vị trí hợp lệ' });
    }
    const count = await CommunityPlace.countDocuments({ email });
    if (count >= 5) {
      return res.status(400).json({ error: 'Mỗi thành viên chỉ đăng tối đa 5 địa điểm' });
    }
    const doc = await CommunityPlace.create({
      email,
      name: name.trim().slice(0, 80),
      category,
      lat,
      lng,
      address: String(address || '').slice(0, 160),
      services: String(services || '').slice(0, 300),
      menu: String(menu || '').slice(0, 1200),
      phone: String(phone || '').replace(/[^0-9+ ]/g, '').slice(0, 20),
      website: String(website || '').slice(0, 200)
    });
    res.json({ success: true, id: doc._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /me/discover/places/:id — owner removes their venue
router.delete('/me/discover/places/:id', requireMember, async (req, res) => {
  try {
    const r = await CommunityPlace.deleteOne({ _id: req.params.id, email: req.memberEmail });
    if (!r.deletedCount) return res.status(404).json({ error: 'Không tìm thấy địa điểm của bạn' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /discover/logo?domain= — favicon proxy so the client never logs 404s.
// Returns the site's favicon (via Google's favicon service) or 204 when the
// site has none — the client then falls back to its monochrome category icon.
const logoCache = new Map(); // ponytail: in-process cache; fine single-node
router.get('/discover/logo', discoverLimiter, async (req, res) => {
  try {
    const domain = String(req.query.domain || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 100);
    if (!domain || !domain.includes('.')) return res.status(204).end();

    const hit = logoCache.get(domain);
    if (hit !== undefined) {
      if (!hit) return res.status(204).end();
      res.set('Content-Type', hit.type).set('Cache-Control', 'public, max-age=86400');
      return res.send(hit.buf);
    }

    const upstream = await fetch(
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!upstream.ok) {
      logoCache.set(domain, null);
      return res.status(204).end();
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    const type = upstream.headers.get('content-type') || 'image/png';
    if (logoCache.size > 500) logoCache.clear();
    logoCache.set(domain, { buf, type });
    res.set('Content-Type', type).set('Cache-Control', 'public, max-age=86400');
    res.send(buf);
  } catch {
    res.status(204).end();
  }
});

// POST /me/skin-analysis — Lưu kế hoạch, kết quả quét da và lịch sử định kỳ
router.post('/me/skin-analysis', requireMember, skinAnalysisLimiter, async (req, res) => {
  try {
    const email = req.memberEmail;
    const {
      score,
      goldenRatioScore,
      skinType,
      skinTone,
      undertone,
      gender,
      concerns,
      hydrationScore,
      smoothnessScore,
      clarityScore,
      plan
    } = req.body;
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const newAnalysis = {
      score: score || 0,
      goldenRatioScore: goldenRatioScore || 0,
      skinType: skinType || "",
      skinTone: skinTone || "",
      undertone: undertone || "",
      gender: gender || "",
      concerns: Array.isArray(concerns) ? concerns : [],
      hydrationScore: hydrationScore || 0,
      smoothnessScore: smoothnessScore || 0,
      clarityScore: clarityScore || 0,
      plan: plan || {},
      updatedAt: new Date()
    };

    const historyEntry = {
      id: "scan_" + Date.now(),
      score: score || 0,
      goldenRatioScore: goldenRatioScore || 0,
      skinType: skinType || "",
      skinTone: skinTone || "",
      undertone: undertone || "",
      hydrationScore: hydrationScore || 0,
      smoothnessScore: smoothnessScore || 0,
      clarityScore: clarityScore || 0,
      concerns: Array.isArray(concerns) ? concerns : [],
      date: new Date()
    };

    const bio = await Bio.findOneAndUpdate(
      { email },
      {
        $set: { skinAnalysis: newAnalysis },
        $push: {
          skinHistory: {
            $each: [historyEntry],
            $slice: -50 // Giữ tối đa 50 bản ghi lịch sử mới nhất
          }
        }
      },
      { new: true, upsert: true }
    );
    res.json({ success: true, skinAnalysis: bio.skinAnalysis, skinHistory: bio.skinHistory || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /me/skin-history — Lấy lịch sử quét da định kỳ
router.get('/me/skin-history', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(401).json({ error: 'Unauthorized' });
    const bio = await Bio.findOne({ email }).select('skinHistory skinAnalysis');
    res.json({
      success: true,
      skinHistory: bio?.skinHistory || [],
      skinAnalysis: bio?.skinAnalysis || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /me/skin-checklist — Lấy bảng check-list dưỡng da hôm nay
router.get('/me/skin-checklist', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(401).json({ error: 'Unauthorized' });
    const bio = await Bio.findOne({ email }).select('dailySkincareChecklist');
    res.json({
      success: true,
      dailySkincareChecklist: bio?.dailySkincareChecklist || { date: "", completedSteps: [] }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/skin-checklist — Cập nhật checklist dưỡng da hôm nay
router.post('/me/skin-checklist', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { date, completedSteps } = req.body;
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const bio = await Bio.findOneAndUpdate(
      { email },
      {
        $set: {
          dailySkincareChecklist: {
            date: date || new Date().toISOString().split("T")[0],
            completedSteps: Array.isArray(completedSteps) ? completedSteps : []
          }
        }
      },
      { new: true, upsert: true }
    );
    res.json({ success: true, dailySkincareChecklist: bio.dailySkincareChecklist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /me/skin-reminder — Cập nhật cấu hình nhắc nhở skincare
router.post('/me/skin-reminder', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { enabled } = req.body;
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const bio = await Bio.findOneAndUpdate(
      { email },
      { $set: { skincareReminderEnabled: !!enabled } },
      { new: true, upsert: true }
    );
    res.json({ success: true, skincareReminderEnabled: bio.skincareReminderEnabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bios/certificate/:slug/:phase — chứng chỉ chặng HugoCoder công khai.
// Xác thực từ completedLessons trên server: không thể giả mạo bằng cách sửa URL.
router.get('/certificate/:slug/:phase', async (req, res) => {
  try {
    const { slug, phase } = req.params;
    if (global.validSlugs && !global.validSlugs.has(slug)) {
      return res.status(404).json({ error: 'Không tìm thấy chứng chỉ.' });
    }
    const bio = await Bio.findOne({ slug });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy chứng chỉ.' });

    const certificate = getStageCertificate(bio, phase);
    if (!certificate) {
      return res.status(404).json({ error: 'Học viên chưa hoàn thành chặng này.' });
    }

    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trang Bio công khai chỉ được nhận đúng những trường mà giao diện render.
// Trước đây route này trả nguyên document: kèm cả email, joyBalance, PIN, vị
// trí tin cậy, danh bạ sao lưu và verificationRequest (tên thật, tên trường,
// mã học sinh, số Zalo) — đã giải mã sẵn bởi hook post('init').
const PUBLIC_BIO_FIELDS = [
  'slug', 'displayName', 'name', 'avatarUrl', 'headline', 'bio', 'status', 'theme',
  'links', 'projects', 'services', 'tabs', 'decoRoom', 'hobbies', 'jobTitle',
  'skills', 'education', 'birthday', 'height', 'weight', 'measurements',
  'address', 'phone', 'contactEmail', 'secretLinks',
];

// Vị thành niên: cắt thêm mọi trường có thể dùng để tìm ra người thật ngoài
// đời. Đây là khoá cứng theo chính sách, không phải tuỳ chọn người dùng tắt/bật.
const MINOR_HIDDEN_FIELDS = [
  'phone', 'address', 'measurements', 'height', 'weight', 'birthday',
  'education', 'contactEmail',
];

function toPublicBio(doc) {
  const minor = isMinorAge(bioAge(doc));
  const hidden = minor ? new Set(MINOR_HIDDEN_FIELDS) : new Set();
  const out = {};
  for (const field of PUBLIC_BIO_FIELDS) {
    if (hidden.has(field) || doc[field] === undefined) continue;
    out[field] = doc[field];
  }
  // Cho client biết để đặt noindex — trang của vị thành niên không lên Google.
  out.isMinor = minor;
  return out;
}

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
        return toPublicBio(doc);
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
    if (await rejectBlacklistedPhone(res, phone)) return;

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

    // Tháng/năm sinh: khai một lần rồi khoá. Nếu sửa được thoải mái thì cổng
    // 18+ vô nghĩa — ai cũng chỉ cần lùi năm sinh một phút là qua. Sai sót thì
    // admin sửa qua công cụ quản trị.
    const incomingYear = Number(req.body.birthYear);
    const incomingMonth = Number(req.body.birthMonth);
    const incomingDay = Number(req.body.birthDay);
    if (!existing.birthYear && Number.isInteger(incomingYear)) {
      const thisYear = new Date().getFullYear();
      if (incomingYear < 1900 || incomingYear > thisYear) {
        return res.status(400).json({ error: 'Năm sinh không hợp lệ.' });
      }
      existing.birthYear = incomingYear;
      if (Number.isInteger(incomingMonth) && incomingMonth >= 1 && incomingMonth <= 12) {
        existing.birthMonth = incomingMonth;
      }
      if (Number.isInteger(incomingDay) && incomingDay >= 1 && incomingDay <= 31) {
        existing.birthDay = incomingDay;
      }
    }

    // Thành viên dưới 18: khoá cứng những trường có thể lần ra người thật ngoài
    // đời, và mọi liên kết bí mật phải có mật khẩu. Chặn tại đây thay vì ở giao
    // diện vì PUT này gọi thẳng được.
    if (isMinorAge(bioAge(existing))) {
      for (const field of ['address', 'measurements', 'height', 'weight']) {
        if (field in req.body) req.body[field] = '';
      }
      if (Array.isArray(req.body.secretLinks)) {
        req.body.secretLinks = req.body.secretLinks.filter((link) => link?.password);
      }
    }

    // Xóa Cache nếu bio bị chỉnh sửa
    clearCache(`bio_slug_${existing.slug}`);
    
    const { 
      displayName, 
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
      avatarUrl,
      links,
      theme,
      tabs,
      projects,
      services,
      secretLinks,
      antiDeepfakeLock,
      autoLogoutMinutes,
      privateMode,
      installedUtilities,
      homeScreenUtilities
    } = req.body;

    // Handle avatar update / delete / overwrite
    if (avatarUrl !== undefined) {
      if (existing.antiDeepfakeLock && avatarUrl !== existing.avatarUrl) {
        return res.status(403).json({ error: 'Khóa chống giả mạo ảnh đại diện (Anti-Deepfake Lock) đang hoạt động. Vui lòng tắt khóa trước khi thay đổi ảnh.' });
      }
      if (avatarUrl && avatarUrl.startsWith('data:image')) {
        existing.avatarUrl = await uploadAvatar(avatarUrl, existing.email, existing.avatarUrl);
      } else if (avatarUrl === '') {
        if (existing.avatarUrl) {
          await deleteAvatar(existing.avatarUrl);
        }
        existing.avatarUrl = '';
      }
    }

    // Phone, school and login email are EDU identity attributes. They are
    // immutable for every member and can only be changed through the
    // verification/admin workflow. Name and birthday remain member-editable.
    // Preserve this rule at the API boundary so direct requests cannot bypass
    // the Account UI.
    const preserve = (incoming, current) => incoming === undefined ? current : incoming;
    const nextEditableDisplayName = preserve(displayName, existing.displayName);
    const nextEditableBirthday = preserve(birthday, existing.birthday);
    const lockedPhone = existing.phone;
    const lockedEducation = existing.education;
    // Members get exactly one email — the one they signed in with. The
    // separate "Contact Email" field is banned outright (not just for
    // verified accounts) so it can never be (re)introduced via direct API
    // calls now that the UI field is gone; existing legacy values are left
    // alone since other routes still fall back to matching by contactEmail.
    const lockedContactEmail = existing.contactEmail;

    const nextDisplayName = nextEditableDisplayName || existing.displayName;
    const displayNameChanged =
      displayName !== undefined &&
      String(nextDisplayName) !== String(existing.displayName || '');
    const nextSlug = displayNameChanged
      ? await createUniqueSlug(
          normalizeSlug(nextDisplayName || existing.email.split('@')[0]),
          existing._id,
        )
      : existing.slug;

    // Apply strict property-level defaults
    // NOTE: template is intentionally NOT taken from req.body here. 'brutalism'
    // and 'flat' cost 150 JOY/month (see POST /api/joy/subscribe-bio-theme) —
    // this generic free PUT only ever preserves the existing template, except
    // for the free downgrade back to 'default'.
    const finalTheme = theme === undefined
      ? existing.theme
      : {
          bgColor: theme.bgColor || '#ffffff',
          textColor: theme.textColor || '#0f172a',
          accentColor: theme.accentColor || '#6366f1',
          pattern: theme.pattern || 'none',
          preset: theme.preset || 'default',
          btnRadius: typeof theme.btnRadius === 'number' ? theme.btnRadius : 16,
          btnBorderWidth: typeof theme.btnBorderWidth === 'number' ? theme.btnBorderWidth : 0,
          btnShadow: typeof theme.btnShadow === 'number' ? theme.btnShadow : 4,
          template: theme.template === 'default' ? 'default' : (existing.theme?.template || 'default')
        };

    const nextHeadline = preserve(headline, existing.headline);
    const nextBio = preserve(bio, existing.bio);
    const nextHobbies = preserve(hobbies, existing.hobbies);
    const nextHeight = preserve(height, existing.height);
    const nextWeight = preserve(weight, existing.weight);
    const nextMeasurements = preserve(measurements, existing.measurements);
    const nextAddress = preserve(address, existing.address);
    const nextSkills = preserve(skills, existing.skills);
    const nextJobTitle = preserve(jobTitle, existing.jobTitle);
    const nextLinks = preserve(links, existing.links);
    const nextTabs = preserve(tabs, existing.tabs);
    const nextProjects = preserve(projects, existing.projects);
    const nextServices = preserve(services, existing.services);

    // ── Track field changes for history ──────────────────────────────────────
    const textFields = ['displayName','headline','bio','birthday','phone','contactEmail','hobbies','height','weight','measurements','address','education','skills','jobTitle'];
    const fieldValues = {
      displayName: nextDisplayName,
      headline: nextHeadline,
      bio: nextBio,
      birthday: nextEditableBirthday,
      phone: lockedPhone,
      contactEmail: lockedContactEmail,
      hobbies: nextHobbies,
      height: nextHeight,
      weight: nextWeight,
      measurements: nextMeasurements,
      address: nextAddress,
      education: lockedEducation,
      skills: nextSkills,
      jobTitle: nextJobTitle,
    };

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
    const newLinkUrls = (nextLinks || []).map(l => l.url);
    for (const lnk of (nextLinks || [])) {
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
    existing.headline = nextHeadline;
    existing.bio = nextBio;
    existing.birthday = nextEditableBirthday;
    existing.phone = lockedPhone;
    existing.hobbies = nextHobbies;
    existing.height = nextHeight;
    existing.weight = nextWeight;
    existing.measurements = nextMeasurements;
    existing.address = nextAddress;
    existing.education = lockedEducation;
    existing.skills = nextSkills;
    existing.jobTitle = nextJobTitle;
    existing.contactEmail = lockedContactEmail;
    existing.links = nextLinks;
    existing.theme = finalTheme;
    existing.tabs = nextTabs;
    existing.projects = nextProjects;
    existing.services = nextServices;
    if (secretLinks !== undefined) {
      existing.secretLinks = await processSecretLinks(secretLinks, existing.secretLinks || []);
    }
    existing.slug = nextSlug;
    existing.status = 'active';
    if (installedUtilities !== undefined) {
      existing.installedUtilities = appInstallationPolicy.normalizeInstalled(installedUtilities);
    }
    if (homeScreenUtilities !== undefined) {
      const installed = installedUtilities !== undefined
        ? appInstallationPolicy.normalizeInstalled(installedUtilities)
        : appInstallationPolicy.normalizeInstalled(existing.installedUtilities);
      existing.homeScreenUtilities = appInstallationPolicy.normalizeHomeScreen(homeScreenUtilities, installed);
    }

    if (antiDeepfakeLock !== undefined) existing.antiDeepfakeLock = !!antiDeepfakeLock;
    if (autoLogoutMinutes !== undefined) existing.autoLogoutMinutes = Number(autoLogoutMinutes);
    if (privateMode !== undefined) existing.privateMode = !!privateMode;

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

export default router;
