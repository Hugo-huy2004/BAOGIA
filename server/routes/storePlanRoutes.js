import express from 'express';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  getStorePlans,
  startAppTrial,
  purchaseOwnApp,
  giftAppPlan,
  lookupPlanRecipient,
} from '../modules/store/planController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/store (Phân hệ Gói Ứng Dụng)
// Điều phối các API con quản lý dùng thử, sở hữu & tặng gói ứng dụng
// ==========================================

// --- 1. Xem danh sách bậc gói & trạng thái sở hữu ---
router.get('/plans', requireMember, async (req, res) => {
  return getStorePlans(req, res);
});

// --- 2. Bắt đầu dùng thử ứng dụng ---
router.post('/plans/trial', requireMember, async (req, res) => {
  return startAppTrial(req, res);
});

// --- 3. Mua sở hữu vĩnh viễn ---
router.post('/plans/own', requireMember, async (req, res) => {
  return purchaseOwnApp(req, res);
});

// --- 4. Tặng gói ứng dụng cho bạn bè ---
router.post('/plans/gift', requireMember, async (req, res) => {
  return giftAppPlan(req, res);
});

// --- 5. Tra cứu người nhận quà trước khi gửi ---
router.get('/plans/lookup', requireMember, async (req, res) => {
  return lookupPlanRecipient(req, res);
});

export default router;
