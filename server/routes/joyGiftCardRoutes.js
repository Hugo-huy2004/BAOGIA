import express from 'express';
import JoyGiftCard from '../models/JoyGiftCard.js';
import { awardJoy } from '../utils/joyService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

function generateCode() {
  return 'JOY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

const GIFT_CARD_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

// POST /api/joy-gift-cards/redeem  { email, code }  (member-facing)
router.post('/redeem', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'email and code are required' });

    const cleanCode = String(code).toUpperCase().trim();
    const card = await JoyGiftCard.findOne({ code: cleanCode });
    if (!card) return res.status(404).json({ error: 'Mã không hợp lệ.' });
    if (card.redeemed) return res.status(400).json({ error: 'Mã này đã được sử dụng.' });
    if (card.expiresAt && card.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Mã quà tặng JOY này đã hết hiệu lực sử dụng (quá 365 ngày kể từ ngày phát hành).' });
    }

    card.redeemed = true;
    card.redeemedBy = email;
    card.redeemedAt = new Date();
    await card.save();

    const { balance } = await awardJoy(
      email,
      card.amount,
      'gift_code',
      `Đổi mã quà tặng JOY (+${card.amount} JOY)`,
      { refId: card.code }
    );

    res.json({ success: true, amount: card.amount, balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy-gift-cards  (admin)  { amount, note, count }
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { amount, note, count = 1 } = req.body;
    if (!amount) return res.status(400).json({ error: 'amount is required' });

    const total = Math.max(1, Math.min(500, Number(count) || 1));
    const docs = [];
    for (let i = 0; i < total; i++) {
      let code = generateCode();
      // collision check is astronomically unlikely within a single batch, but guard anyway
      // eslint-disable-next-line no-await-in-loop
      while (await JoyGiftCard.exists({ code })) {
        code = generateCode();
      }
      docs.push({ code, amount: Number(amount), note: note || '', expiresAt: new Date(Date.now() + GIFT_CARD_VALIDITY_MS) });
    }

    const created = await JoyGiftCard.insertMany(docs);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import InAppNotification from '../models/InAppNotification.js';

// POST /api/joy-gift-cards/direct-add (admin) { email, amount, note }
router.post('/direct-add', requireAdmin, async (req, res) => {
  try {
    const { email, amount, note } = req.body;
    if (!email || !amount) return res.status(400).json({ error: 'Thiếu email hoặc số lượng JOY' });

    const numericAmount = Number(amount);
    if (numericAmount <= 0) return res.status(400).json({ error: 'Số lượng JOY phải lớn hơn 0' });

    const { balance } = await awardJoy(
      email,
      numericAmount,
      'admin_direct_add',
      `Được tặng trực tiếp từ Admin: ${note || 'Không có ghi chú'}`
    );

    await InAppNotification.create({
      email,
      type: 'success',
      category: 'joy',
      title: 'Nhận điểm JOY thưởng',
      message: `Bạn vừa được Admin tặng trực tiếp ${numericAmount} JOY. ${note ? `Lý do: ${note}` : ''}`
    });

    res.json({ success: true, balance, message: `Đã nạp ${numericAmount} JOY cho ${email}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy-gift-cards  (admin, optional ?redeemed=true/false)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { redeemed } = req.query;
    const filter = {};
    if (redeemed === 'true') filter.redeemed = true;
    if (redeemed === 'false') filter.redeemed = false;

    const cards = await JoyGiftCard.find(filter).sort({ createdAt: -1 });
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/joy-gift-cards/:id  (admin) — revoke an unredeemed card
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const card = await JoyGiftCard.findById(req.params.id);
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.redeemed) return res.status(400).json({ error: 'Không thể xoá mã đã sử dụng.' });

    await card.deleteOne();
    res.json({ message: 'Gift card deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
