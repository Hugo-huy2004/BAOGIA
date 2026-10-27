import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import {
  loginWithGoogle,
  requestMemberOtp,
  verifyMemberOtp,
  loginWithApple,
  devLogin,
  logoutMember,
} from '../modules/auth/memberAuthController.js';

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';

// Ai đang đăng nhập — đọc từ body, CHƯA xác minh (xác minh là việc của
// controller). Chỉ dùng làm khoá đếm: giả một email/sub mới là được bucket mới,
// nhưng token giả thì Google/Apple từ chối ngay, còn tổng lượt vẫn bị loginIpCeiling chặn.
function loginSubject(req) {
  const body = req.body || {};
  const token = typeof body.credential === 'string' ? body.credential
    : typeof body.identityToken === 'string' ? body.identityToken : '';
  if (token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64url').toString('utf8'));
      const id = String(payload.email || payload.sub || '').toLowerCase().slice(0, 200);
      if (id) return `login:${id}`;
    } catch { /* token hỏng: rơi về IP */ }
  }
  if (typeof body.email === 'string' && body.email) return `login:${body.email.trim().toLowerCase().slice(0, 200)}`;
  return `login-ip:${ipKeyGenerator(req.ip)}`;
}

// 30 lần / 15 phút cho MỖI tài khoản. Bản cũ đếm theo IP, mà lượt đi qua Vercel
// chưa có chữ ký edge thì mọi người chung IP Vercel: 200 người vào cùng giờ là
// người thứ 31 trở đi không đăng nhập được.
const googleLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: loginSubject,
  message: { error: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.' },
});

// Trần tổng theo IP, đủ rộng cho cả hội trường sau một NAT (hay một IP Vercel),
// đủ chặt để một máy không xoay vô hạn email giả.
const loginIpCeiling = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 1500 : 10000,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau ít phút.' },
});

// OTP gửi email thật (tốn tiền, dễ bị dùng để spam hộp thư người khác): mỗi
// địa chỉ 5 lần / 15 phút, ngoài trần tổng ở trên.
const otpEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: loginSubject,
  message: { error: 'Bạn đã yêu cầu mã quá nhiều lần. Vui lòng thử lại sau ít phút.' },
});

// ==========================================
// API CHA: /api/auth/member
// Điều phối các API con của phân hệ xác thực thành viên
// ==========================================

// --- 1. Đăng nhập Google ---
router.post('/google', loginIpCeiling, googleLoginLimiter, async (req, res) => {
  return loginWithGoogle(req, res);
});

// --- 2. Đăng nhập bằng mã OTP qua Email ---
router.post('/request-otp', loginIpCeiling, otpEmailLimiter, async (req, res) => {
  return requestMemberOtp(req, res);
});

router.post('/verify-otp', loginIpCeiling, googleLoginLimiter, async (req, res) => {
  return verifyMemberOtp(req, res);
});

// --- 3. Đăng nhập Apple (Dự phòng) ---
router.post('/apple', loginIpCeiling, googleLoginLimiter, async (req, res) => {
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
