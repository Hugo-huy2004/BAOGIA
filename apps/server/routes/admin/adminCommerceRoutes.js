// Cửa hàng, đơn hàng và email marketing — router con của /api/admin (mount trong routes/adminRoutes.js).
import express from 'express';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import { utilityProductPrice } from '../../../../packages/shared/joyPrices.js';
import { logAdminAuditAction } from './adminShared.js';

const router = express.Router();

// POST /admin/orders/update-status (admin) - Cập nhật trạng thái đơn hàng Utility Store
router.post('/orders/update-status', requireAdmin, async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const UtilityOrder = (await import('../../models/UtilityOrder.js')).default;
    const order = await UtilityOrder.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    order.status = status;
    await order.save();
    res.json({ success: true, message: `Đơn hàng ${orderId} đã được chuyển sang trạng thái ${status}`, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /admin/store/products - Lấy toàn bộ sản phẩm Utility Store cho Admin (kèm sản phẩm ẩn)
router.get('/store/products', requireAdmin, async (req, res) => {
  try {
    const UtilityProduct = (await import('../../models/UtilityProduct.js')).default;
    const products = await UtilityProduct.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, products: products.map((product) => ({
      ...product,
      priceJoy: utilityProductPrice(product.productType),
    })) });
  } catch (err) {
    console.error('Error fetching admin store products:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/store/products - Tạo mới sản phẩm Utility Store
router.post('/store/products', requireAdmin, async (req, res) => {
  try {
    const { name, description, icon, category, active, stock, imageUrl, productType = 'general', extendDays, tokenType, tokenAmount, radioMinutes } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }
    const UtilityProduct = (await import('../../models/UtilityProduct.js')).default;
    const product = await UtilityProduct.create({
      name,
      description: description || '',
      priceJoy: utilityProductPrice(productType),
      icon: icon || 'redeem',
      category: category || 'general',
      active: active !== undefined ? active : true,
      stock: stock !== undefined ? Number(stock) : -1,
      imageUrl: imageUrl || '',
      productType,
      extendDays: Number(extendDays) || 0,
      tokenType: tokenType || 'chat',
      tokenAmount: Number(tokenAmount) || 0,
      radioMinutes: Number(radioMinutes) || 0,
    });

    logAdminAuditAction(req, 'CREATE_STORE_PRODUCT', '', '', `Tạo sản phẩm "${product.name}" với giá ${product.priceJoy} JOY`);

    res.json({ success: true, product });
  } catch (err) {
    console.error('Error creating store product:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/store/products/:id - Cập nhật thông tin sản phẩm Utility Store
router.put('/store/products/:id', requireAdmin, async (req, res) => {
  try {
    const UtilityProduct = (await import('../../models/UtilityProduct.js')).default;
    const product = await UtilityProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    const fields = ['name', 'description', 'icon', 'category', 'active', 'imageUrl', 'productType', 'tokenType'];
    for (const field of fields) {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    }
    for (const field of ['stock', 'extendDays', 'tokenAmount', 'radioMinutes']) {
      if (req.body[field] !== undefined) product[field] = Number(req.body[field]);
    }
    product.priceJoy = utilityProductPrice(product.productType);
    await product.save();

    logAdminAuditAction(req, 'UPDATE_STORE_PRODUCT', '', '', `Cập nhật sản phẩm "${product.name}" (${product.priceJoy} JOY)`);

    res.json({ success: true, product });
  } catch (err) {
    console.error('Error updating store product:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/store/products/:id - Bật/tắt sản phẩm Store
router.delete('/store/products/:id', requireAdmin, async (req, res) => {
  try {
    const UtilityProduct = (await import('../../models/UtilityProduct.js')).default;
    const product = await UtilityProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

    product.active = !product.active;
    await product.save();

    logAdminAuditAction(req, 'TOGGLE_STORE_PRODUCT', '', '', `Đổi trạng thái sản phẩm "${product.name}" thành ${product.active ? 'Bật' : 'Ẩn'}`);

    res.json({ success: true, product, message: `Đã ${product.active ? 'kích hoạt' : 'ẩn'} sản phẩm` });
  } catch (err) {
    console.error('Error toggling store product:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/store/orders - Danh sách đơn hàng mua sắm Store
router.get('/store/orders', requireAdmin, async (req, res) => {
  try {
    const UtilityOrder = (await import('../../models/UtilityOrder.js')).default;
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 100));
    const orders = await UtilityOrder.find().sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching admin store orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/store/orders/:id/cancel-refund - Hủy đơn hàng & Hoàn tiền JOY 1-Click
router.post('/store/orders/:id/cancel-refund', requireAdmin, async (req, res) => {
  try {
    const UtilityOrder = (await import('../../models/UtilityOrder.js')).default;
    const order = await UtilityOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Đơn hàng này đã bị hủy trước đó' });
    }

    const { awardJoy } = await import('../../utils/joyService.js');
    order.status = 'cancelled';
    await order.save();

    // Auto refund JOY to user wallet
    const updatedBio = await awardJoy(order.email, order.priceJoy, 'admin_adjustment', `Admin hủy đơn hàng ${order.purchaseCode} & Hoàn tiền JOY`);

    logAdminAuditAction(req, 'CANCEL_REFUND_ORDER', '', order.email, `Hủy đơn ${order.purchaseCode} & Hoàn ${order.priceJoy} JOY cho ${order.email}`, {
      orderId: order._id,
      refundJoy: order.priceJoy
    });

    res.json({
      success: true,
      message: `Đã hủy đơn hàng ${order.purchaseCode} và hoàn +${order.priceJoy.toLocaleString()} JOY cho ${order.email}`,
      order,
      newBalance: updatedBio.joyBalance
    });
  } catch (err) {
    console.error('Error cancelling order and refunding JOY:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
