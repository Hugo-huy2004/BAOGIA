import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
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

// Exported for unit testing (see tests/adminPassword.test.js).
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

router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const admins = await Admin.find({});
    let matchingAdmin = null;
    for (const admin of admins) {
      if (await verifyAndUpgrade(admin, password)) {
        matchingAdmin = admin;
        break;
      }
    }

    if (!matchingAdmin) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: matchingAdmin._id, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '14d' }
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    });

    res.json({
      success: true,
      admin: {
        id: matchingAdmin._id,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
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

// Change admin password route
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

    admin.password = await bcrypt.hash(newPassword, 12);
    await admin.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Lỗi máy chủ' });
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
  } catch (err) {
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

// ─── Community moderation (admin) ────────────────────────────────────────────
import CommunityMessage from '../models/CommunityMessage.js';
import InAppNotification from '../models/InAppNotification.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { getQuotaStatus, generate } from '../services/aiGateway.js';
import { setBotEnabled, isBotEnabled } from '../utils/communityBot.js';
import ErrorLog from '../models/ErrorLog.js';

// GET /admin/ai-status - Gemini quota/health + auto-poster switch (the "đèn cảnh báo").
router.get('/ai-status', requireAdmin, async (req, res) => {
  try {
    res.json({ success: true, quota: getQuotaStatus(), botEnabled: isBotEnabled() });
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
    const [users, posts, pendingPosts, joyAgg, errors24h, newUsers24h] = await Promise.all([
      Bio.countDocuments({}),
      CommunityMessage.countDocuments({ status: 'approved' }),
      CommunityMessage.countDocuments({ status: 'pending' }),
      Bio.aggregate([{ $group: { _id: null, total: { $sum: '$joyBalance' } } }]),
      ErrorLog.countDocuments({ level: 'error', createdAt: { $gte: dayAgo } }),
      Bio.countDocuments({ createdAt: { $gte: dayAgo } }),
    ]);
    res.json({
      success: true,
      users,
      newUsers24h,
      posts,
      pendingPosts,
      joyCirculating: joyAgg?.[0]?.total || 0,
      errors24h,
      quota: getQuotaStatus(),
      botEnabled: isBotEnabled(),
      uptimeSec: Math.round(process.uptime()),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/community-bot { enabled: bool } - runtime kill-switch for the bot.
router.post('/community-bot', requireAdmin, async (req, res) => {
  try {
    setBotEnabled(!!req.body?.enabled);
    res.json({ success: true, botEnabled: isBotEnabled() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const ADMIN_POST_EMAIL = process.env.ADMIN_BOT_EMAIL || 'huylggcs230377@fpt.edu.vn';

// GET /admin/community/posts - every post, any status. Lean + trimmed fields
// so the admin feed stays light even with hundreds of posts.
router.get('/community/posts', requireAdmin, async (req, res) => {
  try {
    const posts = await CommunityMessage.find({})
      .select('-embedding -location')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    res.json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /admin/community/posts - publish immediately as the verified admin
// identity (no moderation queue; the admin IS the moderator).
router.post('/community/posts', requireAdmin, async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'Nội dung không được trống' });
    if (message.length > 2000) return res.status(400).json({ error: 'Bài viết quá dài' });

    const post = await CommunityMessage.create({
      senderEmail: ADMIN_POST_EMAIL,
      senderName: 'Hugo Studio',
      senderAvatar: '',
      senderSlug: '',
      message,
      location: { lat: 10.8, lng: 106.6 },
      sentiment: 'tích cực',
      category: req.body?.category === 'câu hỏi' ? 'câu hỏi' : 'chia sẻ',
      status: 'approved',
      moderatedAt: new Date(),
      createdAt: new Date()
    });
    res.json({ success: true, post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /admin/community/posts/:id - remove any post; the optional reason is
// delivered to the author as an in-app notification + web push.
router.delete('/community/posts/:id', requireAdmin, async (req, res) => {
  try {
    const post = await CommunityMessage.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Không tìm thấy bài viết' });

    const reason = String(req.body?.reason || '').trim().slice(0, 300);
    await CommunityMessage.deleteOne({ _id: post._id });

    // Notify the author (skip bots — they have no inbox).
    if (!post.isBot && post.senderEmail) {
      const preview = (post.message || '').slice(0, 60);
      const body = reason
        ? `Bài viết "${preview}..." đã bị quản trị viên gỡ. Lý do: ${reason}`
        : `Bài viết "${preview}..." đã bị quản trị viên gỡ do không phù hợp tiêu chuẩn cộng đồng.`;
      try {
        await InAppNotification.create({
          email: post.senderEmail,
          type: 'warning',
          category: 'system',
          title: 'Bài viết cộng đồng đã bị gỡ',
          message: body,
          actionUrl: '/member/account'
        });
        sendPushNotification(post.senderEmail, 'Bài viết cộng đồng đã bị gỡ', body, '/member/account').catch(() => {});
      } catch (notifyErr) {
        console.warn('[AdminCommunity] notify failed:', notifyErr.message);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// GET /admin/coder-submissions
router.get('/coder-submissions', requireAdmin, async (req, res) => {
  try {
    // Find all bios who completed lesson62 (which is the last lesson of Chặng 5, indicating they reached Chặng 6+)
    const submissions = await Bio.find({
      completedLessons: 'lesson62'
    }).select('email displayName avatarUrl completedLessons hugoCoderProjectUrl hugoCoderProjectStatus hugoCoderCertificateUrl hugoCoderProjectSubmittedAt hugoCoderProjectNote hugoCoderProjectAdminNote')
      .sort({ hugoCoderProjectSubmittedAt: -1 })
      .lean();

    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching coder submissions:', error);
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
          'Đạt thành tích Xuất Sắc tốt nghiệp HugoCoder (+4,000 JOY)',
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
  // POSTS MODERATION
  else if (hasWord(["bai viet", "posts", "post", "feed", "tin nhan cong dong"])) {
    intent = "posts";
    const isDelete = hasWord(["xoa", "huy", "delete", "remove", "go"]);
    reason = isDelete ? "delete" : "list";
    const matchId = text.match(/([a-fA-F0-9]{24})/);
    if (matchId) query = matchId[0];
    const matchEmail = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (matchEmail) recipient = matchEmail[0];
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
- "bot": to toggle the community bot. Examples: "bật bot", "bot off", "tắt bot".
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
    } catch (fbErr) {
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
          actionUrl: '/member/portal?tab=history'
        }).catch(err => console.error(`Error creating InAppNotification for ${bio.email}:`, err.message))
      );

      // Send Push notification
      if (bio.email) {
        pushPromises.push(
          sendPushNotification(bio.email, userSubject, userPushText, '/member/portal?tab=history').catch(() => {})
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

export default router;
