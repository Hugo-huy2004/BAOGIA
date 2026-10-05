import express from 'express';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  getRegisterOptions,
  verifyRegistration,
  getLoginOptions,
  verifyLogin,
  listMemberCredentials,
  removeMemberCredential,
  RP_NAME,
} from '../modules/auth/webauthnController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/webauthn
// Điều phối các API con của phân hệ sinh trắc học & Passkey
// ==========================================

// --- 1. Đăng ký thiết bị sinh trắc học mới (Yêu cầu phiên thành viên) ---
router.post('/register-options', requireMember, async (req, res) => {
  return getRegisterOptions(req, res);
});

router.post('/register-verify', requireMember, async (req, res) => {
  return verifyRegistration(req, res);
});

// --- 2. Đăng nhập bằng sinh trắc học / Passkey (Công khai bước cấp thử thách & xác minh) ---
router.post('/login-options', async (req, res) => {
  return getLoginOptions(req, res);
});

router.post('/login-verify', async (req, res) => {
  return verifyLogin(req, res);
});

// --- 3. Quản lý danh sách thiết bị đã đăng ký (Yêu cầu phiên thành viên) ---
router.get('/credentials/:email', requireMember, async (req, res) => {
  return listMemberCredentials(req, res);
});

router.delete('/credentials/:id', requireMember, async (req, res) => {
  return removeMemberCredential(req, res);
});

export { RP_NAME };
export default router;
