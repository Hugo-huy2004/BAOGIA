/**
 * memberAuthController.js
 * Controller tập trung toàn bộ logic nghiệp vụ xác thực thành viên (Google OAuth, OTP Email, Dev Login).
 */
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { signMemberToken, invalidateMemberGate } from '../../middleware/authMiddleware.js';
import { GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../../utils/secrets.js';
import { findActiveSecurityBlock, sendSecurityBlockResponse } from '../../services/securityEnforcement.js';
import { isEduEmail } from '../../utils/eduEmail.js';
import Bio from '../../models/Bio.js';
import { issueEmailOtp, verifyEmailOtp } from '../../utils/emailOtp.js';
import { sendMagicLinkOtp } from '../../services/emailService.js';

export const isProduction = process.env.NODE_ENV === 'production';
export const MEMBER_COOKIE_MAX_AGE = 14 * 24 * 60 * 60 * 1000;

export const setMemberCookie = (res, token) => {
  res.cookie('member_jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: MEMBER_COOKIE_MAX_AGE,
  });
};

/**
 * Đăng nhập bằng Google ID Token
 */
export async function loginWithGoogle(req, res) {
  try {
    const { credential } = req.body;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Thiếu Google credential.' });
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (verifyRes.status === 429 || verifyRes.status >= 500) {
      return res.status(503).json({ error: 'Google tạm thời không phản hồi. Vui lòng thử lại.' });
    }
    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'Google credential không hợp lệ hoặc đã hết hạn.' });
    }
    const claims = await verifyRes.json();

    const allowedAud = [GOOGLE_CLIENT_ID, GOOGLE_IOS_CLIENT_ID].filter(Boolean);
    if (allowedAud.length && !allowedAud.includes(claims.aud)) {
      return res.status(401).json({ error: 'Google credential không thuộc ứng dụng này.' });
    }
    if (!GOOGLE_CLIENT_ID && isProduction) {
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

    const ua = req.headers['user-agent'] || '';
    const uaHash = crypto.createHash('sha256').update(ua).digest('hex');

    const baseSlug =
      (claims.name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `user-${Date.now()}`;
    const slug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

    await Bio.updateOne(
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
        },
      },
      { upsert: true }
    );
    invalidateMemberGate(email);

    const token = signMemberToken(email, req);
    setMemberCookie(res, token);

    return res.json({
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
    return res.status(500).json({ error: error.message || 'Đăng nhập thất bại, vui lòng thử lại.' });
  }
}

/**
 * Gửi mã OTP đăng nhập qua Email
 */
export async function requestMemberOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Vui lòng nhập địa chỉ email.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const code = issueEmailOtp(cleanEmail, 'login');
    await sendMagicLinkOtp(cleanEmail, code);

    return res.json({ success: true, message: `Mã OTP đã gửi tới ${cleanEmail}.` });
  } catch (error) {
    console.error('Request OTP error:', error);
    return res.status(500).json({ error: 'Không thể gửi mã OTP. Vui lòng thử lại.' });
  }
}

/**
 * Xác thực mã OTP và cấp session token
 */
export async function verifyMemberOtp(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Thiếu email hoặc mã OTP.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const check = verifyEmailOtp(cleanEmail, code, 'login');

    if (!check.ok) {
      return res.status(401).json({
        error:
          check.reason === 'expired'
            ? 'Mã OTP không hợp lệ hoặc đã hết hạn (10 phút).'
            : 'Mã OTP không chính xác.',
      });
    }

    const securityBlock = await findActiveSecurityBlock({ email: cleanEmail });
    if (securityBlock) return sendSecurityBlockResponse(res, securityBlock);

    const token = signMemberToken(cleanEmail, req);
    setMemberCookie(res, token);

    return res.json({
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
    return res.status(500).json({ error: 'Xác thực OTP thất bại.' });
  }
}

/**
 * Stub đăng nhập Apple (chưa sẵn sàng)
 */
export async function loginWithApple(_req, res) {
  return res.status(503).json({ error: 'Đăng nhập Apple chưa sẵn sàng. Vui lòng dùng Google.' });
}

/**
 * Dev-only login bypass (chỉ cho phép môi trường dev)
 */
export async function devLogin(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not Found' });
  }

  const email = String(req.body.email || 'dev.member@hugowishpax.studio').toLowerCase();
  const name = String(req.body.name || 'Dev Member');

  const token = signMemberToken(email, req);
  setMemberCookie(res, token);

  return res.json({
    success: true,
    token,
    member: {
      email,
      displayName: name,
      provider: 'dev_local',
    },
  });
}

/**
 * Đăng xuất và xóa cookie JWT
 */
export async function logoutMember(req, res) {
  res.clearCookie('member_jwt');
  return res.json({ success: true });
}
