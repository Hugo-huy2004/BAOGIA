import express from 'express';
import Bio from '../models/Bio.js';
import UtilityProduct from '../models/UtilityProduct.js';
import UtilityOrder from '../models/UtilityOrder.js';
import { awardJoy } from '../utils/joyService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import InAppNotification from '../models/InAppNotification.js';

const router = express.Router();

function generatePurchaseCode() {
  return 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ── Member-facing ──────────────────────────────────────────────────────────

// GET /api/utility-store/products — active products only
router.get('/products', async (req, res) => {
  try {
    const products = await UtilityProduct.find({ active: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/utility-store/orders?email=
router.get('/orders', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });
    const orders = await UtilityOrder.find({ email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/utility-store/purchase  { email, productId }
router.post('/purchase', async (req, res) => {
  try {
    const { email, productId } = req.body;
    if (!email || !productId) return res.status(400).json({ error: 'email and productId are required' });

    const product = await UtilityProduct.findById(productId);
    if (!product || !product.active) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại hoặc đã bị ẩn.' });
    }
    if (product.stock !== -1 && product.stock <= 0) {
      return res.status(400).json({ error: 'Sản phẩm đã hết hàng.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.joyBalance < product.priceJoy) {
      return res.status(400).json({ error: 'Số dư JOY không đủ.' });
    }

    const { balance } = await awardJoy(
      email,
      -product.priceJoy,
      'store_purchase',
      `Mua "${product.name}"`,
      { notify: false, bioDoc: bio, skipSave: true }
    );

    // Type-specific fulfillment, applied to the same Bio doc before the single save below.
    let fulfillmentNote = '';
    if (product.productType === 'system_validity' && product.extendDays > 0) {
      let expires = new Date(bio.expiresAt);
      if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) expires = new Date();
      expires.setDate(expires.getDate() + product.extendDays);
      bio.expiresAt = expires;
      bio.history.push({
        type: 'utility_purchase',
        icon: 'event_available',
        title: 'Gia hạn sử dụng',
        detail: `+${product.extendDays} ngày hạn sử dụng từ "${product.name}"`,
        timestamp: new Date()
      });
      if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
      fulfillmentNote = ` (+${product.extendDays} ngày HSD)`;
    } else if (product.productType === 'psy_study_tokens' && product.tokenAmount > 0) {
      if (product.tokenType === 'call') {
        bio.bonusCallTokens = (bio.bonusCallTokens || 0) + product.tokenAmount;
      } else {
        bio.bonusChatTokens = (bio.bonusChatTokens || 0) + product.tokenAmount;
      }
      fulfillmentNote = ` (+${product.tokenAmount} token ${product.tokenType === 'call' ? 'gọi thoại' : 'chat'})`;
    }

    await bio.save();

    let purchaseCode = generatePurchaseCode();
    for (let attempt = 0; attempt < 5 && (await UtilityOrder.exists({ purchaseCode })); attempt++) {
      purchaseCode = generatePurchaseCode();
    }

    const order = await UtilityOrder.create({
      email,
      productId: product._id,
      productName: product.name,
      priceJoy: product.priceJoy,
      purchaseCode,
      status: 'completed'
    });

    if (product.stock !== -1) {
      product.stock -= 1;
      await product.save();
    }

    await InAppNotification.create({
      email,
      type: 'success',
      category: 'joy',
      title: 'Mua hàng thành công!',
      message: `Bạn đã mua "${product.name}" với ${product.priceJoy} JOY${fulfillmentNote}. Mã đơn hàng: ${purchaseCode}`,
      actionUrl: '/member'
    });

    res.json({
      success: true,
      order,
      newBalance: balance,
      bio: {
        bonusChatTokens: bio.bonusChatTokens,
        bonusCallTokens: bio.bonusCallTokens,
        expiresAt: bio.expiresAt
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

// POST /api/utility-store/admin/products
router.post('/admin/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, priceJoy, icon, category, stock, imageUrl, productType, extendDays, tokenType, tokenAmount } = req.body;
    if (!name || !priceJoy) return res.status(400).json({ error: 'name and priceJoy are required' });

    const product = await UtilityProduct.create({
      name,
      description: description || '',
      priceJoy: Number(priceJoy),
      icon: icon || 'redeem',
      category: category || 'general',
      stock: stock !== undefined ? Number(stock) : -1,
      imageUrl: imageUrl || '',
      productType: productType || 'general',
      extendDays: Number(extendDays) || 0,
      tokenType: tokenType || 'chat',
      tokenAmount: Number(tokenAmount) || 0
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
    const { name, description, priceJoy, icon, category, active, stock, imageUrl, productType, extendDays, tokenType, tokenAmount } = req.body;

    const product = await UtilityProduct.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (priceJoy !== undefined) product.priceJoy = Number(priceJoy);
    if (productType !== undefined) product.productType = productType;
    if (extendDays !== undefined) product.extendDays = Number(extendDays);
    if (tokenType !== undefined) product.tokenType = tokenType;
    if (tokenAmount !== undefined) product.tokenAmount = Number(tokenAmount);
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
