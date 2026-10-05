import express from 'express';
import { requireMember, requireAdmin } from '../middleware/authMiddleware.js';
import {
  validatePromoCode,
  createPromoAdmin,
  getPromosAdmin,
  updatePromoAdmin,
  deletePromoAdmin,
} from '../modules/store/promoController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/store (Phân hệ Khuyến mãi / Mã giảm giá)
// Điều phối các API con xác thực & quản trị mã giảm giá
// ==========================================

// --- 1. Thành viên: Xác thực mã giảm giá ---
router.get('/promos/validate', requireMember, async (req, res) => {
  return validatePromoCode(req, res);
});

// --- 2. Quản trị: Quản lý mã khuyến mãi ---
router.post('/promos', requireAdmin, async (req, res) => {
  return createPromoAdmin(req, res);
});

router.get('/promos', requireAdmin, async (req, res) => {
  return getPromosAdmin(req, res);
});

router.put('/promos/:id', requireAdmin, async (req, res) => {
  return updatePromoAdmin(req, res);
});

router.delete('/promos/:id', requireAdmin, async (req, res) => {
  return deletePromoAdmin(req, res);
});

export default router;
