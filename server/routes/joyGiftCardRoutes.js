import express from 'express';
import JoyGiftCard from '../models/JoyGiftCard.js';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

function generateCode() {
  return 'JOY-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

const GIFT_CARD_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;
const redeemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều lần thử mã quà tặng. Vui lòng thử lại sau 15 phút.' },
});

// POST /api/joy-gift-cards/redeem  { email, code }  (member-facing)
router.post('/redeem', requireMember, redeemLimiter, async (req, res) => {
  try {
    const { code } = req.body;
    const email = req.memberEmail;
    if (!code) return res.status(400).json({ error: 'code is required' });

    const cleanCode = String(code).toUpperCase().trim();
    const claimedCard = await JoyGiftCard.findOneAndUpdate(
      { code: cleanCode, redeemed: false, expiresAt: { $gte: new Date() } },
      { $set: { redeemed: true, redeemedBy: email, redeemedAt: new Date() } },
      { new: true },
    );
    if (!claimedCard) return res.status(400).json({ error: 'Mã không hợp lệ, đã dùng hoặc đã hết hạn.' });

    const { balance } = await awardJoy(
      email,
      claimedCard.amount,
      'gift_code',
      `Đổi mã quà tặng JOY (+${claimedCard.amount} JOY)`,
      { refId: claimedCard.code }
    );

    res.json({ success: true, amount: claimedCard.amount, balance });
  } catch (error) {
    // Do not reopen a claimed card after an ambiguous wallet failure: the
    // balance update may already have committed even if a later notification
    // write failed, and reopening would enable a second credit.
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
// `email` accepts an email address OR a phone number (the admin terminal UI
// prompts for "Email hoặc SĐT") — resolve against Bio.email/contactEmail/phone
// here so awardJoy() (which only looks up by email/contactEmail) gets a
// pre-resolved doc instead of throwing BIO_NOT_FOUND on a valid phone lookup.
router.post('/direct-add', requireAdmin, async (req, res) => {
  try {
    const { email, amount, note } = req.body;
    if (!email || !amount) return res.status(400).json({ error: 'Thiếu email hoặc số lượng JOY' });

    const numericAmount = Number(amount);
    if (numericAmount <= 0) return res.status(400).json({ error: 'Số lượng JOY phải lớn hơn 0' });

    const identifier = String(email).trim();
    const bio = await Bio.findOne({ $or: [{ email: identifier }, { contactEmail: identifier }, { phone: identifier }] });
    if (!bio) return res.status(404).json({ error: `Không tìm thấy tài khoản khớp với "${identifier}" (đã thử email và số điện thoại).` });

    const { balance } = await awardJoy(
      bio.email,
      numericAmount,
      'admin_direct_add',
      `Được tặng trực tiếp từ Admin: ${note || 'Không có ghi chú'}`,
      { bioDoc: bio, skipSave: true }
    );

    await InAppNotification.create({
      email: bio.email,
      type: 'success',
      category: 'joy',
      title: 'Nhận điểm JOY thưởng',
      message: `Bạn vừa được Admin tặng trực tiếp ${numericAmount} JOY. ${note ? `Lý do: ${note}` : ''}`
    });

    res.json({ success: true, balance, message: `Đã nạp ${numericAmount} JOY cho ${bio.email}` });
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
