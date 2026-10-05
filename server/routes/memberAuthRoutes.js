import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginWithGoogle,
  requestMemberOtp,
  verifyMemberOtp,
  loginWithApple,
  devLogin,
  logoutMember,
} from '../modules/auth/memberAuthController.js';

const router = express.Router();

const googleLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.' },
});

// ==========================================
// API CHA: /api/auth/member
// Điều phối các API con của phân hệ xác thực thành viên
// ==========================================

// --- 1. Đăng nhập Google ---
router.post('/google', googleLoginLimiter, async (req, res) => {
  return loginWithGoogle(req, res);
});

// --- 2. Đăng nhập bằng mã OTP qua Email ---
router.post('/request-otp', googleLoginLimiter, async (req, res) => {
  return requestMemberOtp(req, res);
});

router.post('/verify-otp', googleLoginLimiter, async (req, res) => {
  return verifyMemberOtp(req, res);
});

// --- 3. Đăng nhập Apple (Dự phòng) ---
router.post('/apple', googleLoginLimiter, async (req, res) => {
  return loginWithApple(req, res);
});

// --- 4. Đăng nhập phát triển cục bộ (Chỉ DEV) ---
router.post('/dev-login', async (req, res) => {
  return devLogin(req, res);
});

// --- 5. Đăng xuất phiên làm việc ---
router.post('/logout', async (req, res) => {
  return logoutMember(req, res);
});

export default router;
