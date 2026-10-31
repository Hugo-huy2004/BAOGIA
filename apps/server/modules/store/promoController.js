/**
 * promoController.js
 * Controller tập trung toàn bộ logic nghiệp vụ quản lý và xác thực mã khuyến mãi (PromoCode).
 */
import PromoCode from '../../models/PromoCode.js';

/**
 * [Member] Kiểm tra và xác thực mã khuyến mãi
 */
export async function validatePromoCode(req, res) {
  try {
    const code = (req.query.code || '').toUpperCase().trim();
    if (!code) return res.status(400).json({ valid: false, error: 'Vui lòng nhập mã.' });

    const promo = await PromoCode.findOne({ code, active: true }).lean();
    if (!promo) return res.json({ valid: false, error: 'Mã không hợp lệ.' });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return res.json({ valid: false, error: 'Mã đã hết hạn.' });
    }
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return res.json({ valid: false, error: 'Mã đã hết lượt.' });
    }

    return res.json({
      valid: true,
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderJoy: promo.minOrderJoy,
        expiresAt: promo.expiresAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ valid: false, error: e.message });
  }
}

/**
 * [Admin] Tạo mã khuyến mãi mới
 */
export async function createPromoAdmin(req, res) {
  try {
    const { code, discountType, discountValue, maxUses, minOrderJoy, applicableCategory, expiresAt } = req.body;
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ error: 'code, discountType, discountValue required' });
    }
    const normalizedCode = code.toUpperCase().trim();
    const exists = await PromoCode.findOne({ code: normalizedCode });
    if (exists) return res.status(400).json({ error: 'Mã đã tồn tại.' });

    const promo = await PromoCode.create({
      code: normalizedCode,
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses != null ? Number(maxUses) : -1,
      minOrderJoy: minOrderJoy ? Number(minOrderJoy) : 0,
      applicableCategory: applicableCategory || 'all',
      expiresAt: expiresAt || null,
      createdBy: req.admin?.id || 'admin',
    });
    return res.status(201).json(promo);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * [Admin] Danh sách mã khuyến mãi
 */
export async function getPromosAdmin(req, res) {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    return res.json(promos);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * [Admin] Cập nhật mã khuyến mãi
 */
export async function updatePromoAdmin(req, res) {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ error: 'Not found' });
    const { code, discountType, discountValue, maxUses, minOrderJoy, applicableCategory, expiresAt, active } = req.body;
    if (code !== undefined) promo.code = code.toUpperCase().trim();
    if (discountType !== undefined) promo.discountType = discountType;
    if (discountValue !== undefined) promo.discountValue = Number(discountValue);
    if (maxUses !== undefined) promo.maxUses = Number(maxUses);
    if (minOrderJoy !== undefined) promo.minOrderJoy = Number(minOrderJoy);
    if (applicableCategory !== undefined) promo.applicableCategory = applicableCategory;
    if (expiresAt !== undefined) promo.expiresAt = expiresAt;
    if (active !== undefined) promo.active = active;
    await promo.save();
    return res.json(promo);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

/**
 * [Admin] Xóa mã khuyến mãi
 */
export async function deletePromoAdmin(req, res) {
  try {
    const deleted = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
