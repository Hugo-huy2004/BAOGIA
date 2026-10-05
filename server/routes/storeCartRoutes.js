import express from 'express';
import { requireMember, requireAdmin } from '../middleware/authMiddleware.js';
import {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  applyCartPromo,
  removeCartPromo,
  checkoutCart,
  getMemberOrders,
  getAllCartsAdmin,
  TAX_RATE,
} from '../modules/store/cartController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/store (Phân hệ Giỏ hàng & Đơn hàng)
// Điều phối các API con quản lý giỏ hàng & thanh toán JOY
// ==========================================

// --- 1. Thao tác giỏ hàng ---
router.get('/cart', requireMember, async (req, res) => {
  return getCart(req, res);
});

router.post('/cart/add', requireMember, async (req, res) => {
  return addToCart(req, res);
});

router.put('/cart/update', requireMember, async (req, res) => {
  return updateCart(req, res);
});

router.delete('/cart/remove', requireMember, async (req, res) => {
  return removeFromCart(req, res);
});

router.delete('/cart/clear', requireMember, async (req, res) => {
  return clearCart(req, res);
});

// --- 2. Mã khuyến mãi trong giỏ ---
router.post('/cart/apply-promo', requireMember, async (req, res) => {
  return applyCartPromo(req, res);
});

router.delete('/cart/remove-promo', requireMember, async (req, res) => {
  return removeCartPromo(req, res);
});

// --- 3. Thanh toán & Đơn hàng ---
router.post('/cart/checkout', requireMember, async (req, res) => {
  return checkoutCart(req, res);
});

router.get('/orders', requireMember, async (req, res) => {
  return getMemberOrders(req, res);
});

// --- 4. Quản trị ---
router.get('/cart/all', requireAdmin, async (req, res) => {
  return getAllCartsAdmin(req, res);
});

export { TAX_RATE };
export default router;
