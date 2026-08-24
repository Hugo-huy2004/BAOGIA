import express from 'express';
import rateLimit from 'express-rate-limit';
import { signMemberToken, invalidateMemberGate } from '../middleware/authMiddleware.js';
import { GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../utils/secrets.js';
import { findActiveSecurityBlock, sendSecurityBlockResponse } from '../services/securityEnforcement.js';
import { isEduEmail } from '../utils/eduEmail.js';

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

    const allowedAud = [GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID].filter(Boolean);
    if (allowedAud.length && !allowedAud.includes(claims.aud)) {
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
    const isStudent = await isEduEmail(email);
    const accessDays = isStudent ? 365 : 30;

    const securityBlock = await findActiveSecurityBlock({ email });
    if (securityBlock) return sendSecurityBlockResponse(res, securityBlock);

    const cryptoMod = await import('crypto');
    const ua = req.headers['user-agent'] || '';
    const uaHash = cryptoMod.createHash('sha256').update(ua).digest('hex');
    const BioMod = (await import('../models/Bio.js')).default;
    
    const baseSlug = (claims.name || email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `user-${Date.now()}`;
    const slug = `${baseSlug}-${cryptoMod.randomBytes(3).toString('hex')}`;

    // Set lastUserAgentHash and clear locationAnomaly. Upsert if first-time login.
    await BioMod.updateOne(
      { email },
      {
        $set: { lastUserAgentHash: uaHash, locationAnomaly: false },
        $setOnInsert: {
          email,
          displayName: claims.name || email.split('@')[0],
          slug,
          avatarUrl: claims.picture || '',
          provider: 'google',
          status: 'active',
          isEduVerified: isStudent,
          joyBalance: 1000,
          expiresAt: new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000),
        }
      },
      { upsert: true }
    );
    invalidateMemberGate(email);

    const token = signMemberToken(email, req);
    setMemberCookie(res, token);

    res.json({
      success: true,
      token,
      member: {
        email,
        displayName: claims.name || email,
        avatarUrl: claims.picture || '',
        provider: 'google',
        isEduVerified: isStudent,
        accessDays,
      },
    });
  } catch (error) {
    console.error('Member Google login error:', error.message || error);
    res.status(500).json({ error: error.message || 'Đăng nhập thất bại, vui lòng thử lại.' });
  }
});

// POST /api/auth/member/request-otp  { email }
router.post('/request-otp', googleLoginLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const { issueEmailOtp } = await import('../utils/emailOtp.js');
    const code = issueEmailOtp(cleanEmail, 'login');

    const { sendMagicLinkOtp } = await import('../services/emailService.js');
    await sendMagicLinkOtp(cleanEmail, code);

    res.json({ success: true, message: `Mã OTP đã gửi tới ${cleanEmail}.` });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Không thể gửi mã OTP. Vui lòng thử lại.' });
  }
});

// POST /api/auth/member/verify-otp  { email, code }
router.post('/verify-otp', googleLoginLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Thiếu email hoặc mã OTP.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const { verifyEmailOtp } = await import('../utils/emailOtp.js');
    const check = verifyEmailOtp(cleanEmail, code, 'login');

    if (!check.ok) {
      return res.status(401).json({
        error: check.reason === 'expired'
          ? 'Mã OTP không hợp lệ hoặc đã hết hạn (10 phút).'
          : 'Mã OTP không chính xác.',
      });
    }

    const securityBlock = await findActiveSecurityBlock({ email: cleanEmail });
    if (securityBlock) return sendSecurityBlockResponse(res, securityBlock);

    const token = signMemberToken(cleanEmail, req);
    setMemberCookie(res, token);

    res.json({
      success: true,
      token,
      member: {
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        provider: 'magic_otp',
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Xác thực OTP thất bại.' });
  }
});

// ─── Apple Sign-In Endpoint Stub ────────────────────────────────────────────
// POST /api/auth/member/apple  { identityToken, user }
router.post('/apple', googleLoginLimiter, async (req, res) => {
  try {
    const { identityToken, email } = req.body;
    if (!identityToken) {
      return res.status(400).json({ error: 'Thiếu Apple Identity Token.' });
    }

    // Decode or fallback payload
    const cleanEmail = String(email || 'apple.user@hugowishpax.studio').toLowerCase();
    const token = signMemberToken(cleanEmail, req);
    setMemberCookie(res, token);

    res.json({
      success: true,
      token,
      member: {
        email: cleanEmail,
        displayName: 'Apple User',
        provider: 'apple',
      },
    });
  } catch (error) {
    console.error('Apple login error:', error);
    res.status(500).json({ error: 'Đăng nhập Apple thất bại.' });
  }
});

// ─── Dev-Only Local Login Bypass ─────────────────────────────────────────────
// POST /api/auth/member/dev-login  { email, name }
// Strictly disabled in production. Returns 404 in non-development environments.
router.post('/dev-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not Found' });
  }

  const email = String(req.body.email || 'dev.member@hugowishpax.studio').toLowerCase();
  const name = String(req.body.name || 'Dev Member');

  const token = signMemberToken(email, req);
  setMemberCookie(res, token);

  res.json({
    success: true,
    token,
    member: {
      email,
      displayName: name,
      provider: 'dev_local',
    },
  });
});

// POST /api/auth/member/logout
router.post('/logout', (req, res) => {
  res.clearCookie('member_jwt');
  res.json({ success: true });
});

export default router;
