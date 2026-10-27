import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { escapeHtml, sendContactForm, sendCustomEmail } from "../services/emailService.js";
import { signedClientIp } from "../utils/clientIp.js";
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

// ── Bốn biểu mẫu công khai: liên hệ, hỗ trợ, giáo dục, quảng cáo ────────────
// Không cần đăng nhập, nên mỗi lượt gửi là một email thật tốn hạn mức SendGrid.
// Ba lớp chặn: kiểm & cắt dữ liệu, trần lượt theo người gửi, trần chung theo giờ.

const FORM_WINDOW_MS = 15 * 60 * 1000;
// IP thật chỉ đáng tin khi edge đã ký (signedClientIp); thiếu thì đếm theo email
// người gửi — đếm theo IP chung của Vercel sẽ chặn cả trăm người cùng lúc.
const formLimiter = rateLimit({
  windowMs: FORM_WINDOW_MS,
  max: process.env.NODE_ENV === 'production' ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = signedClientIp(req);
    return ip ? `form-ip:${ipKeyGenerator(ip)}` : `form-mail:${String(req.body?.email || '').trim().toLowerCase()}`;
  },
  message: { error: 'Bạn đã gửi khá nhiều yêu cầu. Vui lòng thử lại sau ít phút.' },
});

// Trần chung cho cả máy chủ: một đợt spam xoay IP/email cũng không đốt hết hạn
// mức gửi trong ngày. ponytail: bộ nhớ trong tiến trình (một instance Render).
const HOURLY_CAP = Number(process.env.EMAIL_FORM_HOURLY_CAP) > 0 ? Number(process.env.EMAIL_FORM_HOURLY_CAP) : 120;
let hourStart = Date.now();
let hourCount = 0;
const underHourlyCap = () => {
  if (Date.now() - hourStart > 60 * 60 * 1000) { hourStart = Date.now(); hourCount = 0; }
  hourCount += 1;
  return hourCount <= HOURLY_CAP;
};

const EMAIL_RE = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,24}$/i;
/** Chuỗi một dòng, cắt độ dài — tên/tiêu đề có xuống dòng là dấu hiệu chèn header. */
const line = (value, max) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

/** Đọc và kiểm biểu mẫu; trả { form } hoặc { error }. */
const readForm = (body = {}, { nameRequired = false } = {}) => {
  const form = {
    name: line(body.name, 100),
    email: line(body.email, 254).toLowerCase(),
    subject: line(body.subject, 150),
    message: String(body.message ?? '').trim().slice(0, 5000),
  };
  if ((nameRequired && !form.name) || !form.email || !form.subject || !form.message) {
    return { error: 'Vui lòng điền đủ các mục bắt buộc.' };
  }
  if (!EMAIL_RE.test(form.email)) return { error: 'Địa chỉ email không hợp lệ.' };
  return { form };
};

const FAILED = 'Chưa gửi được thư lúc này. Vui lòng thử lại sau ít phút.';

/** Khuôn chung: kiểm → trần giờ → gửi → trả lời. Lỗi SendGrid chỉ vào log, không ra client. */
const formRoute = (label, send, options) => async (req, res) => {
  try {
    const { form, error } = readForm(req.body, options);
    if (error) return res.status(400).json({ error });
    if (!underHourlyCap()) {
      console.warn(`[email form] vượt trần ${HOURLY_CAP} thư/giờ — từ chối ${label}`);
      return res.status(429).json({ error: 'Hệ thống đang nhận quá nhiều thư. Vui lòng thử lại sau.' });
    }
    const result = await send(form);
    if (!result?.success) {
      console.error(`[email form] ${label} thất bại:`, result?.error);
      return res.status(502).json({ error: FAILED });
    }
    return res.json({ success: true, message: 'Đã gửi thư.' });
  } catch (err) {
    console.error(`[email form] ${label} lỗi:`, err.message);
    return res.status(500).json({ error: FAILED });
  }
};

/** POST /api/email/contact — biểu mẫu liên hệ. */
router.post('/contact', formLimiter, formRoute('contact', (f) => sendContactForm(
  f.name, f.email, f.subject, f.message, process.env.EMAIL_CONTACT,
), { nameRequired: true }));

/** POST /api/email/support — yêu cầu hỗ trợ. */
router.post('/support', formLimiter, formRoute('support', (f) => sendCustomEmail(
  process.env.EMAIL_SUPPORT,
  `[Support] ${f.subject}`,
  `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #333;">Support Request</h2>
    <p><strong>From:</strong> ${escapeHtml(f.email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(f.subject)}</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(f.message).replace(/\n/g, '<br>')}</p>
  </div>`,
  null,
  `"Hugo Support" <${process.env.EMAIL_SUPPORT}>`,
  null,
  f.email,
)));

/** POST /api/email/education — liên hệ giáo dục. */
router.post('/education', formLimiter, formRoute('education', (f) => sendContactForm(
  f.name || 'Student/Learner', f.email, `[Education] ${f.subject}`, f.message,
  process.env.EMAIL_EDUCATION || 'education@hugowishpax.studio',
)));

/** POST /api/email/adv — quảng cáo & đối tác. */
router.post('/adv', formLimiter, formRoute('adv', (f) => sendContactForm(
  f.name || 'Sponsor/Partner', f.email, `[Adv & Media] ${f.subject}`, f.message,
  process.env.EMAIL_ADV || 'adv@hugowishpax.studio',
)));

export default router;
