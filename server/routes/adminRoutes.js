import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { requireAdmin, invalidateMemberGate } from '../middleware/authMiddleware.js';
import { awardJoy } from '../utils/joyService.js';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { JWT_SECRET } from '../utils/secrets.js';

// Username is hashed only as a lookup key (not a secret). Passwords used to be
// unsalted SHA-256 — fast and brute-forceable if the DB ever leaked. They're now
// bcrypt; verifyAndUpgrade() checks either scheme and transparently re-hashes a
// legacy SHA-256 record to bcrypt the first time its owner logs in.
const sha256 = (message) => crypto.createHash('sha256').update(message).digest('hex');
export const isBcrypt = (h) => typeof h === 'string' && h.startsWith('$2');

// Exported so password migration logic stays reusable across admin flows.
export async function verifyAndUpgrade(admin, plainPassword) {
  if (isBcrypt(admin.password)) {
    return bcrypt.compare(plainPassword, admin.password);
  }
  // Legacy unsalted SHA-256 hex — constant-time compare, then upgrade on success.
  const legacy = sha256(plainPassword);
  const stored = admin.password || '';
  const ok = legacy.length === stored.length &&
    crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(stored));
  if (ok) {
    admin.password = await bcrypt.hash(plainPassword, 12);
    await admin.save();
  }
  return ok;
}

// Admin login is directly brute-forceable (unlike Google login) — cap attempts
// per IP. Kept loose in dev where the Vite proxy collapses every request to one IP.
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' }
});

// Cửa gửi mã OTP: ai cũng gọi được (không cần mật khẩu), nên phải chặn chặt —
// mỗi lần gọi là một tin nhắn Telegram vào máy Boss. 5 lần / 15 phút / IP.
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn đã yêu cầu mã quá nhiều lần. Thử lại sau 15 phút.' },
});

/**
 * Phát một mã OTP mới cho tài khoản quản trị và gửi qua Telegram.
 *
 * Mã 6 chữ số (trước là 4): từ khi bỏ bước mật khẩu, OTP là lớp bảo vệ DUY
 * NHẤT, nên không gian đoán phải đủ rộng. Kèm theo đó là `attempts`: sai 5 lần
 * là huỷ mã, để không ai dò hết 10^6 khả năng trong 5 phút.
 */
const OTP_TTL_MS = 30 * 1000;

async function issueAdminOtp(admin) {
  const otpCode = String(crypto.randomInt(100000, 1000000));
  const tempToken = crypto.randomBytes(24).toString('hex');

  if (!global.ADMIN_2FA_OTPS) global.ADMIN_2FA_OTPS = new Map();
  global.ADMIN_2FA_OTPS.set(tempToken, {
    adminId: admin._id,
    adminUsername: admin.username || 'admin',
    otpCode,
    attempts: 0,
    // 30 giây theo yêu cầu của chủ hệ thống: mã bị đọc lỏm trên màn hình khoá
    // điện thoại thì gần như không kịp dùng lại. Đổi số ở ĐÂY thôi — client đọc
    // hạn dùng từ `expiresIn` máy chủ trả về, không tự chép hằng số.
    expiresAt: Date.now() + OTP_TTL_MS,
  });

  const { sendTelegramAlert } = await import('../services/telegramService.js');
  const otpHtml = `
🔑 <b>[HUGO ADMIN OTP]</b>

Mã đăng nhập Admin Dashboard: <b>${otpCode}</b>

⏱️ <i>Hiệu lực 30 giây. Không chia sẻ mã này cho bất kỳ ai. Nếu không phải bạn yêu cầu, hãy bỏ qua.</i>
  `.trim();

  // ponytail: không nuốt lỗi — Telegram hỏng mà vẫn báo "đã gửi" thì Boss ngồi
  // chờ mã không bao giờ tới. Mã vẫn nằm trong log server để cứu hộ.
  const sent = await sendTelegramAlert(otpHtml).catch((e) => ({ success: false, error: e.message }));
  const delivered = Boolean(sent.success && !sent.simulated);
  if (!delivered) {
    console.warn(`⚠️ Admin OTP không gửi được qua Telegram (${sent.error || 'chưa cấu hình TELEGRAM_BOT_TOKEN/CHAT_ID'}). Mã: ${otpCode}`);
  }
  return { tempToken, delivered, expiresIn: Math.round(OTP_TTL_MS / 1000) };
}

/**
 * POST /api/admin/request-otp — đăng nhập quản trị chỉ bằng OTP Telegram.
 *
 * Không có mật khẩu: yếu tố xác thực là QUYỀN ĐỌC được tin nhắn gửi tới đúng
 * một chat Telegram của chủ hệ thống (TELEGRAM_CHAT_ID cố định trong .env).
 * Người lạ bấm nút này chỉ làm máy Boss kêu một tiếng, họ không đọc được mã.
 */
router.post('/request-otp', otpRequestLimiter, async (req, res) => {
  try {
    // Hệ thống một chủ: lấy tài khoản quản trị gần nhất làm danh tính cho phiên.
    const admin = await Admin.findOne({}).sort({ updatedAt: -1 });
    if (!admin) {
      return res.status(503).json({ error: 'Chưa có tài khoản quản trị nào. Chạy: node server/scripts/reset-admin.mjs <tên> <mật-khẩu>' });
    }

    const { tempToken, delivered, expiresIn } = await issueAdminOtp(admin);
    res.json({
      success: true,
      tempToken,
      otpDelivered: delivered,
      expiresIn,
      message: delivered
        ? 'Đã gửi mã 6 chữ số — dùng trong 30 giây.'
        : 'Không gửi được mã (bot chưa cấu hình hoặc lỗi mạng). Xem mã trong log máy chủ.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    let matchingAdmin = null;

    if (username && typeof username === 'string') {
      // Bản ghi Admin lưu username dưới dạng BĂM tra cứu SHA-256 (xem phần seed
      // trong server.js), còn chỗ này lại đi tìm đúng chữ người dùng gõ — nên
      // findOne luôn trượt và mọi lượt đăng nhập đều trả 401, kể cả khi mật
      // khẩu đúng. Tìm theo cả ba dạng: băm của chữ gõ nguyên văn, băm của bản
      // viết thường, và chữ trần cho tài khoản tạo từ trước quy ước băm.
      const raw = username.trim();
      const cleanUser = raw.toLowerCase();
      const lookups = [...new Set([
        crypto.createHash('sha256').update(raw).digest('hex'),
        crypto.createHash('sha256').update(cleanUser).digest('hex'),
        cleanUser,
      ])];
      const adminCandidate = await Admin.findOne({ username: { $in: lookups } });
      if (adminCandidate && (await verifyAndUpgrade(adminCandidate, password))) {
        matchingAdmin = adminCandidate;
      }
    } else {
      // Fallback if username was omitted
      const admins = await Admin.find({});
      for (const admin of admins) {
        if (await verifyAndUpgrade(admin, password)) {
          matchingAdmin = admin;
          break;
        }
      }
    }

    if (!matchingAdmin) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Đường mật khẩu vẫn giữ làm lối vào dự phòng khi Telegram hỏng, nhưng nó
    // cũng phải qua đúng một cửa OTP như nút "Gửi mã" ở trang đăng nhập.
    const { tempToken, delivered, expiresIn } = await issueAdminOtp(matchingAdmin);
    return res.json({
      success: true,
      requireOtp: true,
      tempToken,
      otpDelivered: delivered,
      expiresIn,
      message: delivered
        ? 'Đã gửi mã 6 chữ số — dùng trong 30 giây.'
        : 'Không gửi được mã. Xem mã trong log máy chủ.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/verify-otp  { tempToken, otpCode }
router.post('/verify-otp', async (req, res) => {
  try {
    const { tempToken, otpCode } = req.body;
    if (!tempToken || !otpCode) {
      return res.status(400).json({ error: 'Vui lòng cung cấp mã OTP 6 chữ số.' });
    }

    if (!global.ADMIN_2FA_OTPS || !global.ADMIN_2FA_OTPS.has(tempToken)) {
      return res.status(400).json({ error: 'Phiên đăng nhập đã hết hạn. Hãy yêu cầu mã OTP mới.' });
    }

    const record = global.ADMIN_2FA_OTPS.get(tempToken);
    if (Date.now() > record.expiresAt) {
      global.ADMIN_2FA_OTPS.delete(tempToken);
      return res.status(400).json({ error: 'Mã OTP đã hết hạn (quá 30 giây). Hãy bấm gửi lại mã.' });
    }

    if (String(otpCode).trim() !== String(record.otpCode)) {
      // OTP giờ là lớp bảo vệ duy nhất, nên phải có trần số lần đoán: không có
      // nó thì 5 phút đủ để thử hết mọi mã 6 chữ số bằng script.
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        global.ADMIN_2FA_OTPS.delete(tempToken);
        return res.status(429).json({ error: 'Sai mã 5 lần. Mã đã bị huỷ — hãy yêu cầu mã mới.' });
      }
      return res.status(401).json({ error: `Mã OTP không chính xác (còn ${5 - record.attempts} lần thử).` });
    }

    // OTP Verified successfully -> Issue 14-day Admin JWT
    global.ADMIN_2FA_OTPS.delete(tempToken);

    const token = jwt.sign(
      { id: record.adminId, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    });

    try {
      const AdminAuditLog = (await import('../models/AdminAuditLog.js')).default;
      await AdminAuditLog.create({
        adminId: String(record.adminId),
        adminUsername: record.adminUsername,
        action: 'login_2fa_telegram',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
    } catch (e) {
      console.error('[AdminAuditLog login 2fa]', e.message);
    }

    res.json({
      success: true,
      token,
      admin: {
        id: record.adminId,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify session route
router.get('/verify-session', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

// Verify password route
router.post('/verify-password', requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Mật khẩu là bắt buộc' });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản admin' });
    }

    if (!(await verifyAndUpgrade(admin, password))) {
      return res.status(401).json({ error: 'Mật khẩu không chính xác' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Change admin password route (Wipes all old passwords & sets new bcrypt hash)
router.post('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản admin' });
    }

    if (!(await verifyAndUpgrade(admin, currentPassword))) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    // Completely wipe old password hash & save fresh 12-round bcrypt hash
    admin.password = await bcrypt.hash(newPassword, 12);
    admin.markModified('password');
    await admin.save();

    res.json({ success: true, message: 'Đã xóa toàn bộ mật khẩu cũ và cập nhật mật khẩu mới thành công!' });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// Admin Reset User Password Route (Wipes all previous user passwords & sets new password)
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng' });
    }

    // Completely wipe out old passwords & security reset tokens
    const hashed = await bcrypt.hash(newPassword, 12);
    bio.password = hashed;
    if (bio.resetPasswordToken) bio.resetPasswordToken = undefined;
    if (bio.resetPasswordExpires) bio.resetPasswordExpires = undefined;

    // Wipe secret links old passwords if required
    if (Array.isArray(bio.secretLinks)) {
      bio.secretLinks = bio.secretLinks.map(link => ({
        ...link,
        password: hashed
      }));
    }

    bio.markModified('password');
    bio.markModified('secretLinks');
    await bio.save();

    res.json({
      success: true,
      message: `Đã xóa toàn bộ mật khẩu cũ và cập nhật mật khẩu mới cho ${bio.displayName || bio.email} thành công!`
    });
  } catch (error) {
    console.error('Admin reset user password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật mật khẩu người dùng' });
  }
});

async function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        size += await getDirSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }
  } catch {
    // Ignore errors for missing directories
  }
  return size;
}

router.get('/system-storage', requireAdmin, async (req, res) => {
  try {
    const publicPath = path.resolve(__dirname, '../../public');
    const publicSize = await getDirSize(publicPath);

    let dbSize = 0;
    try {
      if (mongoose.connection && mongoose.connection.db) {
        const stats = await mongoose.connection.db.stats();
        dbSize = stats.dataSize + stats.indexSize;
      }
    } catch (e) {
      console.error("MongoDB stats error:", e);
    }

    res.json({
      success: true,
      data: {
        publicFiles: publicSize,
        database: dbSize,
        total: publicSize + dbSize
      }
    });
  } catch (error) {
    console.error('System storage error:', error);
    res.status(500).json({ error: 'Lỗi khi tính toán dung lượng' });
  }
});

import Bio from '../models/Bio.js';
import ReadingSession from '../models/ReadingSession.js';
import { CODER_STAGE_SEQUENCE, isCoderLessonId } from '../../shared/coderProgression.js';

router.get('/users/search', requireAdmin, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    const searchRegex = new RegExp(q, 'i');
    
    // Search by email, displayName, or phone
    const users = await Bio.find({
      $or: [
        { email: searchRegex },
        { displayName: searchRegex },
        { phone: searchRegex }
      ]
    }).select('email displayName avatarUrl joyBalance phone packages').limit(10).lean();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Lỗi tìm kiếm' });
  }
});

// ─── Admin: thông báo, AI, nhật ký lỗi ───────────────────────────────────────
import { sendPushNotification } from '../utils/pushNotifier.js';
import { getQuotaStatus, generate } from '../services/aiGateway.js';
import ErrorLog from '../models/ErrorLog.js';

// GET /admin/ai-status - Gemini quota/health + auto-poster switch (the "đèn cảnh báo").
router.get('/ai-status', requireAdmin, async (req, res) => {
  try {
    res.json({ success: true, quota: getQuotaStatus() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/error-logs?level=&source=&limit= - persisted errors for the dashboard.
router.get('/error-logs', requireAdmin, async (req, res) => {
  try {
    const { level, source } = req.query;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const q = {};
    if (level && ['error', 'warn', 'info'].includes(level)) q.level = level;
    if (source) q.source = source;
    const logs = await ErrorLog.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    const counts = await ErrorLog.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $group: { _id: '$level', n: { $sum: 1 } } },
    ]);
    const last24h = counts.reduce((a, c) => ({ ...a, [c._id]: c.n }), { error: 0, warn: 0, info: 0 });
    res.json({ success: true, logs, last24h });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/error-logs?level= - clear logs (all, or a single level).
router.delete('/error-logs', requireAdmin, async (req, res) => {
  try {
    const { level } = req.query;
    const q = level && ['error', 'warn', 'info'].includes(level) ? { level } : {};
    const r = await ErrorLog.deleteMany(q);
    res.json({ success: true, deleted: r.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/system-overview - one-shot vitals for the System dashboard.
router.get('/system-overview', requireAdmin, async (req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [users, joyAgg, errors24h, newUsers24h] = await Promise.all([
      Bio.countDocuments({}),
      Bio.aggregate([{ $group: { _id: null, total: { $sum: '$joyBalance' } } }]),
      ErrorLog.countDocuments({ level: 'error', createdAt: { $gte: dayAgo } }),
      Bio.countDocuments({ createdAt: { $gte: dayAgo } }),
    ]);
    res.json({
      success: true,
      users,
      newUsers24h,
      joyCirculating: joyAgg?.[0]?.total || 0,
      errors24h,
      quota: getQuotaStatus(),
      uptimeSec: Math.round(process.uptime()),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});





// GET /admin/coder-submissions
router.get('/coder-submissions', requireAdmin, async (req, res) => {
  try {
    // Trước đây lọc `completedLessons: 'lesson62'` kèm chú thích "bài cuối của
    // Chặng 5". Sai với lộ trình hiện tại: chặng 5 là bài 71–90, còn bài 62 nằm
    // giữa chặng 4 — nên danh sách duyệt đồ án hiện cả những người còn cách
    // ngày tốt nghiệp gần bốn mươi bài.
    //
    // Trang này để DUYỆT ĐỒ ÁN, nên điều kiện đúng là đã nộp đồ án.
    const submissions = await Bio.find({
      hugoCoderProjectUrl: { $exists: true, $nin: [null, ''] },
    }).select('email displayName avatarUrl completedLessons capstoneTrack hugoCoderProjectUrl hugoCoderProjectStatus hugoCoderCertificateUrl hugoCoderProjectSubmittedAt hugoCoderProjectNote hugoCoderProjectAdminNote')
      .sort({ hugoCoderProjectSubmittedAt: -1 })
      .lean();

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching coder submissions:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/learners — bảng theo dõi người học.
 *
 * Trước đây admin chỉ có trang duyệt đồ án, tức chỉ nhìn thấy người đã đi tới
 * cuối. Ai đang học dở, ai kẹt ở đâu, ai bỏ giữa chừng thì không có chỗ nào xem.
 *
 * `stuckAt` là thứ đáng nhìn nhất: bài đầu tiên chưa hoàn thành. Ba người cùng
 * kẹt ở một bài nghĩa là bài đó có vấn đề, không phải ba người đó lười.
 */
router.get('/learners', requireAdmin, async (req, res) => {
  try {
    const { q = '', track = '', status = 'all', page = 1, limit = 25 } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 25));

    const filter = { completedLessons: { $exists: true, $ne: [] } };
    if (q.trim()) {
      // Người dùng nhập, nên thoát ký tự đặc biệt trước khi dựng biểu thức —
      // một dấu ngoặc lạc vào là truy vấn ném lỗi.
      const safe = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { email: { $regex: safe, $options: 'i' } },
        { displayName: { $regex: safe, $options: 'i' } },
      ];
    }
    if (track) filter.capstoneTrack = track;
    if (status === 'graduating') filter.hugoCoderProjectStatus = 'pending';
    if (status === 'graduated') filter.hugoCoderProjectStatus = 'approved';

    const [rows, total] = await Promise.all([
      Bio.find(filter)
        .select('email displayName avatarUrl completedLessons capstoneTrack capstoneTrackChosenAt hugoCoderProjectStatus hugoCoderProjectSubmittedAt hugoCoderExamAttempts featureSubscriptions updatedAt')
        .sort({ updatedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Bio.countDocuments(filter),
    ]);

    const emails = rows.map((row) => row.email).filter(Boolean);
    const readings = emails.length
      ? await ReadingSession.aggregate([
        { $match: { memberEmail: { $in: emails }, completedAt: { $ne: null } } },
        { $group: { _id: '$memberEmail', count: { $sum: 1 } } },
      ])
      : [];
    const readingByEmail = new Map(readings.map((item) => [item._id, item.count]));

    const learners = rows.map((row) => {
      const coderDone = (row.completedLessons || []).filter(isCoderLessonId);
      const stage = CODER_STAGE_SEQUENCE.find(
        (item) => coderDone.length >= item.from - 1 && coderDone.length < item.to,
      ) || CODER_STAGE_SEQUENCE.at(-1);

      // Bài đầu tiên chưa xong — nơi người học đang đứng.
      let stuckAt = null;
      for (let number = 1; number <= 100; number += 1) {
        if (!coderDone.includes(`lesson${number}`)) { stuckAt = number; break; }
      }

      return {
        email: row.email,
        displayName: row.displayName || '',
        avatarUrl: row.avatarUrl || '',
        lessonsDone: coderDone.length,
        stageId: stage?.id || null,
        stuckAt,
        capstoneTrack: row.capstoneTrack || '',
        readingsDone: readingByEmail.get(row.email) || 0,
        examAttempts: Object.values(row.hugoCoderExamAttempts || {}).reduce((sum, n) => sum + Number(n || 0), 0),
        projectStatus: row.hugoCoderProjectStatus || '',
        projectSubmittedAt: row.hugoCoderProjectSubmittedAt || null,
        maintenanceUntil: row.featureSubscriptions?.hugoCoder?.expiresAt || null,
        // `updatedAt` đổi theo MỌI thay đổi hồ sơ, không riêng việc học — nên
        // gọi đúng tên nó là "hồ sơ đổi lần cuối", đừng bày ra như "học lần cuối".
        profileUpdatedAt: row.updatedAt || null,
      };
    });

    res.json({
      learners,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error fetching learners:', error);
    res.status(500).json({ error: error.message });
  }
});

/** GET /admin/learners/stuck — những bài đang chặn nhiều người nhất. */
router.get('/learners/stuck', requireAdmin, async (req, res) => {
  try {
    const rows = await Bio.find({ completedLessons: { $exists: true, $ne: [] } })
      .select('completedLessons')
      .lean();

    const counts = new Map();
    for (const row of rows) {
      const done = new Set((row.completedLessons || []).filter(isCoderLessonId));
      if (!done.size) continue;
      for (let number = 1; number <= 100; number += 1) {
        if (!done.has(`lesson${number}`)) {
          counts.set(number, (counts.get(number) || 0) + 1);
          break;
        }
      }
    }

    const stuck = [...counts.entries()]
      .map(([lesson, learners]) => ({ lesson, learners }))
      .sort((a, b) => b.learners - a.learners)
      .slice(0, 10);

    res.json({ stuck, totalLearners: rows.length });
  } catch (error) {
    console.error('Error computing stuck lessons:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/verify-graduation-project
router.post('/verify-graduation-project', requireAdmin, async (req, res) => {
  try {
    const { email, status, adminNote, certificateUrl } = req.body;
    if (!email || !status) {
      return res.status(400).json({ error: 'email and status are required' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái xác thực không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    bio.hugoCoderProjectStatus = status;
    bio.hugoCoderProjectAdminNote = adminNote || '';

    if (status === 'approved') {
      bio.hugoCoderCertificateUrl = certificateUrl || '';
      
      // Award 4000 JOY if not already claimed
      if (!bio.hugoCoderRewardClaimed7) {
        await awardJoy(
          email,
          4000,
          'ide_course_completion',
          // Số JOY đã là field `amount` trên thông báo, không viết lại vào câu.
          'Đạt thành tích Xuất sắc khi tốt nghiệp bộ Phát triển Web.',
          { bioDoc: bio, refId: 'lesson100_completion' }
        );
        bio.hugoCoderRewardClaimed7 = true;
      }
    } else {
      // If rejected, allow them to re-submit
      bio.hugoCoderProjectStatus = 'rejected';
    }

    await bio.save();
    res.json({ success: true, data: bio });
  } catch (error) {
    console.error('Error verifying project:', error);
    res.status(500).json({ error: error.message });
  }
});

function localFallbackInterpret(text) {
  const clean = text.toLowerCase().trim()
    .replace(/(\d+)([a-zA-Z]+)/g, "$1 $2")
    .replace(/([a-zA-Z]+)(\d+)/g, "$1 $2");

  const normalizedClean = clean.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
  const normalized = " " + normalizedClean.replace(/[^a-z0-9]/g, " ") + " ";

  const hasWord = (words) => {
    return words.some(w => {
      const normalizedWord = w.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
      return normalized.includes(` ${normalizedWord} `);
    });
  };

  let intent = "unknown";
  let amount = undefined;
  let recipient = undefined;
  let reason = undefined;
  let query = undefined;
  let botState = undefined;
  let durationUnit = undefined;

  // LOCK/UNLOCK
  if (hasWord(["khoa", "lock", "chan", "block", "dinh chi"])) {
    const match = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (match) recipient = match[0];
    
    if (hasWord(["dev", "lap trinh vien", "hugo team"])) {
      intent = "hugo-team";
      reason = "block-dev";
    } else {
      intent = hasWord(["mo", "unlock"]) ? "unlock" : "lock";
    }
  }
  // DELETIONS
  else if (hasWord(["xoa", "huy", "delete", "thu hoi", "remove", "go"])) {
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) {
      recipient = matchEmail[0];
      if (hasWord(["dev", "lap trinh vien", "hugo team"])) {
        intent = "hugo-team";
        reason = "delete-dev";
      } else {
        intent = hasWord(["goi", "package"]) ? "delete-user-package" : "delete-user";
        const pkgNames = ["vip", "premium", "gold", "silver", "basic", "trial", "sinh vien"];
        for (const name of pkgNames) {
          if (hasWord([name])) {
            query = name;
            break;
          }
        }
      }
    } else {
      if (hasWord(["goi", "package"])) {
        intent = "delete-package-template";
        const pkgNames = ["vip", "premium", "gold", "silver", "basic", "trial", "sinh vien"];
        for (const name of pkgNames) {
          if (hasWord([name])) {
            query = name;
            break;
          }
        }
      } else if (hasWord(["voucher", "ma", "code"])) {
        intent = "delete-voucher";
        const matchCode = text.match(/([a-zA-Z0-9-]{6,})/);
        if (matchCode) query = matchCode[0];
      }
    }
  }
  // HUGO TEAM DEV MANAGEMENT
  else if (hasWord(["hugo team", "dev team", "approve dev", "reject dev", "duyet dev", "tu choi dev", "cv dev", "ung vien dev", "ung vien", "devs", "dev", "lap trinh vien"])) {
    intent = "hugo-team";
    const isApprove = hasWord(["approve", "duyet", "nhan", "accept"]);
    const isReject = hasWord(["reject", "tu choi", "loai", "deny"]);
    const isDelete = hasWord(["xoa", "delete", "remove", "go", "huy", "gỡ"]);
    const isBlock = hasWord(["chan", "block", "khoa", "suspend", "dinh chi"]);
    
    if (isDelete) {
      reason = "delete-dev";
    } else if (isBlock) {
      reason = "block-dev";
    } else if (isApprove) {
      reason = "approve";
    } else if (isReject) {
      reason = "reject";
    } else {
      reason = "list";
    }
    
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // SUPPORT TICKETS MANAGEMENT
  else if (hasWord(["ticket", "tickets", "ho tro", "resolve ticket", "giai quyet ticket", "yeu cau ho tro"])) {
    intent = "tickets";
    const isResolve = hasWord(["resolve", "giai quyet", "dong", "close", "hoan thanh"]);
    reason = isResolve ? "resolve" : "list";
    const matchId = text.match(/([a-fA-F0-9]{24})/);
    if (matchId) query = matchId[0];
  }
  // IOT DEVICE CONTROL
  else if (hasWord(["iot", "thiet bi", "den", "dieu hoa", "toggle den", "toggle device", "quat"])) {
    intent = "iot";
    const isToggle = hasWord(["bat", "tat", "toggle", "switch", "turn on", "turn off"]);
    reason = isToggle ? "toggle" : "list";
    const deviceNames = ["den-studio", "dieu-hoa", "quat-thong-gio", "den", "dieu hoa", "quat"];
    for (const name of deviceNames) {
      if (hasWord([name])) {
        query = name;
        break;
      }
    }
  }
  // UTILITY STORE ORDERS MANAGEMENT
  else if (hasWord(["don hang", "orders", "order", "don mua"])) {
    intent = "orders";
    const isComplete = hasWord(["complete", "hoan thanh", "ship", "giao xong"]);
    const isCancel = hasWord(["cancel", "huy", "delete-order"]);
    reason = isComplete ? "complete" : (isCancel ? "cancel" : "list");
    const matchId = text.match(/([a-fA-F0-9]{24})/);
    if (matchId) query = matchId[0];
  }
  // SEND AI NOTIFICATION
  else if (hasWord(["gui tin nhan", "gui mail", "gui email", "gui thong bao", "send mail", "send notification", "send message", "thong bao"])) {
    intent = "send-ai-notification";
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) {
      recipient = matchEmail[0];
    } else if (normalized.includes(" tat ca ") || normalized.includes(" all ")) {
      recipient = "All";
    }

    let promptText = text.replace(/gửi tin nhắn/gi, "")
                        .replace(/gửi email/gi, "")
                        .replace(/gửi mail/gi, "")
                        .replace(/gửi thông báo/gi, "")
                        .replace(/send mail/gi, "")
                        .replace(/send notification/gi, "")
                        .replace(/send message/gi, "")
                        .replace(/đến tất cả người dùng và mail của người dùng/gi, "")
                        .replace(/đến tất cả người dùng/gi, "")
                        .replace(/đến tất cả/gi, "")
                        .replace(/cho tất cả/gi, "")
                        .replace(/cho/gi, "")
                        .replace(/đến/gi, "")
                        .replace(/to all/gi, "")
                        .replace(new RegExp(recipient || "All", 'gi'), "")
                        .replace(/và mail của người dùng/gi, "")
                        .replace(/và email/gi, "")
                        .trim();
    query = promptText || "Thông báo từ quản trị viên";
  }
  // STATS
  else if (hasWord(["thong ke", "stats", "thong so"])) {
    intent = "stats";
  }
  // CLEAN LOGS
  else if (hasWord(["clean-logs", "don logs", "xoa log"])) {
    intent = "clean-logs";
  }
  // CLEAR
  else if (hasWord(["clear", "xoa man hinh"])) {
    intent = "clear";
  }
  // HELP
  else if (hasWord(["help", "tro giup", "huong dan"])) {
    intent = "help";
  }
  // BOT
  else if (hasWord(["bot"])) {
    intent = "bot";
    botState = hasWord(["bat", "on"]) ? "on" : "off";
  }
  // USERS
  else if (hasWord(["danh sach user", "tim user", "users", "tim thanh vien"])) {
    intent = "users";
    const match = normalized.match(/(?:user|thanh vien|tim)\s+([a-zA-Z0-9_@.-]+)/);
    if (match) query = match[1];
  }
  // CREATE JOY VOUCHER
  else if (hasWord(["voucher", "qua tang", "ma joy"])) {
    intent = "create-joy-voucher";
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // GỬI JOY TRỰC TIẾP
  else if (
    hasWord(["gui joy", "cong joy", "transfer joy", "chuyen joy", "chuyenjoy", "transferjoy", "transfer", "add joy", "tang joy", "plus joy", "give joy", "tao joy", "add", "plus", "tang", "cong", "give", "bonus"]) ||
    (hasWord(["chuyen"]) && hasWord(["joy"])) ||
    (hasWord(["gui"]) && hasWord(["joy"])) ||
    (hasWord(["tang"]) && hasWord(["joy"])) ||
    (hasWord(["cong"]) && hasWord(["joy"])) ||
    (hasWord(["add"]) && hasWord(["joy"])) ||
    (hasWord(["tao"]) && hasWord(["joy"])) ||
    (hasWord(["plus"]) && hasWord(["joy"]))
  ) {
    intent = "send-joy-direct";
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // CREATE PAYMENT
  else if (hasWord(["thanh toan", "chuyen khoan", "payment", "hoa don"])) {
    intent = "create-payment";
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    if ((normalized.includes(" k ") || clean.includes("k")) && amount && amount < 1000) {
      const kMatch = clean.match(/(\d+)\s*k/);
      if (kMatch) amount = Number(kMatch[1]) * 1000;
    }
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) recipient = matchEmail[0];
  }
  // CREATE PACKAGE TEMPLATE OR SEND PACKAGE
  else if (hasWord(["goi"])) {
    const isSend = hasWord(["gui", "giao", "gan", "cho"]);
    intent = isSend ? "send-package-user" : "create-package-template";
    const pkgNames = ["vip", "premium", "gold", "silver", "basic", "trial", "sinh vien"];
    for (const name of pkgNames) {
      if (hasWord([name])) {
        query = name;
        break;
      }
    }
    const matchAmt = clean.match(/(\d+)/);
    if (matchAmt) amount = Number(matchAmt[1]);
    durationUnit = hasWord(["thang", "month"]) ? "months" : "days";
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchEmail) recipient = matchEmail[0];
  }

  // Double check /chuyen 2000 0798020513 or similar
  if (intent === "unknown" && (hasWord(["chuyen", "gui", "transfer"]))) {
    const matchAmt = clean.match(/(\d+)/);
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|0\d{9,10})/);
    if (matchAmt && matchEmail) {
      intent = "send-joy-direct";
      amount = Number(matchAmt[1]);
      recipient = matchEmail[0];
    }
  }

  return { intent, amount, recipient, reason, query, botState, durationUnit };
}

// POST /admin/interpret-command (admin) - Sử dụng AI để hiểu câu lệnh tự nhiên của Admin
router.post('/interpret-command', requireAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Nội dung câu lệnh trống' });
    }

    // Try local rule engine first to get instantaneous response (0ms) and save API quota
    const localResult = localFallbackInterpret(text);
    if (localResult && localResult.intent !== 'unknown') {
      return res.json(localResult);
    }

    const systemInstruction = `You are a command parser AI for the Hugo Studio Admin Panel.
Given a natural language input or command from the administrator, analyze their intent and extract the relevant arguments.
Analyze the input text to map it to one of these intents:
- "create-joy-voucher": to create a JOY gift card. Examples: "tạo voucher 1000", "tạo mã joy card 500".
- "send-joy-direct": to send/award JOY points directly to a user's account by email. Examples: "gửi 500 joy trực tiếp đến phucphgcs230327@fpt.edu.vn", "gửi trực tiếp 2000 joy cho test@gmail.com".
- "create-payment": to generate a PayOS checkout link. Examples: "tạo link thanh toán 50k", "tạo mã qr thanh toán 100000 cho phucphgcs230327@fpt.edu.vn", "tạo yêu cầu chuyển khoản đến phucphgcs230327@fpt.edu.vn 50k".
- "create-package-template": to create a new service package template. Examples: "tạo gói dịch vụ VIP 30 ngày", "tạo gói mới Sinh Viên 12 tháng".
- "send-package-user": to assign/send a service package to a user's Bio. Examples: "gửi gói VIP 30 ngày cho phucphgcs230327@fpt.edu.vn", "giao gói Premium 12 tháng đến test@gmail.com".
- "delete-user": to delete a member profile. Examples: "xóa tài khoản phucphgcs230327@fpt.edu.vn", "xóa user phucphgcs230327@fpt.edu.vn".
- "delete-package-template": to delete a service package template. Examples: "xóa gói dịch vụ VIP", "xóa gói VIP".
- "delete-voucher": to delete a JOY voucher card. Examples: "xóa voucher BDAY-07-XYZ", "hủy voucher JOY-XYZ".
- "delete-user-package": to remove an assigned package from a user. Examples: "xóa gói của user phucphgcs230327@fpt.edu.vn", "xóa gói VIP khỏi test@gmail.com".
- "stats": to view system stats. Examples: "xem thông số", "stats", "thống kê hệ thống".
- "users": to list or search users. Examples: "danh sách user", "tìm thành viên alice", "users".
- "lock": to lock a member. Examples: "khóa tài khoản member@test.com", "lock phucphgcs230327@fpt.edu.vn".
- "unlock": to unlock a member. Examples: "mở khóa tài khoản member@test.com", "unlock phucphgcs230327@fpt.edu.vn".
- "clean-logs": to clear server-cached errors. Examples: "clean logs", "dọn dẹp logs", "xóa log sự cố".
- "clear": to clear the terminal screen. Examples: "clear", "xóa màn hình".
- "help": to view help. Examples: "help", "trợ giúp", "hướng dẫn".

Return ONLY a valid JSON object matching the following structure (no markdown formatting, no code block tick marks):
{
  "intent": "create-joy-voucher" | "send-joy-direct" | "create-payment" | "create-package-template" | "send-package-user" | "delete-user" | "delete-package-template" | "delete-voucher" | "delete-user-package" | "stats" | "users" | "lock" | "unlock" | "bot" | "clean-logs" | "clear" | "help" | "unknown",
  "amount": number, // (optional) extracted amount, value, or duration (in days or months) as integer. If "50k", convert to 50000. If "12 tháng", convert to 12. If "30 ngày", convert to 30.
  "durationUnit": "days" | "months", // (optional) unit for package duration (default "days" if "ngày", "months" if "tháng")
  "recipient": "string", // (optional) email, phone, slug or "All". Extract email address or phone or slug.
  "reason": "string", // (optional) note, reason, or message for payment/voucher
  "botState": "on" | "off", // (optional) state for bot
  "query": "string" // (optional) search query, package name, or code to delete
}

Be smart:
- For input "/create-joy-voucher1000/for-phucphgcs230327@fpt.edu.vn", intent is "create-joy-voucher", amount is 1000, recipient is "phucphgcs230327@fpt.edu.vn", reason is "Tạo cho phucphgcs230327@fpt.edu.vn".
- For input "tạo voucher 1000", amount is 1000.
- For input "gửi 500 joy trực tiếp đến phucphgcs230327@fpt.edu.vn", intent is "send-joy-direct", amount is 500, recipient is "phucphgcs230327@fpt.edu.vn".
- For input "tạo gói dịch vụ VIP 30 ngày", intent is "create-package-template", query is "VIP", amount is 30, durationUnit is "days".
- For input "gửi gói VIP 30 ngày cho phucphgcs230327@fpt.edu.vn", intent is "send-package-user", query is "VIP", amount is 30, recipient is "phucphgcs230327@fpt.edu.vn".
- For input "xóa tài khoản test@gmail.com", intent is "delete-user", recipient is "test@gmail.com".
- If you cannot recognize the intent, return "intent": "unknown".`;

    let responseText;
    try {
      responseText = await generate(text, {
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });
    } catch (aiErr) {
      console.warn('[AI CLI] Gemini call failed, falling back to local regex parser:', aiErr.message);
    }

    if (!responseText) {
      // If AI fails and we haven't already returned the local result, return it now
      console.log('[AI CLI Fallback] Result:', localResult);
      return res.json(localResult);
    }

    const parsed = JSON.parse(responseText.trim());
    res.json(parsed);
  } catch (error) {
    console.error('Interpret command error:', error);
    try {
      const fallbackResult = localFallbackInterpret(req.body.text);
      console.log('[AI CLI Fallback after catch] Result:', fallbackResult);
      return res.json(fallbackResult);
    } catch {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /admin/send-ai-notification (admin) - Sử dụng AI viết nội dung & gửi tin nhắn, email
router.post('/send-ai-notification', requireAdmin, async (req, res) => {
  try {
    const { recipient, prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Nội dung yêu cầu trống' });
    }

    console.log(`[AI Notification] Generating content for prompt: "${prompt}", recipient: "${recipient}"`);

    // 1. Generate content using Gemini AI
    const systemInstruction = `You are a professional copywriter for Hugo Studio.
Given a topic/prompt from the administrator: "${prompt}", write a beautiful email subject, a beautifully formatted HTML email body, and a short push notification (under 200 chars).
IMPORTANT: Use the placeholder "{{displayName}}" (with double curly braces) in the subject, HTML body, and pushText wherever the recipient's name or a personalized greeting is appropriate. Do not guess names; always use "{{displayName}}".
Return ONLY a valid JSON object matching this structure (no markdown code ticks):
{
  "subject": "Email Subject Line",
  "html": "<div style='font-family: Arial, sans-serif;'>HTML Body here...</div>",
  "pushText": "Push Notification message here (max 200 chars)"
}`;

    let responseText;
    try {
      responseText = await generate(`Generate message content for: ${prompt}`, {
        systemInstruction,
        generationConfig: { responseMimeType: 'application/json' }
      });
    } catch (aiErr) {
      console.warn('[AI Notification] Gemini call failed, using local templates:', aiErr.message);
    }

    let subject, html, pushText;
    if (responseText) {
      try {
        const parsed = JSON.parse(responseText.trim());
        subject = parsed.subject;
        html = parsed.html;
        pushText = parsed.pushText;
      } catch (jsonErr) {
        console.error('Failed to parse AI response:', jsonErr);
      }
    }

    // Fallback if AI didn't respond or JSON was invalid
    if (!subject || !html || !pushText) {
      subject = `📢 Chào {{displayName}}, thông báo mới từ Hugo Studio: ${prompt}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0b0a0f;">Hugo Studio</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Chào {{displayName}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">${prompt}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Email này được gửi tự động từ quản trị viên Hugo Studio.</p>
        </div>
      `;
      pushText = `Chào {{displayName}}, thông báo mới: ${prompt}`;
    }

    // 2. Resolve recipients
    let recipients = [];
    if (recipient && recipient.toLowerCase() !== 'all') {
      const bio = await Bio.findOne({ $or: [{ email: recipient }, { phone: recipient }] });
      if (!bio) {
        return res.status(404).json({ error: `Không tìm thấy tài khoản người dùng: ${recipient}` });
      }
      recipients.push(bio);
    } else {
      recipients = await Bio.find({});
    }

    if (recipients.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng nào trong hệ thống.' });
    }

    // 3. Send Notification & Email
    const emailPromises = [];
    const pushPromises = [];

    const { sendCustomEmail } = await import('../services/emailService.js');
    const InAppNotification = (await import('../models/InAppNotification.js')).default;

    for (const bio of recipients) {
      const userDisplayName = bio.displayName || 'Thành viên';
      const userSubject = subject.replace(/{{displayName}}/g, userDisplayName);
      const userHtml = html.replace(/{{displayName}}/g, userDisplayName);
      const userPushText = pushText.replace(/{{displayName}}/g, userDisplayName);

      // In-app history entry
      bio.history.push({
        type: 'info',
        icon: 'notifications',
        title: userSubject,
        detail: userPushText,
        timestamp: new Date()
      });
      if (bio.history.length > 50) {
        bio.history = bio.history.slice(bio.history.length - 50);
      }
      emailPromises.push(bio.save());

      // Create InAppNotification document to display in UI Inbox list
      pushPromises.push(
        InAppNotification.create({
          email: bio.email,
          type: 'info',
          category: 'system',
          title: userSubject,
          message: userPushText,
          actionUrl: '/member/activity'
        }).catch(err => console.error(`Error creating InAppNotification for ${bio.email}:`, err.message))
      );

      // Send Push notification
      if (bio.email) {
        pushPromises.push(
          sendPushNotification(bio.email, userSubject, userPushText, '/member/activity').catch(() => {})
        );
        // Send email via SendGrid
        pushPromises.push(
          sendCustomEmail(bio.email, userSubject, userHtml).catch(err => console.error(`Error sending email to ${bio.email}:`, err.message))
        );
      }
    }

    await Promise.all([...emailPromises, ...pushPromises]);

    res.json({
      success: true,
      recipientCount: recipients.length,
      subject,
      pushText,
      html
    });
  } catch (error) {
    console.error('Send AI notification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /admin/iot/devices (admin) - Danh sách thiết bị IoT
router.get('/iot/devices', requireAdmin, async (req, res) => {
  try {
    const IoTDevice = (await import('../models/IoTDevice.js')).default;
    const devices = await IoTDevice.find({}).sort({ lastSeen: -1 });
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/iot/toggle (admin) - Bật/tắt hoạt động thiết bị IoT
router.post('/iot/toggle', requireAdmin, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const IoTDevice = (await import('../models/IoTDevice.js')).default;
    const dev = await IoTDevice.findOne({ deviceId });
    if (!dev) return res.status(404).json({ error: 'Không tìm thấy thiết bị IoT' });
    dev.isActive = !dev.isActive;
    await dev.save();
    res.json({ success: true, message: `Thiết bị ${dev.deviceName} đã được ${dev.isActive ? 'Kích hoạt' : 'Hủy kích hoạt'}`, device: dev });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/orders/update-status (admin) - Cập nhật trạng thái đơn hàng Utility Store
router.post('/orders/update-status', requireAdmin, async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const UtilityOrder = (await import('../models/UtilityOrder.js')).default;
    const order = await UtilityOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    order.status = status;
    await order.save();
    res.json({ success: true, message: `Đơn hàng ${orderId} đã được chuyển sang trạng thái ${status}`, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DEEP USER MANAGEMENT ROUTES ─────────────────────────────────────────────

// GET /admin/users/:id/details - Soi thông tin chi tiết người dùng
router.get('/users/:id/details', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../models/Bio.js')).default;
    const JoyLedger = (await import('../models/JoyLedger.js')).default;
    const SecurityEvent = (await import('../models/SecurityEvent.js')).default;
    const SupportTicket = (await import('../models/SupportTicket.js')).default;
    const UtilityOrder = (await import('../models/UtilityOrder.js')).default;

    const bio = await Bio.findById(req.params.id).lean();
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng' });
    }

    const [joyLedger, tickets, securityCount, orders] = await Promise.all([
      JoyLedger.find({ email: bio.email }).sort({ createdAt: -1 }).limit(20).lean(),
      SupportTicket.find({ email: bio.email }).sort({ createdAt: -1 }).limit(10).lean(),
      SecurityEvent.countDocuments({ emailHash: crypto.createHash('sha256').update(bio.email).digest('hex') }),
      UtilityOrder.find({ email: bio.email }).sort({ createdAt: -1 }).limit(20).lean()
    ]);

    res.json({
      success: true,
      bio,
      joyLedger,
      tickets,
      securityCount,
      orders
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/account-settings - Đổi mật khẩu & Cấu hình tài khoản Admin
router.put('/account-settings', requireAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword, adminEmail } = req.body;
    const adminId = req.user?.id || req.user?.username;

    let admin = await Admin.findOne({ username: adminId });
    if (!admin) {
      admin = await Admin.findOne({});
    }
    if (!admin) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản Admin' });
    }

    if (oldPassword && newPassword) {
      const isMatch = await verifyAndUpgrade(admin, oldPassword);
      if (!isMatch) {
        return res.status(400).json({ error: 'Mật khẩu cũ không chính xác' });
      }
      admin.password = await bcrypt.hash(newPassword, 12);
    }

    if (adminEmail) {
      admin.email = adminEmail;
    }

    await admin.save();

    logAdminAuditAction(req, 'UPDATE_ADMIN_SETTINGS', admin._id, admin.email || 'admin', 'Cập nhật tài khoản và đổi mật khẩu Admin');

    res.json({
      success: true,
      message: 'Đã cập nhật cài đặt tài khoản Admin thành công'
    });
  } catch (err) {
    console.error('Error updating admin account settings:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/users/:id/update-profile - Chỉnh sửa thông tin hồ sơ & Gia hạn ngày hết hạn (expiresAt)
router.put('/users/:id/update-profile', requireAdmin, async (req, res) => {
  try {
    const { displayName, headline, phone, address, jobTitle, education, expiresAt, addDays, joyDenom } = req.body;
    const Bio = (await import('../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    if (displayName !== undefined) bio.displayName = displayName;
    if (headline !== undefined) bio.headline = headline;
    if (phone !== undefined) bio.phone = phone;
    if (address !== undefined) bio.address = address;
    if (jobTitle !== undefined) bio.jobTitle = jobTitle;
    if (education !== undefined) bio.education = education;
    if (joyDenom !== undefined) bio.joyDenom = joyDenom;
    if (joyDenom !== undefined) invalidateMemberGate(bio.email);

    if (addDays && !isNaN(Number(addDays))) {
      const currentExp = bio.expiresAt ? new Date(bio.expiresAt).getTime() : Date.now();
      const baseTime = Math.max(Date.now(), currentExp);
      bio.expiresAt = new Date(baseTime + Number(addDays) * 24 * 60 * 60 * 1000);
    } else if (expiresAt) {
      bio.expiresAt = new Date(expiresAt);
    }

    if (!Array.isArray(bio.history)) {
      bio.history = [];
    }

    const expDateStr = bio.expiresAt && !isNaN(new Date(bio.expiresAt).getTime())
      ? new Date(bio.expiresAt).toLocaleDateString('vi-VN')
      : 'Vĩnh viễn';

    bio.history.push({
      type: 'info',
      icon: 'edit_note',
      title: 'Hồ sơ cập nhật bởi Admin',
      detail: `Admin đã điều chỉnh thông tin cá nhân và thời hạn sử dụng (${expDateStr}).`,
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    await bio.save();

    logAdminAuditAction(req, 'UPDATE_USER_PROFILE', bio._id, bio.email, `Cập nhật hồ sơ & thời hạn HSD (${expDateStr}) cho ${bio.displayName}`);

    res.json({
      success: true,
      message: `Đã cập nhật hồ sơ và thời hạn sử dụng cho ${bio.displayName}`,
      bio
    });
  } catch (err) {
    console.error('Error updating user profile & expiration:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/adjust-joy - Điều chỉnh số dư JOY (Cộng/Trừ) trực tiếp theo đơn vị
router.post('/users/:id/adjust-joy', requireAdmin, async (req, res) => {
  try {
    const { amount, description, unit = 'JOY' } = req.body;
    const rawNum = Number(amount);
    if (!rawNum || isNaN(rawNum)) {
      return res.status(400).json({ error: 'Số lượng JOY không hợp lệ' });
    }

    let multiplier = 1;
    if (unit === 'kJOY') multiplier = 1000;
    if (unit === 'MJOY') multiplier = 1000000;

    const baseJoyAmount = Math.round(rawNum * multiplier);
    if (!baseJoyAmount) {
      return res.status(400).json({ error: 'Số lượng quy đổi bằng 0' });
    }

    const Bio = (await import('../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const unitTag = unit !== 'JOY' ? ` (${rawNum > 0 ? '+' : ''}${rawNum} ${unit})` : '';
    const desc = description ? `${description}${unitTag}` : `Admin điều chỉnh số dư JOY${unitTag}`;
    const updatedBio = await awardJoy(bio.email, baseJoyAmount, 'admin_adjustment', desc);

    bio.history.push({
      type: 'info',
      icon: 'account_balance_wallet',
      title: 'Số dư JOY thay đổi bởi Admin',
      detail: `${baseJoyAmount > 0 ? '+' : ''}${baseJoyAmount.toLocaleString()} JOY (${desc})`,
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    await bio.save();

    logAdminAuditAction(req, 'ADJUST_JOY', bio._id, bio.email, desc, {
      rawNum,
      unit,
      baseJoyAmount,
      newBalance: updatedBio.joyBalance
    });

    res.json({
      success: true,
      message: `Đã ${baseJoyAmount > 0 ? 'cộng' : 'trừ'} ${Math.abs(baseJoyAmount).toLocaleString()} JOY cho ${bio.displayName}`,
      newBalance: updatedBio.joyBalance,
      baseJoyAmount
    });
  } catch (err) {
    console.error('Error adjusting user JOY:', err);
    res.status(500).json({ error: err.message || 'Lỗi khi điều chỉnh JOY' });
  }
});

// GET /admin/users/:id/joy-reconciliation - Kiểm tra đối soát số dư JOY với tổng sổ cái JoyLedger
router.get('/users/:id/joy-reconciliation', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../models/Bio.js')).default;
    const { reconcileJoyBalance } = await import('../utils/joyService.js');
    const bio = await Bio.findById(req.params.id).lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const recon = await reconcileJoyBalance(bio.email, false);
    res.json({ success: true, reconciliation: recon });
  } catch (err) {
    console.error('Error checking JOY reconciliation:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/reconcile-joy - Khôi phục & Đồng bộ hóa chuẩn số dư Ví JOY theo Sổ cái
router.post('/users/:id/reconcile-joy', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../models/Bio.js')).default;
    const { reconcileJoyBalance } = await import('../utils/joyService.js');
    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    const userEmail = bio.email || bio.contactEmail || bio._id;
    const recon = await reconcileJoyBalance(userEmail, true);

    logAdminAuditAction(req, 'RECONCILE_JOY', bio._id, bio.email, `Đồng bộ chuẩn hóa Ví JOY từ ${recon.currentBalance} thành ${recon.totalLedgerSum} JOY`, {
      oldBalance: recon.currentBalance,
      newBalance: recon.totalLedgerSum,
      drift: recon.drift
    });

    res.json({
      success: true,
      message: `Đã đối soát và đồng bộ chuẩn hóa số dư ${recon.totalLedgerSum.toLocaleString()} JOY cho ${bio.displayName}`,
      reconciliation: recon
    });
  } catch (err) {
    console.error('Error executing JOY reconciliation:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/audit-logs - Lấy danh sách nhật ký kiểm toán hành động quản trị
router.get('/audit-logs', requireAdmin, async (req, res) => {
  try {
    const AdminAuditLog = (await import('../models/AdminAuditLog.js')).default;
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const logs = await AdminAuditLog.find().sort({ timestamp: -1 }).limit(limit).lean();
    res.json({ success: true, logs });
  } catch (err) {
    console.error('Error fetching admin audit logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/send-voucher - Gửi tặng Voucher / JOY quà tặng kèm Tự động dịch sang ngôn ngữ thành viên
router.post('/users/:id/send-voucher', requireAdmin, async (req, res) => {
  try {
    const { voucherCode, joyReward, message } = req.body;
    const Bio = (await import('../models/Bio.js')).default;
    const { awardJoy } = await import('../utils/joyService.js');
    const { sendCustomEmail } = await import('../services/emailService.js');

    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    let giftJoy = Number(joyReward) || 0;
    if (giftJoy > 0) {
      await awardJoy(bio.email, giftJoy, 'admin_voucher', `Nhận Voucher Quà Tặng Admin (${voucherCode || 'GIFT-VOUCHER'})`);
    }

    const lang = (bio.preferredLanguage || bio.countryCode || 'vi').toLowerCase();
    
    // Auto-translation dictionary for voucher notification emails
    const translations = {
      en: {
        subject: `🎁 You've Received a Special JOY Voucher (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `Hello ${bio.displayName || 'Member'},`,
        body: `You have received a special voucher/gift from Hugo Studio Admin!`,
        giftText: giftJoy > 0 ? `Gift JOY Awarded: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `Message from Admin:`
      },
      ja: {
        subject: `🎁 特別なJOYバウチャーを受け取りました (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `こんにちは ${bio.displayName || '会員様'},`,
        body: `Hugo Studio Adminより特別なバウチャー/ギフトが贈られました！`,
        giftText: giftJoy > 0 ? `付与されたJOY: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `管理者からのメッセージ:`
      },
      ko: {
        subject: `🎁 특별한 JOY 바우처를 받으셨습니다 (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `안녕하세요 ${bio.displayName || '회원님'},`,
        body: `Hugo Studio Admin으로부터 특별한 바우처/선물을 받으셨습니다!`,
        giftText: giftJoy > 0 ? `지급된 JOY: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `관리자 메시지:`
      },
      vi: {
        subject: `Bạn đã nhận được Voucher JOY Đặc biệt (${voucherCode || 'GIFT-VOUCHER'})`,
        greeting: `Chào ${bio.displayName || 'Thành viên'},`,
        body: `Bạn đã nhận được voucher/quà tặng đặc biệt từ Ban Quản Trị Hugo Studio!`,
        giftText: giftJoy > 0 ? `JOY Tặng kèm: +${giftJoy.toLocaleString()} JOY` : '',
        msgLabel: `Thông điệp từ Admin:`
      }
    };

    const t = translations[lang] || translations.vi;
    const finalSubject = t.subject;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 20px;">
        <h2 style="color: #fbbf24;">${finalSubject}</h2>
        <p>${t.greeting}</p>
        <p>${t.body}</p>
        ${giftJoy > 0 ? `<div style="padding: 12px 16px; background: rgba(251, 191, 36, 0.15); border: 1px solid #fbbf24; border-radius: 12px; color: #fbbf24; font-weight: bold; font-size: 16px; margin: 16px 0;">${t.giftText}</div>` : ''}
        ${message ? `<p style="background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;"><strong>${t.msgLabel}</strong><br>${message}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Email này được tự động gửi và dịch theo ngôn ngữ của thành viên (${lang.toUpperCase()}).</p>
      </div>
    `;

    await sendCustomEmail(bio.email, finalSubject, emailHtml);

    logAdminAuditAction(req, 'SEND_VOUCHER', bio._id, bio.email, `Gửi Voucher "${voucherCode || 'GIFT'}" (+${giftJoy} JOY) cho ${bio.displayName} (Tự động dịch: ${lang.toUpperCase()})`);

    res.json({
      success: true,
      message: `Đã gửi voucher và ${giftJoy > 0 ? `tặng +${giftJoy.toLocaleString()} JOY` : ''} cho ${bio.displayName} (Đã dịch tự động sang ${lang.toUpperCase()})`
    });
  } catch (err) {
    console.error('Error sending voucher to user:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/brain/auto-moderator/scan - AI Quét tự động rủi ro an ninh & biến động JOY
router.get('/brain/auto-moderator/scan', requireAdmin, async (req, res) => {
  try {
    const { runAutoModerationScan } = await import('../services/adminBrainService.js');
    const result = await runAutoModerationScan();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error running auto moderation scan:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/brain/auto-moderator/resolve - Xử lý / Giải quyết rủi ro an ninh AI
router.post('/brain/auto-moderator/resolve', requireAdmin, async (req, res) => {
  try {
    const { userId, freezeWallet = false, action = 'DISMISS' } = req.body;
    const Bio = (await import('../models/Bio.js')).default;
    const bio = await Bio.findById(userId);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    if (freezeWallet) {
      bio.isJoyWalletFrozen = true;
      bio.history.push({
        type: 'security',
        icon: 'ac_unit',
        title: 'Ví JOY bị đóng băng bởi AI Auto-Moderator',
        detail: 'Hệ thống AI đã đóng băng Ví khẩn cấp để ngăn chặn gian lận.',
        timestamp: new Date()
      });
    } else if (action === 'UNFREEZE') {
      bio.isJoyWalletFrozen = false;
    }

    await bio.save();

    logAdminAuditAction(req, 'RESOLVE_AI_RISK', bio._id, bio.email, `Xử lý cảnh báo AI risk: ${action} (Freeze: ${freezeWallet})`);

    res.json({
      success: true,
      message: `Đã xử lý cảnh báo rủi ro an ninh cho ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error resolving auto moderation risk:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/revoke-session - Đăng xuất cưỡng chế & Thu hồi phiên làm việc
router.post('/users/:id/revoke-session', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }

    const { revokeMemberSession } = await import('../utils/memberSession.js');
    await revokeMemberSession(bio, 'Admin');

    logAdminAuditAction(req, 'REVOKE_SESSION', bio._id, bio.email, `Thu hồi phiên đăng nhập của ${bio.displayName}`);

    res.json({
      success: true,
      message: `Đã thu hồi phiên làm việc và đăng xuất cưỡng chế người dùng ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error revoking user session:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/send-email - Gửi email trực tiếp cho người dùng
router.post('/users/:id/send-email', requireAdmin, async (req, res) => {
  try {
    const { subject, htmlMessage, instructions } = req.body;
    if (!subject) {
      return res.status(400).json({ error: 'Tiêu đề email (subject) là bắt buộc' });
    }

    const Bio = (await import('../models/Bio.js')).default;
    const { sendCustomEmail } = await import('../services/emailService.js');

    const bio = await Bio.findById(req.params.id).lean();
    if (!bio || !bio.email) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin email của người dùng' });
    }

    const bodyContent = htmlMessage || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 16px;">
        <h2 style="color: #38bdf8;">${subject}</h2>
        <p>Chào <strong>${bio.displayName || bio.email}</strong>,</p>
        <p>${instructions || 'Bạn có một thông báo mới từ Quản trị viên Hugo Studio.'}</p>
        <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;">
        <p style="color: #94a3b8; font-size: 12px;">Email này được gửi trực tiếp từ Ban Quản Trị Hugo Studio.</p>
      </div>
    `;

    const result = await sendCustomEmail(bio.email, subject, bodyContent);
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Gửi email thất bại' });
    }

    logAdminAuditAction(req, 'SEND_EMAIL', bio._id, bio.email, `Gửi email "${subject}" đến ${bio.email}`);

    res.json({
      success: true,
      message: `Đã gửi email thành công tới ${bio.email}`
    });
  } catch (err) {
    console.error('Error sending direct email to user:', err);
    res.status(500).json({ error: err.message });
  }
});

async function logAdminAuditAction(req, action, targetUserId, targetUserEmail, details, metadata = {}) {
  try {
    const AdminAuditLog = (await import('../models/AdminAuditLog.js')).default;
    const adminId = req.user?.username || req.user?.id || 'admin';
    const adminEmail = req.user?.email || adminId;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    
    await AdminAuditLog.create({
      adminId,
      adminEmail,
      action,
      targetUserId,
      targetUserEmail,
      details,
      metadata,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to log admin audit action:', err);
  }
}

// GET /admin/store/products - Lấy toàn bộ sản phẩm Utility Store cho Admin (kèm sản phẩm ẩn)
router.get('/store/products', requireAdmin, async (req, res) => {
  try {
    const UtilityProduct = (await import('../models/UtilityProduct.js')).default;
    const products = await UtilityProduct.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, products });
  } catch (err) {
    console.error('Error fetching admin store products:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/store/products - Tạo mới sản phẩm Utility Store
router.post('/store/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, priceJoy, icon, category, active, stock, imageUrl, productType, extendDays } = req.body;
    if (!name || !priceJoy) {
      return res.status(400).json({ error: 'Tên sản phẩm và Giá JOY là bắt buộc' });
    }
    const UtilityProduct = (await import('../models/UtilityProduct.js')).default;
    const product = await UtilityProduct.create({
      name,
      description: description || '',
      priceJoy: Number(priceJoy),
      icon: icon || 'redeem',
      category: category || 'general',
      active: active !== undefined ? active : true,
      stock: stock !== undefined ? Number(stock) : -1,
      imageUrl: imageUrl || '',
      productType: productType || 'general',
      extendDays: Number(extendDays) || 0
    });

    logAdminAuditAction(req, 'CREATE_STORE_PRODUCT', '', '', `Tạo sản phẩm "${product.name}" với giá ${product.priceJoy} JOY`);

    res.json({ success: true, product });
  } catch (err) {
    console.error('Error creating store product:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/store/products/:id - Cập nhật thông tin sản phẩm Utility Store
router.put('/store/products/:id', requireAdmin, async (req, res) => {
  try {
    const UtilityProduct = (await import('../models/UtilityProduct.js')).default;
    const product = await UtilityProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    logAdminAuditAction(req, 'UPDATE_STORE_PRODUCT', '', '', `Cập nhật sản phẩm "${product.name}" (${product.priceJoy} JOY)`);

    res.json({ success: true, product });
  } catch (err) {
    console.error('Error updating store product:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/store/products/:id - Bật/tắt sản phẩm Store
router.delete('/store/products/:id', requireAdmin, async (req, res) => {
  try {
    const UtilityProduct = (await import('../models/UtilityProduct.js')).default;
    const product = await UtilityProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    product.active = !product.active;
    await product.save();

    logAdminAuditAction(req, 'TOGGLE_STORE_PRODUCT', '', '', `Đổi trạng thái sản phẩm "${product.name}" thành ${product.active ? 'Bật' : 'Ẩn'}`);

    res.json({ success: true, product, message: `Đã ${product.active ? 'kích hoạt' : 'ẩn'} sản phẩm` });
  } catch (err) {
    console.error('Error toggling store product:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/store/orders - Danh sách đơn hàng mua sắm Store
router.get('/store/orders', requireAdmin, async (req, res) => {
  try {
    const UtilityOrder = (await import('../models/UtilityOrder.js')).default;
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const orders = await UtilityOrder.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching admin store orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/store/orders/:id/cancel-refund - Hủy đơn hàng & Hoàn tiền JOY 1-Click
router.post('/store/orders/:id/cancel-refund', requireAdmin, async (req, res) => {
  try {
    const UtilityOrder = (await import('../models/UtilityOrder.js')).default;
    const order = await UtilityOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Đơn hàng này đã bị hủy trước đó' });
    }

    const { awardJoy } = await import('../utils/joyService.js');
    order.status = 'cancelled';
    await order.save();

    // Auto refund JOY to user wallet
    const updatedBio = await awardJoy(order.email, order.priceJoy, 'admin_adjustment', `Admin hủy đơn hàng ${order.purchaseCode} & Hoàn tiền JOY`);

    logAdminAuditAction(req, 'CANCEL_REFUND_ORDER', '', order.email, `Hủy đơn ${order.purchaseCode} & Hoàn ${order.priceJoy} JOY cho ${order.email}`, {
      orderId: order._id,
      refundJoy: order.priceJoy
    });

    res.json({
      success: true,
      message: `Đã hủy đơn hàng ${order.purchaseCode} và hoàn +${order.priceJoy.toLocaleString()} JOY cho ${order.email}`,
      order,
      newBalance: updatedBio.joyBalance
    });
  } catch (err) {
    console.error('Error cancelling order and refunding JOY:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/toggle-wallet-freeze - Đóng băng / Mở đóng băng Ví JOY
router.post('/users/:id/toggle-wallet-freeze', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    bio.isJoyWalletFrozen = !bio.isJoyWalletFrozen;
    bio.history.push({
      type: bio.isJoyWalletFrozen ? 'warning' : 'info',
      icon: 'ac_unit',
      title: bio.isJoyWalletFrozen ? 'Ví JOY bị đóng băng' : 'Mở đóng băng Ví JOY',
      detail: bio.isJoyWalletFrozen ? 'Ví JOY đã bị Admin tạm thời đóng băng kiểm soát.' : 'Admin đã mở đóng băng Ví JOY.',
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    await bio.save();

    logAdminAuditAction(req, 'TOGGLE_WALLET_FREEZE', bio._id, bio.email, `${bio.isJoyWalletFrozen ? 'Đóng băng' : 'Mở đóng băng'} Ví JOY của ${bio.displayName}`);

    res.json({
      success: true,
      isJoyWalletFrozen: bio.isJoyWalletFrozen,
      message: `Đã ${bio.isJoyWalletFrozen ? 'đóng băng' : 'mở đóng băng'} Ví JOY của ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error toggling wallet freeze:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:id/toggle-edu-status - Phê duyệt / Thu hồi EDU Status
router.post('/users/:id/toggle-edu-status', requireAdmin, async (req, res) => {
  try {
    const Bio = (await import('../models/Bio.js')).default;
    const bio = await Bio.findById(req.params.id);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng' });

    bio.isEduVerified = !bio.isEduVerified;
    bio.history.push({
      type: 'info',
      icon: 'school',
      title: bio.isEduVerified ? 'Xác minh Sinh viên EDU thành công' : 'Thu hồi trạng thái EDU',
      detail: bio.isEduVerified ? 'Admin đã phê duyệt xác minh ưu đãi Sinh viên EDU.' : 'Admin đã thu hồi trạng thái Sinh viên EDU.',
      timestamp: new Date()
    });
    if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
    await bio.save();

    logAdminAuditAction(req, 'TOGGLE_EDU_STATUS', bio._id, bio.email, `${bio.isEduVerified ? 'Xác minh EDU' : 'Thu hồi EDU'} cho ${bio.displayName}`);

    res.json({
      success: true,
      isEduVerified: bio.isEduVerified,
      message: `Đã ${bio.isEduVerified ? 'phê duyệt xác minh EDU' : 'thu hồi trạng thái EDU'} cho ${bio.displayName}`
    });
  } catch (err) {
    console.error('Error toggling EDU status:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/ai-support/briefing - Báo cáo chủ động các việc AI Support Admin đã tự động làm
router.get('/ai-support/briefing', requireAdmin, async (req, res) => {
  try {
    const { getPendingBriefing } = await import('../services/aiSupportAdminService.js');
    const briefingData = await getPendingBriefing();
    res.json({ success: true, ...briefingData });
  } catch (err) {
    console.error('Error fetching AI Support briefing:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/ai-support/mark-read - Đánh dấu đã xem báo cáo của AI
router.post('/ai-support/mark-read', requireAdmin, async (req, res) => {
  try {
    const { markBriefingReported } = await import('../services/aiSupportAdminService.js');
    const { logIds } = req.body || {};
    await markBriefingReported(logIds);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc báo cáo AI thành công' });
  } catch (err) {
    console.error('Error marking AI briefing read:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── BOT SECURITY SENTINEL TELEMETRY ROUTES ──────────────────────────────────
router.get('/security/sentinel-summary', requireAdmin, async (req, res) => {
  try {
    const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
    const SecurityBlock = (await import('../models/SecurityBlock.js')).default;
    const SecurityEvent = (await import('../models/SecurityEvent.js')).default;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingCount, activeBlocksCount, events24hCount, pendingModerations, activeBlocks, recentEvents] = await Promise.all([
      SecurityModeration.countDocuments({ status: 'pending' }),
      SecurityBlock.countDocuments(),
      SecurityEvent.countDocuments({ createdAt: { $gte: since24h } }),
      SecurityModeration.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(20).lean(),
      SecurityBlock.find().sort({ createdAt: -1 }).limit(50).lean(),
      SecurityEvent.find().sort({ createdAt: -1 }).limit(30).lean(),
    ]);

    res.json({
      success: true,
      pendingCount,
      activeBlocksCount,
      events24hCount,
      pendingModerations,
      activeBlocks,
      recentEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/security/resolve-moderation', requireAdmin, async (req, res) => {
  try {
    const { caseId, action } = req.body || {};
    if (!caseId || !['approve', 'dismiss'].includes(action)) {
      return res.status(400).json({ error: 'Yêu cầu không hợp lệ' });
    }

    const SecurityModeration = (await import('../models/SecurityModeration.js')).default;
    const mod = await SecurityModeration.findOne({ caseId });
    if (!mod) return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });

    if (action === 'approve') {
      const { applyActorBlock } = await import('../services/securityEnforcement.js');
      await applyActorBlock({ ip: mod.ip, email: mod.email, phone: mod.phone, caseId: mod.caseId, reasonCode: mod.category });
      mod.status = 'approved';
    } else {
      mod.status = 'dismissed';
    }
    mod.decidedBy = req.admin?.username || 'Admin_Panel';
    mod.decidedAt = new Date();
    await mod.save();

    res.json({ success: true, message: action === 'approve' ? 'Đã thực thi khóa 24h' : 'Đã bỏ qua ca vi phạm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/security/unblock-actor', requireAdmin, async (req, res) => {
  try {
    const { blockId, actorKey } = req.body || {};
    const SecurityBlock = (await import('../models/SecurityBlock.js')).default;

    let query = {};
    if (blockId) query = { _id: blockId };
    else if (actorKey) query = { actorKey };
    else return res.status(400).json({ error: 'Thiếu thông tin unblock' });

    const deleted = await SecurityBlock.deleteMany(query);
    res.json({ success: true, deletedCount: deleted.deletedCount, message: 'Đã giải khóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

