import express from "express";
import { sendContactForm, sendCustomEmail } from "../services/emailService.js";
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

/**
 * POST /api/email/contact
 * Send contact form email
 */
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Send to contact email
    const result = await sendContactForm(
      name,
      email,
      subject,
      message,
      process.env.EMAIL_CONTACT
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Email sent successfully"
    });
  } catch (error) {
    console.error("POST contact error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

/**
 * POST /api/email/support
 * Send support request email
 */
router.post("/support", async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Support Request</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `;

    const result = await sendCustomEmail(
      process.env.EMAIL_SUPPORT,
      `[Support] ${subject}`,
      html,
      null,
      `"Hugo Support" <${process.env.EMAIL_SUPPORT}>`
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      success: true,
      message: "Support request sent successfully"
    });
  } catch (error) {
    console.error("POST support error:", error);
    res.status(500).json({ error: error.message || "Failed to send email" });
  }
});

export default router;
