// Cửa hàng, đơn hàng, JOYlater và email marketing — router con của /api/admin (mount trong routes/adminRoutes.js).
import express from 'express';
import { requireAdmin } from '../../middleware/authMiddleware.js';
import { utilityProductPrice } from '../../../shared/joyPrices.js';
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

// ─── QUYỀN CỦA ADMIN VỚI VIỆC CHO VAY JOY ────────────────────────────────────
// Trước đây admin gần như không có quyền gì: thuật toán chấm hạn mức hằng tuần,
// còn người thì chỉ được duyệt lệnh cấm vĩnh viễn. Không xem được đang cho vay
// bao nhiêu, không sửa được hạn mức của một người cụ thể, không có nút dừng.

// GET /admin/joylater — toàn cảnh: đang cho vay bao nhiêu, ai đang trễ.
router.get('/joylater', requireAdmin, async (req, res) => {
  try {
    const [Bio, JoyCreditProfile, JoyPolicy] = await Promise.all([
      import('../../models/Bio.js'), import('../../models/JoyCreditProfile.js'), import('../../models/JoyPolicy.js'),
    ]).then((m) => m.map((x) => x.default));
    const { effectiveLimit } = await import('../../services/joyCreditService.js');

    const [borrowers, profiles, policy] = await Promise.all([
      Bio.find({ 'joyLoan.outstanding': { $gt: 0 } },
        'email displayName phone joyLoan').sort({ 'joyLoan.outstanding': -1 }).limit(200).lean(),
      JoyCreditProfile.find({ status: { $in: ['approved', 'barred'] } })
        .sort({ limit: -1 }).limit(200).lean(),
      JoyPolicy.current?.().catch(() => null),
    ]);

    const now = Date.now();
    const DAY = 86400000;
    const loans = borrowers.map((b) => {
      const due = b.joyLoan?.dueAt ? new Date(b.joyLoan.dueAt).getTime() : null;
      return {
        email: b.email,
        displayName: b.displayName || '',
        outstanding: b.joyLoan?.outstanding || 0,
        principal: b.joyLoan?.principal || 0,
        paid: b.joyLoan?.paid || 0,
        dueAt: b.joyLoan?.dueAt || null,
        daysOverdue: due && due < now ? Math.floor((now - due) / DAY) : 0,
        stage: b.joyLoan?.enforcedStage || '',
      };
    });

    const totals = {
      borrowers: loans.length,
      outstanding: loans.reduce((a, l) => a + l.outstanding, 0),
      overdue: loans.filter((l) => l.daysOverdue > 0).length,
      overdueAmount: loans.filter((l) => l.daysOverdue > 0).reduce((a, l) => a + l.outstanding, 0),
      approved: profiles.filter((p) => p.status === 'approved').length,
      barred: profiles.filter((p) => p.status === 'barred').length,
      // Tổng hạn mức đã cấp mà chưa dùng — đây là phần rủi ro CHƯA phát sinh.
      headroom: profiles.filter((p) => p.status === 'approved')
        .reduce((a, p) => a + effectiveLimit(p).limit, 0),
    };

    res.json({
      success: true,
      lending: policy?.lending || { enabled: true },
      totals,
      loans: loans.sort((a, b) => b.daysOverdue - a.daysOverdue || b.outstanding - a.outstanding),
      profiles: profiles.map((p) => ({
        email: p.email, status: p.status, score: p.score, autoLimit: p.limit,
        ...effectiveLimit(p), suspendedAt: p.suspendedAt, override: p.override,
        loansRepaid: p.loansRepaid, loansDefaulted: p.loansDefaulted,
      })),
    });
  } catch (err) {
    console.error('[admin] joylater overview:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/joylater/limit — đặt hoặc gỡ hạn mức tay cho MỘT người.
// Thuật toán vẫn chấm như thường; con số này đứng trên nó cho tới khi hết hạn.
router.post('/joylater/limit', requireAdmin, async (req, res) => {
  try {
    const { email, limit, reason, days } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Thiếu email' });
    const JoyCreditProfile = (await import('../../models/JoyCreditProfile.js')).default;
    const profile = await JoyCreditProfile.findOne({ email: String(email).toLowerCase() });
    if (!profile) return res.status(404).json({ error: 'Người này chưa có hồ sơ tín dụng' });

    if (limit === null || limit === undefined || limit === '') {
      profile.override = { limit: null, reason: '', by: '', at: null, expiresAt: null };
    } else {
      const value = Number(limit);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: 'Hạn mức không hợp lệ' });
      if (!reason?.trim()) return res.status(400).json({ error: 'Phải ghi lý do — số này đứng trên thuật toán.' });
      profile.override = {
        limit: Math.round(value),
        reason: reason.trim().slice(0, 300),
        by: req.admin?.id || 'admin',
        at: new Date(),
        // Mặc định hết hạn sau 90 ngày: quyền ghi đè vĩnh viễn là thứ người ta
        // đặt một lần rồi quên, và nó âm thầm đứng trên thuật toán mãi mãi.
        expiresAt: new Date(Date.now() + (Number(days) > 0 ? Number(days) : 90) * 86400000),
      };
    }
    await profile.save();
    await logAdminAuditAction(req, 'joylater_set_limit', null, profile.email,
      limit ? `Đặt hạn mức tay ${limit}` : 'Gỡ hạn mức tay', { reason, days });
    res.json({ success: true, override: profile.override });
  } catch (err) {
    console.error('[admin] joylater limit:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/joylater/suspend — tạm dừng hoặc mở lại việc vay của MỘT người.
router.post('/joylater/suspend', requireAdmin, async (req, res) => {
  try {
    const { email, suspend, reason } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Thiếu email' });
    const JoyCreditProfile = (await import('../../models/JoyCreditProfile.js')).default;
    const profile = await JoyCreditProfile.findOne({ email: String(email).toLowerCase() });
    if (!profile) return res.status(404).json({ error: 'Người này chưa có hồ sơ tín dụng' });

    if (suspend) {
      if (!reason?.trim()) return res.status(400).json({ error: 'Phải ghi lý do tạm dừng.' });
      profile.suspendedAt = new Date();
      profile.suspendReason = reason.trim().slice(0, 300);
      profile.suspendedBy = req.admin?.id || 'admin';
    } else {
      profile.suspendedAt = null;
      profile.suspendReason = '';
      profile.suspendedBy = '';
    }
    await profile.save();
    await logAdminAuditAction(req, suspend ? 'joylater_suspend' : 'joylater_resume', null,
      profile.email, suspend ? `Tạm dừng: ${reason}` : 'Mở lại');
    res.json({ success: true, suspendedAt: profile.suspendedAt });
  } catch (err) {
    console.error('[admin] joylater suspend:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/joylater/pause — công tắc cho vay TOÀN HỆ THỐNG.
// Khoá cửa vào; khoản đang chạy vẫn phải trả như thường.
router.post('/joylater/pause', requireAdmin, async (req, res) => {
  try {
    const { paused, reason } = req.body || {};
    if (paused && !reason?.trim()) {
      return res.status(400).json({ error: 'Phải ghi lý do tạm dừng cho vay toàn hệ thống.' });
    }
    const JoyPolicy = (await import('../../models/JoyPolicy.js')).default;
    const policy = await JoyPolicy.current();
    policy.lending = paused
      ? { enabled: false, pausedReason: reason.trim().slice(0, 300), pausedBy: req.admin?.id || 'admin', pausedAt: new Date() }
      : { enabled: true, pausedReason: '', pausedBy: '', pausedAt: null };
    await policy.save();
    await logAdminAuditAction(req, paused ? 'joylater_pause_all' : 'joylater_resume_all', null, '',
      paused ? `Dừng cho vay: ${reason}` : 'Mở lại cho vay');
    res.json({ success: true, lending: policy.lending });
  } catch (err) {
    console.error('[admin] joylater pause:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/joylater/:caseId — duyệt hoặc bỏ qua một hồ sơ nợ JOY.
// DÙNG LẠI đúng hàm mà nút bấm trong Telegram gọi, không viết lại logic: ghi
// sổ đen, chặn tài khoản và khớp băm email đều nằm trong đó, tách ra là hai
// đường xử lý sẽ lệch nhau.
router.post('/joylater/:caseId', requireAdmin, async (req, res) => {
  try {
    const { decision } = req.body || {};
    if (!['ban', 'skip'].includes(decision)) {
      return res.status(400).json({ error: 'decision phải là ban hoặc skip' });
    }
    const { handleJoyLaterCallback } = await import('../../services/joyLaterEnforcement.js');
    const by = `web:${req.admin?.id || 'admin'}`;
    const result = await handleJoyLaterCallback({ data: `jl:${decision}:${req.params.caseId}`, by });
    if (!result) return res.status(400).json({ error: 'Không xử lý được hồ sơ này.' });

    await logAdminAuditAction(req, `joylater_${decision}`, null, '', `Hồ sơ nợ JOY: ${decision}`, { caseId: req.params.caseId, result: result.text });
    res.json({ success: true, message: result.text });
  } catch (err) {
    console.error('[admin] joylater review:', err);
    res.status(500).json({ error: err.message });
  }
});

// Lifecycle marketing chỉ tới thành viên đã opt-in. Admin quản lý lịch chung,
// xem quy mô audience và có thể chủ động chạy một lượt đã được giới hạn sẵn.
router.get('/marketing-email', requireAdmin, async (_req, res) => {
  try {
    const { getLifecycleEmailStatus } = await import('../../services/lifecycleEmailService.js');
    return res.json({ success: true, ...(await getLifecycleEmailStatus()) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/marketing-email', requireAdmin, async (req, res) => {
  if (typeof req.body?.enabled !== 'boolean') return res.status(400).json({ error: 'enabled must be a boolean' });
  try {
    const { setLifecycleEmailEnabled } = await import('../../services/lifecycleEmailService.js');
    const status = await setLifecycleEmailEnabled(req.body.enabled);
    await logAdminAuditAction(req, 'MARKETING_EMAIL_TOGGLE', null, '', `Lifecycle email ${req.body.enabled ? 'enabled' : 'disabled'}`);
    return res.json({ success: true, ...status });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/marketing-email/run', requireAdmin, async (req, res) => {
  try {
    const { runLifecycleEmailJob } = await import('../../services/lifecycleEmailService.js');
    const result = await runLifecycleEmailJob();
    await logAdminAuditAction(req, 'MARKETING_EMAIL_RUN', null, '', `Lifecycle email: ${result.sent || 0} sent`, result);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
