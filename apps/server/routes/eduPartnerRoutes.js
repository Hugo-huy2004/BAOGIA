import express from 'express';
import rateLimit from 'express-rate-limit';
import { partnerKeyOf, verifyPartnerKey } from '../services/eduPartner.js';

const router = express.Router();

// Đoán key 32 ký tự là vô vọng, nhưng vẫn chặn dò hàng loạt.
const verifyLimiter = rateLimit({ windowMs: 10 * 60_000, max: 20, standardHeaders: true, legacyHeaders: false });

// POST /api/edu-partner/verify — trang /developers mở khoá mục Đối tác; thư viện kiểm key lúc khởi động.
router.post('/verify', verifyLimiter, async (req, res) => {
  try {
    const doc = await verifyPartnerKey(partnerKeyOf(req) || req.body?.key, req.get('origin'));
    if (!doc) return res.status(401).json({ ok: false, code: 'PARTNER_KEY_INVALID', error: 'Key không đúng, đã hết hạn hoặc không dùng được trên tên miền này.' });
    const [name, host] = doc.email.split('@');
    return res.json({ ok: true, email: `${name.slice(0, 2)}***@${host}`, expiresAt: doc.expiresAt });
  } catch (error) {
    console.error('[edu-partner verify]', error.message);
    return res.status(503).json({ ok: false, error: 'Chưa kiểm được key. Thử lại sau.' });
  }
});

export default router;
