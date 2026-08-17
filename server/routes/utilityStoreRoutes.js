import express from 'express';
import Bio from '../models/Bio.js';
import UtilityProduct from '../models/UtilityProduct.js';
import UtilityOrder from '../models/UtilityOrder.js';
import { awardJoy } from '../utils/joyService.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import cloudinaryUtil from '../utils/cloudinary.js';
import { calcExchangeTotal, EXCHANGE_TAX_RATE } from '../utils/featureSubscriptionService.js';
import { notifyMember } from '../utils/notifyMember.js';
import { applyProductGrant } from '../utils/productGrant.js';

const router = express.Router();

// ── Token HugoRadio ─────────────────────────────────────────────────────────
// Phải khớp MINUTES_PER_TOKEN bên server/utils/radioTokens.js.
const RADIO_MINUTES_PER_TOKEN = 10;
const JOY_PER_RADIO_TOKEN = 200;              // chưa gồm phí sáng tạo 10%
const MAX_RADIO_TOKENS = 1008;                // 168 giờ — trần một lần mua

function generatePurchaseCode() {
  return 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET /api/utility-store/radio-price — bảng giá token do MÁY CHỦ công bố.
// Giao diện đọc từ đây thay vì tự chép hằng số: giá hiện trên nút mua và giá bị
// trừ khỏi ví luôn là cùng một con số.
router.get('/radio-price', (_req, res) => {
  res.json({
    minutesPerToken: RADIO_MINUTES_PER_TOKEN,
    joyPerToken: JOY_PER_RADIO_TOKEN,
    feeRate: EXCHANGE_TAX_RATE,
    maxTokens: MAX_RADIO_TOKENS,
  });
});

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
router.get('/orders', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const orders = await UtilityOrder.find({ email }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/utility-store/purchase  { productId } | { productType: 'radio_time', tokens }
router.post('/purchase', requireMember, async (req, res) => {
  try {
    const { productId, productType } = req.body;
    const email = req.memberEmail;

    // ── Direct radio_time purchase (no productId needed) ──────────────────
    if (productType === 'radio_time') {
      // `tokens` là đơn vị mới; `hours` giữ lại cho bản client cũ chưa cập nhật.
      // Giá KHÔNG bao giờ lấy từ request — client cũ còn gửi kèm `priceJoy`, và
      // nó đã luôn bị bỏ qua ở đây; chỉ số lượng mới đến từ người mua.
      const asked = req.body.tokens != null
        ? Number(req.body.tokens)
        : Number(req.body.hours) * (60 / RADIO_MINUTES_PER_TOKEN);

      if (!Number.isInteger(asked) || asked < 1 || asked > MAX_RADIO_TOKENS) {
        return res.status(400).json({ error: `Số token phải là số nguyên từ 1 đến ${MAX_RADIO_TOKENS}.` });
      }
      const tokens = asked;
      const radioMinutes = tokens * RADIO_MINUTES_PER_TOKEN;
      // Dùng chung công thức phí sáng tạo với mọi giao dịch JOY khác. Nhánh này
      // trước đây tự nhân `* 1.1` rồi Math.ceil, trong khi calcExchangeTotal
      // Math.floor — hai lối mua cùng một thứ ra hai con số lệch nhau.
      const { tax: taxes, total: expectedJoy } = calcExchangeTotal(tokens * JOY_PER_RADIO_TOKEN);

      let bio = await Bio.findOne({ email });
      if (!bio) bio = await Bio.findOne({ contactEmail: email });
      if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

      if (bio.joyBalance < expectedJoy) {
        return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${expectedJoy} JOY.` });
      }

      // awardJoy trừ tiền nguyên tử ($inc kèm điều kiện $gte), nên hai lần bấm
      // song song không thể tiêu quá số dư — lần thứ hai ném INSUFFICIENT_JOY.
      let balance;
      try {
        ({ balance } = await awardJoy(
          email,
          -expectedJoy,
          'store_purchase',
          `Mua ${tokens} token HugoRadio (${radioMinutes} phút, gồm ${taxes} JOY phí sáng tạo)`,
          { notify: false, bioDoc: bio, skipSave: true }
        ));
      } catch (err) {
        if (err.message === 'INSUFFICIENT_JOY') {
          return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${expectedJoy} JOY.` });
        }
        throw err;
      }

      if (!bio.radioTokens) {
        bio.radioTokens = { weeklyFreeMinutes: 300, weeklyUsedMinutes: 0, weeklyResetAt: null, purchasedMinutes: 0 };
      }
      bio.radioTokens.purchasedMinutes = (bio.radioTokens.purchasedMinutes || 0) + radioMinutes;

      bio.history.push({
        type: 'utility_purchase',
        icon: 'radio',
        title: 'Mua token HugoRadio',
        detail: `+${tokens} token (${radioMinutes} phút)`,
        timestamp: new Date()
      });
      if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);

      await bio.save();

      let purchaseCode = generatePurchaseCode();
      for (let attempt = 0; attempt < 5 && (await UtilityOrder.exists({ purchaseCode })); attempt++) {
        purchaseCode = generatePurchaseCode();
      }

      const order = await UtilityOrder.create({
        email,
        productId: null,
        productName: `HugoRadio · ${tokens} token`,
        priceJoy: expectedJoy,
        purchaseCode,
        status: 'completed',
      });

      await notifyMember({
        email,
        type: 'success',
        category: 'joy',
        key: 'event.productPurchase',
        params: { product: `HugoRadio · ${tokens} token`, total: expectedJoy, code: purchaseCode },
        actionUrl: '/member/utilities/radio',
      });

      return res.json({
        ok: true,
        balance,
        tokens,
        radioMinutes,
        purchasedTokens: Math.floor(bio.radioTokens.purchasedMinutes / RADIO_MINUTES_PER_TOKEN),
        purchaseCode,
        order,
      });
    }

    // ── Standard product purchase ────────────────────────────────────────
    if (!productId) return res.status(400).json({ error: 'productId is required' });

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

    // Dùng chung công thức phí với mọi giao dịch JOY khác (10% "phí sáng tạo").
    // Trước đây chỗ này tự tính 9%, nên phiếu trao đổi hiện một số mà tài khoản
    // bị trừ một số khác — người mua thấy 10% rồi bị trừ 9%.
    const { tax: taxes, total: totalCost } = calcExchangeTotal(product.priceJoy);

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
      `Mua "${product.name}" (giá ${product.priceJoy} JOY + ${taxes} JOY phí sáng tạo)`,
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
    const { name, description, priceJoy, icon, category, stock, imageUrl, productType, extendDays, tokenType, tokenAmount, radioMinutes } = req.body;
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
    const { name, description, priceJoy, icon, category, active, stock, imageUrl, productType, extendDays, tokenType, tokenAmount, radioMinutes } = req.body;

    const product = await UtilityProduct.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (priceJoy !== undefined) product.priceJoy = Number(priceJoy);
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
