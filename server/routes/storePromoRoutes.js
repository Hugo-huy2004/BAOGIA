import express from 'express';
import PromoCode from '../models/PromoCode.js';
import { requireMember, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Member: GET /api/store/promos/validate?code=X ──────────────────────────
router.get('/promos/validate', requireMember, async (req, res) => {
  try {
    const code = (req.query.code || '').toUpperCase().trim();
    if (!code) return res.status(400).json({ valid: false, error: 'Vui lòng nhập mã.' });

    const promo = await PromoCode.findOne({ code, active: true }).lean();
    if (!promo) return res.json({ valid: false, error: 'Mã không hợp lệ.' });
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return res.json({ valid: false, error: 'Mã đã hết hạn.' });
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.json({ valid: false, error: 'Mã đã hết lượt.' });

    res.json({
      valid: true,
      promo: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        minOrderJoy: promo.minOrderJoy,
        expiresAt: promo.expiresAt
      }
    });
  } catch (e) { res.status(500).json({ valid: false, error: e.message }); }
});

// ── Admin CRUD ──────────────────────────────────────────────────────────────

// POST /api/store/promos
router.post('/promos', requireAdmin, async (req, res) => {
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
      createdBy: req.adminEmail || 'admin'
    });
    res.status(201).json(promo);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/store/promos
router.get('/promos', requireAdmin, async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 });
    res.json(promos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/store/promos/:id
router.put('/promos/:id', requireAdmin, async (req, res) => {
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
    res.json(promo);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/store/promos/:id
router.delete('/promos/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
