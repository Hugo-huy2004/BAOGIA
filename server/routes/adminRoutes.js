import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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

// Helper for SHA-256 (to match the existing MongoDB hashed credentials)
const sha256 = (message) => {
  return crypto.createHash('sha256').update(message).digest('hex');
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const usernameHash = sha256(username);
    const passwordHash = sha256(password);

    const admin = await Admin.findOne({ username: usernameHash, password: passwordHash });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
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
        id: admin._id,
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

    const passwordHash = sha256(password);
    if (admin.password !== passwordHash) {
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

    if (admin.password !== sha256(currentPassword)) {
      return res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác' });
    }

    admin.password = sha256(newPassword);
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
import { getQuotaStatus } from '../services/aiGateway.js';
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

export default router;
