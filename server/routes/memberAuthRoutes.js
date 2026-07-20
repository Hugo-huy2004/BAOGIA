import express from 'express';
import rateLimit from 'express-rate-limit';
import { signMemberToken } from '../middleware/authMiddleware.js';
import { GOOGLE_CLIENT_ID } from '../utils/secrets.js';

const router = express.Router();

// Google login is verified server-side (Google signs the token), so this isn't
// about brute-force — it caps token-verification abuse / DoS per IP.
const googleLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.' }
});

const isProduction = process.env.NODE_ENV === 'production';
const MEMBER_COOKIE_MAX_AGE = 14 * 24 * 60 * 60 * 1000; // mirror token TTL (14d)

const setMemberCookie = (res, token) => {
  res.cookie('member_jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: MEMBER_COOKIE_MAX_AGE,
  });
};

// POST /api/auth/member/google  { credential }
// Verifies the Google ID token server-side (signature, expiry, audience) and
// issues our own member session token. The frontend must never mint a session
// from a client-side-decoded Google payload — that let anyone impersonate any
// email by editing localStorage.
router.post('/google', googleLoginLimiter, async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Thiếu Google credential.' });
    }

    // tokeninfo validates signature + expiry on Google's side and echoes claims.
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Google credential không hợp lệ hoặc đã hết hạn.' });
    }
    const claims = await verifyRes.json();

    if (GOOGLE_CLIENT_ID && claims.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Google credential không thuộc ứng dụng này.' });
    }
    if (!GOOGLE_CLIENT_ID && isProduction) {
      // Without an audience check any Google-issued token (for any app) would
      // log in here. Refuse rather than silently accept in production.
      console.error('GOOGLE_CLIENT_ID is not configured — rejecting member login.');
      return res.status(500).json({ error: 'Máy chủ chưa cấu hình đăng nhập Google.' });
    }
    if (claims.email_verified !== 'true' && claims.email_verified !== true) {
      return res.status(401).json({ error: 'Email Google chưa được xác minh.' });
    }

    const email = String(claims.email || '').toLowerCase();
    if (!email) return res.status(401).json({ error: 'Không đọc được email từ Google.' });

    const cryptoMod = await import('crypto');
    const ua = req.headers['user-agent'] || '';
    const uaHash = cryptoMod.createHash('sha256').update(ua).digest('hex');
    const BioMod = (await import('../models/Bio.js')).default;
    // Set lastUserAgentHash and clear locationAnomaly since they just re-logged in successfully
    await BioMod.updateOne({ email }, { $set: { lastUserAgentHash: uaHash, locationAnomaly: false } });

    const token = signMemberToken(email, req);
    setMemberCookie(res, token);

    res.json({
      success: true,
      token, // Bearer fallback for cross-origin deployments where the cookie can't flow
      member: {
        email,
        displayName: claims.name || email,
        avatarUrl: claims.picture || '',
        provider: 'google',
      },
    });
  } catch (error) {
    console.error('Member Google login error:', error);
    res.status(500).json({ error: 'Đăng nhập thất bại, vui lòng thử lại.' });
  }
});

// POST /api/auth/member/logout
router.post('/logout', (req, res) => {
  res.clearCookie('member_jwt');
  res.json({ success: true });
});

export default router;
