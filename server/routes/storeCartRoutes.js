import express from 'express';
import mongoose from 'mongoose';
import StoreCart from '../models/StoreCart.js';
import UtilityProduct from '../models/UtilityProduct.js';
import UtilityOrder from '../models/UtilityOrder.js';
import PromoCode from '../models/PromoCode.js';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { requireMember, requireAdmin } from '../middleware/authMiddleware.js';
import { notifyMember } from '../utils/notifyMember.js';
import { applyProductGrant } from '../utils/productGrant.js';

const router = express.Router();
const TAX_RATE = 0.09;

// ponytail: 99/item is the cap the UI offers; raise here if bulk buying lands
function clampQty(q) {
  return Math.min(99, Math.max(1, Math.floor(Number(q)) || 1));
}

function genOrderCode() {
  return 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ── GET /api/store/cart?email= ──────────────────────────────────────────────
router.get('/cart', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let cart = await StoreCart.findOne({ email });
    if (!cart) cart = await StoreCart.create({ email, items: [] });
    res.json(cart);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/store/cart/add ────────────────────────────────────────────────
router.post('/cart/add', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { productId } = req.body;
    const quantity = clampQty(req.body.quantity ?? 1);
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const product = await UtilityProduct.findById(productId).lean();
    if (!product || !product.active) return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc đã bị ẩn.' });
    if (product.stock !== -1 && product.stock < quantity) return res.status(400).json({ error: 'Sản phẩm không đủ tồn kho.' });

    let cart = await StoreCart.findOne({ email });
    if (!cart) cart = await StoreCart.create({ email, items: [] });

    const existing = cart.items.find(i => i.productId.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        productId: product._id,
        productName: product.name,
        priceJoy: product.priceJoy,
        icon: product.icon || 'redeem',
        productType: product.productType || 'general',
        quantity
      });
    }
    await cart.save();
    res.json(cart);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/store/cart/update ──────────────────────────────────────────────
router.put('/cart/update', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { productId } = req.body;
    const quantity = Number(req.body.quantity);
    if (!productId || !Number.isFinite(quantity)) return res.status(400).json({ error: 'productId & quantity required' });

    const cart = await StoreCart.findOne({ email });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    } else {
      const item = cart.items.find(i => i.productId.toString() === productId);
      if (item) item.quantity = clampQty(quantity);
    }
    await cart.save();
    res.json(cart);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/store/cart/remove ───────────────────────────────────────────
router.delete('/cart/remove', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const cart = await StoreCart.findOne({ email });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    await cart.save();
    res.json(cart);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/store/cart/clear ────────────────────────────────────────────
router.delete('/cart/clear', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    await StoreCart.findOneAndUpdate({ email }, { items: [], promoCode: null, promoDiscount: 0 });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/store/cart/apply-promo ────────────────────────────────────────
router.post('/cart/apply-promo', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { promoCode } = req.body;
    if (!promoCode) return res.status(400).json({ error: 'promoCode required' });

    const code = promoCode.toUpperCase().trim();
    const promo = await PromoCode.findOne({ code, active: true });
    if (!promo) return res.status(404).json({ error: 'Mã không hợp lệ.' });
    if (promo.expiresAt && promo.expiresAt < new Date()) return res.status(400).json({ error: 'Mã đã hết hạn.' });
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Mã đã hết lượt sử dụng.' });

    const cart = await StoreCart.findOne({ email });
    if (!cart || !cart.items.length) return res.status(400).json({ error: 'Giỏ hàng trống.' });

    const subtotal = cart.items.reduce((sum, i) => sum + i.priceJoy * i.quantity, 0);
    if (subtotal < promo.minOrderJoy) return res.status(400).json({ error: `Đơn tối thiểu ${promo.minOrderJoy} JOY.` });

    let discount = 0;
    if (promo.discountType === 'percent') {
      discount = Math.floor(subtotal * (promo.discountValue / 100));
    } else {
      discount = Math.min(promo.discountValue, subtotal);
    }

    cart.promoCode = code;
    cart.promoDiscount = discount;
    await cart.save();
    res.json({ cart, discount, promo: { code, discountType: promo.discountType, discountValue: promo.discountValue } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/store/cart/remove-promo ─────────────────────────────────────
router.delete('/cart/remove-promo', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const cart = await StoreCart.findOne({ email });
    if (cart) { cart.promoCode = null; cart.promoDiscount = 0; await cart.save(); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/store/cart/checkout ───────────────────────────────────────────
router.post('/cart/checkout', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const cart = await StoreCart.findOne({ email });
    if (!cart || !cart.items.length) return res.status(400).json({ error: 'Giỏ hàng trống.' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });

    // Validate all products exist and are active
    const productIds = cart.items.map(i => i.productId);
    const products = await UtilityProduct.find({ _id: { $in: productIds }, active: true }).lean();
    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'Một hoặc nhiều sản phẩm không còn khả dụng.' });
    }

    // Recalculate prices server-side (never trust client prices)
    const subtotal = cart.items.reduce((sum, item) => {
      const p = products.find(prod => prod._id.toString() === item.productId.toString());
      return sum + (p ? p.priceJoy * item.quantity : 0);
    }, 0);

    const tax = Math.floor(subtotal * TAX_RATE);
    const discount = cart.promoDiscount || 0;
    const total = Math.max(1, subtotal + tax - discount);

    if (bio.joyBalance < total) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${total} JOY.` });
    }

    // Cấp hàng TRƯỚC khi trừ JOY, và chỉ cần một món trong giỏ không cấp được gì
    // là huỷ cả lượt thanh toán — thà không bán còn hơn trừ tiền rồi không đưa gì.
    const grants = [];
    for (const item of cart.items) {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      if (!product) continue;
      const grant = applyProductGrant(bio, product, item.quantity);
      if (!grant) {
        return res.status(400).json({
          error: `"${product.name}" chưa được cấu hình để cấp quyền lợi nào. Chưa trừ JOY của bạn — bỏ món này khỏi giỏ hoặc báo Hugo Studio.`,
        });
      }
      grants.push(grant);
    }

    // Deduct JOY
    const { balance } = await awardJoy(
      email, -total, 'store_purchase',
      `Thanh toán giỏ hàng Hugo Store (${cart.items.length} sản phẩm, giảm ${discount} JOY)`,
      { notify: false, bioDoc: bio, skipSave: true }
    );

    const orders = [];
    for (const item of cart.items) {
      const product = products.find(p => p._id.toString() === item.productId.toString());
      if (!product) continue;

      // Create order per product
      let purchaseCode = genOrderCode();
      for (let i = 0; i < 5 && (await UtilityOrder.exists({ purchaseCode })); i++) purchaseCode = genOrderCode();

      const order = await UtilityOrder.create({
        email, productId: product._id, productName: product.name,
        priceJoy: Math.round(product.priceJoy * item.quantity * (1 + TAX_RATE)),
        purchaseCode, status: 'completed'
      });
      orders.push(order);

      // Decrement stock
      if (product.stock !== -1) {
        await UtilityProduct.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
      }
    }

    await bio.save();

    // Clear cart
    await StoreCart.findOneAndUpdate({ email }, { items: [], promoCode: null, promoDiscount: 0 });

    // Increment promo usage
    if (cart.promoCode && discount > 0) {
      await PromoCode.findOneAndUpdate({ code: cart.promoCode }, { $inc: { usedCount: 1 } });
    }

    // Notification
    await notifyMember({
      email, type: 'success', category: 'joy',
      key: 'event.cartCheckout',
      params: { count: cart.items.length, total, code: orders[0]?.purchaseCode || '' },
      actionUrl: '/member/utilities/store',
    });

    res.json({ success: true, orders, granted: grants, newBalance: balance, total, discount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/store/orders?email= ────────────────────────────────────────────
router.get('/orders', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const orders = await UtilityOrder.find({ email }).sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Admin: GET /api/store/cart/all ──────────────────────────────────────────
router.get('/cart/all', requireAdmin, async (req, res) => {
  try {
    const carts = await StoreCart.find({ 'items.0': { $exists: true } }).limit(100);
    res.json(carts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
