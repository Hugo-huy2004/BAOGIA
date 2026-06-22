import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'hugo-wishpax-super-secret-key-2024';

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

export default router;
