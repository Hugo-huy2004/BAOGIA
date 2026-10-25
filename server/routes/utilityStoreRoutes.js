import express from 'express';
import Bio from '../models/Bio.js';
import UtilityProduct from '../models/UtilityProduct.js';
import UtilityOrder from '../models/UtilityOrder.js';
import { awardJoy } from '../utils/joyService.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import cloudinaryUtil from '../utils/cloudinary.js';
import { calcExchangeTotal } from '../utils/featureSubscriptionService.js';
import { notifyMember } from '../utils/notifyMember.js';
import { applyProductGrant } from '../utils/productGrant.js';
import { utilityProductPrice } from '../../shared/joyPrices.js';

const router = express.Router();

// Token HugoRadio (`radio_time`) ngừng bán 25/10/2026: nghe đài miễn phí trong
// app Chuyên Chú. Giữ loại sản phẩm trong schema vì đơn cũ còn tham chiếu.
const RETIRED_PRODUCT_TYPES = new Set(['radio_time']);

function generatePurchaseCode() {
  return 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ── Member-facing ──────────────────────────────────────────────────────────

// GET /api/utility-store/products — active products only
router.get('/products', async (req, res) => {
  try {
    const products = await UtilityProduct.find({ active: true, productType: { $nin: [...RETIRED_PRODUCT_TYPES] } }).sort({ createdAt: -1 }).lean();
    res.json(products.map((product) => ({
      ...product,
      priceJoy: utilityProductPrice(product.productType),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/utility-store/orders?email=
router.get('/orders', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const orders = await UtilityOrder.find({ email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/utility-store/purchase  { productId }
router.post('/purchase', requireMember, async (req, res) => {
  try {
    const { productId, productType } = req.body;
    const email = req.memberEmail;

    if (RETIRED_PRODUCT_TYPES.has(productType)) {
      return res.status(410).json({ error: 'HugoRadio đã miễn phí, không cần mua token nữa.' });
    }

    // ── Standard product purchase ────────────────────────────────────────
    if (!productId) return res.status(400).json({ error: 'productId is required' });

    const product = await UtilityProduct.findById(productId);
    if (!product || !product.active || RETIRED_PRODUCT_TYPES.has(product.productType)) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc đã bị ẩn.' });
    }
    if (product.stock !== -1 && product.stock <= 0) {
      return res.status(400).json({ error: 'Sản phẩm đã hết hàng.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Dùng chung công thức phí với mọi giao dịch JOY khác (10% "phí sáng tạo").
    // Trước đây chỗ này tự tính 9%, nên phiếu trao đổi hiện một số mà tài khoản
    // bị trừ một số khác — người mua thấy 10% rồi bị trừ 9%.
    const priceJoy = utilityProductPrice(product.productType);
    const { tax: taxes, total: totalCost } = calcExchangeTotal(priceJoy);

    if (bio.joyBalance < totalCost) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${totalCost} JOY (gồm ${taxes} JOY phí sáng tạo).` });
    }

    // Cấp hàng TRƯỚC khi trừ JOY: sản phẩm không cấp được gì thì không bán, chứ
    // không trừ tiền rồi im lặng (chưa lưu gì ở nhánh này nên bio giữ nguyên).
    const grant = applyProductGrant(bio, product);
    if (!grant) {
      return res.status(400).json({
        error: `"${product.name}" chưa được cấu hình để cấp quyền lợi nào. Chưa trừ JOY của bạn — báo Hugo Studio chỉnh lại sản phẩm này.`,
      });
    }
    const { balance } = await awardJoy(
      email,
      -totalCost,
      'store_purchase',
      `Mua "${product.name}" (giá ${priceJoy} JOY + ${taxes} JOY phí sáng tạo)`,
      { notify: false, bioDoc: bio, skipSave: true }
    );

    await bio.save();

    let purchaseCode = generatePurchaseCode();
    for (let attempt = 0; attempt < 5 && (await UtilityOrder.exists({ purchaseCode })); attempt++) {
      purchaseCode = generatePurchaseCode();
    }

    const order = await UtilityOrder.create({
      email,
      productId: product._id,
      productName: product.name,
      priceJoy: totalCost,
      purchaseCode,
      status: 'completed'
    });

    if (product.stock !== -1) {
      product.stock -= 1;
      await product.save();
    }

    await notifyMember({
      email,
      type: 'success',
      category: 'joy',
      key: 'event.productPurchase',
      params: { product: product.name, total: totalCost, code: purchaseCode },
      actionUrl: '/member/utilities/store',
    });

    res.json({
      success: true,
      order,
      granted: grant,
      newBalance: balance,
      bio: {
        bonusChatTokens: bio.bonusChatTokens,
        bonusCallTokens: bio.bonusCallTokens,
        expiresAt: bio.expiresAt,
        radioTokens: bio.radioTokens
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ── Admin ───────────────────────────────────────────────────────────────────

// GET /api/utility-store/admin/products — all products including inactive
router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await UtilityProduct.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/utility-store/admin/orders — all orders, all members
router.get('/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await UtilityOrder.find().sort({ createdAt: -1 }).limit(200);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/utility-store/admin/upload-image  { base64Str, oldUrl }
router.post('/admin/upload-image', requireAdmin, async (req, res) => {
  try {
    const { base64Str, oldUrl } = req.body;
    if (!base64Str) return res.status(400).json({ error: 'base64Str is required' });
    const url = await cloudinaryUtil.uploadProductImage(base64Str, oldUrl || '');
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/utility-store/admin/products
router.post('/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, icon, category, stock, imageUrl, productType, extendDays, tokenType, tokenAmount, radioMinutes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const product = await UtilityProduct.create({
      name,
      description: description || '',
      priceJoy: utilityProductPrice(productType),
      icon: icon || 'redeem',
      category: category || 'general',
      stock: stock !== undefined ? Number(stock) : -1,
      imageUrl: imageUrl || '',
      productType: productType || 'general',
      extendDays: Number(extendDays) || 0,
      tokenType: tokenType || 'chat',
      tokenAmount: Number(tokenAmount) || 0,
      radioMinutes: Number(radioMinutes) || 0
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/utility-store/admin/products/:id
router.put('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, category, active, stock, imageUrl, productType, extendDays, tokenType, tokenAmount, radioMinutes } = req.body;

    const product = await UtilityProduct.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    product.priceJoy = utilityProductPrice(productType ?? product.productType);
    if (productType !== undefined) product.productType = productType;
    if (extendDays !== undefined) product.extendDays = Number(extendDays);
    if (tokenType !== undefined) product.tokenType = tokenType;
    if (tokenAmount !== undefined) product.tokenAmount = Number(tokenAmount);
    if (radioMinutes !== undefined) product.radioMinutes = Number(radioMinutes);
    if (icon !== undefined) product.icon = icon;
    if (category !== undefined) product.category = category;
    if (active !== undefined) product.active = active;
    if (stock !== undefined) product.stock = Number(stock);
    if (imageUrl !== undefined) product.imageUrl = imageUrl;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/utility-store/admin/products/:id
router.delete('/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await UtilityProduct.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
