import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/Admin.js';

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

export default router;

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ success: true, message: 'Logged out successfully' });
});
