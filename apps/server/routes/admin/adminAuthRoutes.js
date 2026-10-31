// Phiên quản trị — router con của /api/admin. Đăng nhập, đăng xuất và tài khoản
// quản trị (tạo, phân vai trò, khoá, thu hồi phiên) đều do Better Auth lo ở
// /api/admin-auth (auth/betterAuth.js); ở đây chỉ còn "tôi là ai".
import express from 'express';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/verify-session', requireAdmin, (req, res) => {
  res.json({ success: true, admin: req.admin });
});

export default router;
