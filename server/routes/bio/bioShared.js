/**
 * Phần dùng chung của các route Bio (hàm phụ, limiter, hằng số). Tách từ
 * bioRoutes.js cũ — mỗi thứ chỉ có MỘT bản ở đây nên các router con dùng chung
 * trạng thái (bộ đếm limiter, cache) như khi còn chung một tệp.
 */
import multer from 'multer';
import Bio from '../../models/Bio.js';
import { bioAge, isMinorAge } from '../../utils/memberAge.js';
import { clearCache } from '../../utils/cacheHelper.js';
import { encryptText, decryptText, hashPassword } from '../../utils/cryptoUtils.js';
import { unsealField } from '../../utils/dbSealingCipher.js';
import { sendPushNotification } from '../../utils/pushNotifier.js';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { accountOrIpKey } from '../../config/limiter.js';
import { findActiveSecurityBlock, sendSecurityBlockResponse } from '../../services/securityEnforcement.js';
import { deleteMemberAccountPermanently } from '../../services/memberAccountLifecycle.js';

export function sanitizeBioOutput(bioObj) {
  if (!bioObj || typeof bioObj !== 'object') return bioObj;
  if (bioObj.verificationRequest) {
    delete bioObj.verificationRequest.evidenceFileIds;
    delete bioObj.verificationRequest.scheduleFileId;
    delete bioObj.verificationRequest.selfieFileId;
  }
  for (const [key, val] of Object.entries(bioObj)) {
    if (typeof val === 'string' && val) {
      if (val.startsWith('$enc$a256gcm$v1$')) {
        bioObj[key] = unsealField(val);
      } else if (val.startsWith('enc:')) {
        bioObj[key] = decryptText(val);
      }
    }
  }
  return bioObj;
}

// Kiểm số điện thoại còn trống ở bước onboarding. Trả lời có/không về một số
// là lộ thông tin nhẹ, nên đếm theo tài khoản và để thấp: đủ cho người gõ sai
// vài lần, không đủ để dò danh bạ.
export const phoneCheckLimiter = rateLimit({
  keyGenerator: accountOrIpKey,
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Bạn kiểm tra số điện thoại quá nhiều lần. Vui lòng đợi vài phút.' }
});

// Đối chiếu điểm ghim với bản đồ (Nominatim, tối đa 1 lượt/giây cho cả máy
// chủ) — mỗi tài khoản vài lượt là đủ cho một lần onboarding.
export const pinCheckLimiter = rateLimit({
  keyGenerator: accountOrIpKey,
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { error: 'Bạn kiểm tra vị trí quá nhiều lần. Vui lòng đợi vài phút.' }
});

export const checkLocationLimiter = rateLimit({
  keyGenerator: accountOrIpKey,
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: { error: 'Bạn đang cập nhật vị trí quá nhanh. Vui lòng đợi vài phút.' }
});

// Đợt kiểm tra thông tin: giới hạn theo TÀI KHOẢN chứ không theo IP. Kẻ đoán mò
// đổi IP dễ hơn đổi tài khoản, mà chặn theo IP thì cả phòng ký túc xá dùng chung
// một NAT sẽ chặn nhầm nhau.
export const identityAnswerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  // `req.ip` thô là lỗ hổng với IPv6: một người thường được cấp cả dải /64, đổi
  // địa chỉ trong dải đó là có ngay một khoá đếm mới. `ipKeyGenerator` gom cả
  // dải về một khoá. Chỉ dùng khi chưa biết email (chưa qua requireMember).
  keyGenerator: (req) => req.memberEmail || ipKeyGenerator(req.ip),
  message: { error: 'Bạn đang trả lời quá nhanh. Vui lòng đợi ít phút rồi thử lại.' },
});

// Gửi mã xác minh: mỗi lần bấm là một email thật rời máy chủ. Không chặn thì
// một vòng lặp gọi API biến hòm thư của thành viên thành bãi rác — và đốt sạch
// hạn mức SendGrid.
export const identityOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.memberEmail || ipKeyGenerator(req.ip),
  message: { error: 'Bạn đã yêu cầu mã quá nhiều lần. Vui lòng đợi 15 phút.' },
});

export const studentRewardLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.memberEmail || ipKeyGenerator(req.ip),
  message: { error: 'Bạn đã gửi xét duyệt quá nhiều lần. Vui lòng thử lại sau.' },
});

export const studentRewardUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 1, fileSize: 8 * 1024 * 1024 },
});

export const studentVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.memberEmail || ipKeyGenerator(req.ip),
  message: { error: 'Bạn đã gửi yêu cầu xác minh quá nhiều lần. Vui lòng thử lại sau.' },
});

export const verificationAppealLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.memberEmail || ipKeyGenerator(req.ip),
  message: { error: 'Bạn đã gửi yêu cầu hỗ trợ quá nhiều lần. Vui lòng thử lại sau.' },
});

export const studentVerificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 2, fileSize: 4 * 1024 * 1024, fields: 12, fieldSize: 16 * 1024 },
});

export const receiveStudentVerification = (req, res, next) => {
  studentVerificationUpload.array('evidence', 2)(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({
      error: error.code === 'LIMIT_FILE_SIZE'
        ? 'Mỗi ảnh tối đa 4 MB.'
        : 'Chỉ được gửi tối đa hai ảnh bằng chứng.',
    });
  });
};

export const receiveStudentReward = (req, res, next) => {
  studentRewardUpload.single('evidence')(req, res, (error) => {
    if (!error) return next();
    return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File tối đa 8 MB.' : 'Không thể đọc file tải lên.' });
  });
};

export function detectedEvidenceMime(buffer) {
  if (!buffer?.length) return null;
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

export function parseReviewResult(text) {
  try {
    const json = String(text || '').match(/\{[\s\S]*\}/)?.[0];
    const result = JSON.parse(json || '');
    if (typeof result.verified !== 'boolean') return null;
    return { verified: result.verified, reason: String(result.reason || '').slice(0, 300) };
  } catch {
    return null;
  }
}

export const clearPublicBioCache = (bio) => Promise.all([
  bio.slug && clearCache(`bio_slug_${bio.slug}`),
  bio.customDomain && clearCache(`bio_domain_${bio.customDomain}`),
]);

export const TWELVE_MONTHS_MS = 1000 * 60 * 60 * 24 * 365;

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function rejectBlacklistedPhone(res, phone) {
  if (!phone || !String(phone).trim()) return false;
  const block = await findActiveSecurityBlock({ phone });
  if (!block) return false;
  sendSecurityBlockResponse(res, block);
  return true;
}

// Ownership guard for /:id routes — the bio's login or contact email must
// match the verified member token (admins may act on any bio).
export const ownsBio = (req, bioDoc) =>
  req.isAdminActor ||
  (req.memberEmail &&
    (bioDoc.email === req.memberEmail || bioDoc.contactEmail === req.memberEmail));

// ─── Helper: Append a history entry (capped at 50) ───────────────────────────
export const HISTORY_LABELS = {
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

export const pushHistory = (bio, entry) => {
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

export const normalizeSlug = (value) => {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const createUniqueSlug = async (baseSlug, ignoreId = null) => {
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

export const getUnexpiredPublicBio = (bio) =>
  bio && bio.expiresAt && new Date(bio.expiresAt).getTime() <= Date.now() ? null : bio;

export const processSecretLinks = async (newLinks, existingLinks = []) => {
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

// A person should only ever hold one verified account. If they previously
// signed up under a different email (edu + non-edu by mistake, or two
// trial attempts) and this verification reveals the same identity (same
// phone or same student ID), the other email's Bio is deleted outright —
// keeping only the one that just got verified.
export async function removeDuplicateIdentityAccounts(bio) {
  const phone = bio.verificationRequest?.phoneZalo;
  const schoolIdCode = bio.verificationRequest?.schoolIdCode;
  const identityFilters = [];
  if (phone) identityFilters.push({ 'verificationRequest.phoneZalo': phone });
  if (schoolIdCode) identityFilters.push({ 'verificationRequest.schoolIdCode': schoolIdCode });
  if (!identityFilters.length) return;

  const duplicates = await Bio.find({ _id: { $ne: bio._id }, $or: identityFilters }).select('_id');
  for (const duplicate of duplicates) {
    await deleteMemberAccountPermanently(duplicate._id);
  }
}

// Strips a leading school-level token (TH/THCS/THPT/ĐH/CĐ and common spellings)
// from a school name so "THCS Nguyễn Du" becomes "Nguyễn Du" regardless of
// whether the user typed the level into the name field by habit.
export const SCHOOL_LEVEL_PREFIX = /^(tiểu học|trung học cơ sở|trung học phổ thông|cao đẳng|đại học|thcs|thpt|cđ|đh|th)[\s.:-]+/i;

export function stripSchoolLevelPrefix(name) {
  return String(name || '').trim().replace(SCHOOL_LEVEL_PREFIX, '').trim();
}

export const VIETNAM_ETHNICITIES = [
  'Kinh', 'Tày', 'Thái', 'Mường', 'Khmer', 'Mông', 'Nùng', 'Hoa', 'Dao', 'Gia Rai', 'Ê Đê', 'Ba Na',
  'Sán Chay', 'Chăm', 'Cơ Ho', 'Xơ Đăng', 'Sán Dìu', 'Hrê', 'Ra Glai', 'Mnông', 'Thổ', 'Xtiêng',
  'Khơ Mú', 'Bru - Vân Kiều', 'Cơ Tu', 'Giáy', 'Tà Ôi', 'Mạ', 'Giẻ Triêng', 'Co', 'Chơ Ro',
  'Xinh Mun', 'Hà Nhì', 'Chu Ru', 'Lào', 'La Chí', 'Kháng', 'Phù Lá', 'La Hủ', 'La Ha', 'Pà Thẻn',
  'Chứt', 'Lự', 'Lô Lô', 'Mảng', 'Cơ Lao', 'Bố Y', 'Cống', 'Ngái', 'Si La', 'Pu Péo', 'Rơ Măm', 'Brâu', 'Ơ Đu',
];

// Haversine distance in kilometers between two lat/lng points.
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Trang Bio công khai chỉ được nhận đúng những trường mà giao diện render.
// Trước đây route này trả nguyên document: kèm cả email, joyBalance, PIN, vị
// trí tin cậy, danh bạ sao lưu và verificationRequest (tên thật, tên trường,
// mã học sinh, số Zalo) — đã giải mã sẵn bởi hook post('init').
export const PUBLIC_BIO_FIELDS = [
  'slug', 'customDomain', 'displayName', 'name', 'avatarUrl', 'headline', 'bio', 'status', 'theme',
  'links', 'projects', 'services', 'tabs', 'hobbies', 'jobTitle',
  'skills', 'education', 'birthday', 'height', 'weight', 'measurements',
  'address', 'phone', 'contactEmail', 'secretLinks',
];

// Vị thành niên: cắt thêm mọi trường có thể dùng để tìm ra người thật ngoài
// đời. Đây là khoá cứng theo chính sách, không phải tuỳ chọn người dùng tắt/bật.
export const MINOR_HIDDEN_FIELDS = [
  'phone', 'address', 'measurements', 'height', 'weight', 'birthday',
  'education', 'contactEmail',
];

export function toPublicBio(doc) {
  const minor = isMinorAge(bioAge(doc));
  const hidden = minor ? new Set(MINOR_HIDDEN_FIELDS) : new Set();
  const out = {};
  for (const field of PUBLIC_BIO_FIELDS) {
    if (hidden.has(field) || doc[field] === undefined) continue;
    let val = doc[field];
    if (typeof val === 'string' && val.startsWith('$enc$a256gcm$v1$')) {
      val = unsealField(val);
      if (typeof val === 'string' && val.startsWith('$enc$')) {
        val = ''; // Sanitize if corrupted or undecryptable with rotated key
      }
    } else if (typeof val === 'string' && val.startsWith('enc:')) {
      val = decryptText(val);
      if (typeof val === 'string' && val.startsWith('enc:')) {
        val = ''; // Sanitize if corrupted or undecryptable with rotated key
      }
    }
    out[field] = val;
  }
  // Cho client biết để đặt noindex — trang của vị thành niên không lên Google.
  out.isMinor = minor;
  return out;
}
