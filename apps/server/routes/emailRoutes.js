import express from "express";
import UserProfile from '../models/UserProfile.js';
import { verifyUnsubscribeToken } from '../services/lifecycleEmailService.js';

const router = express.Router();

// One-click unsubscribe link placed in every marketing email. Transactional
// mail (OTP, receipt, security) does not use this preference.
router.get('/unsubscribe', async (req, res) => {
  try {
    const email = verifyUnsubscribeToken(String(req.query.token || ''));
    if (!email) return res.status(400).send('Liên kết hủy đăng ký không hợp lệ hoặc đã hết hạn.');
    await UserProfile.updateOne({ email }, { $set: { 'marketing.optedOutAt': new Date() } });
    return res.type('html').send('<!doctype html><title>Hugo Studio</title><p style="font-family:-apple-system,Arial;padding:32px">Bạn đã hủy nhận email giới thiệu từ Hugo Studio.</p>');
  } catch {
    return res.status(400).send('Liên kết hủy đăng ký không hợp lệ hoặc đã hết hạn.');
  }
});

export default router;
