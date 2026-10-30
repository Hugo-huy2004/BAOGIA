import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resendConfigured = () => Boolean(process.env.RESEND_API_KEY?.startsWith('re_'));
const smtpConfigured = () => Boolean(process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS);

// Resend là kênh chính; SMTP/Nodemailer là dự phòng.
export const isEmailDeliverable = () =>
  resendConfigured() || smtpConfigured();

/** Chữ người dùng gõ → an toàn để chèn vào HTML email (chặn chèn thẻ/liên kết giả). */
export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const e = escapeHtml;

// Email templates — mọi giá trị đến từ người dùng đều đi qua e().
const templates = {
  hugoTeamApplyConfirm: (name, email) => ({
    subject: '✅ Đơn đăng ký Hugo Team đã nhận được',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Chào ${e(name)}!</h2>
        <p style="color: #666;">Cảm ơn bạn đã nộp đơn đăng ký tham gia <strong>Hugo Team</strong>.</p>
        <p style="color: #666;">Tôi đã nhận được CV của bạn và sẽ xem xét trong <strong>3-5 ngày</strong>.</p>
        <p style="color: #666;">Bạn sẽ nhận được email thông báo kết quả (phê duyệt hoặc từ chối).</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Nếu có câu hỏi, hãy liên hệ: ${process.env.EMAIL_CONTACT}</p>
      </div>
    `
  }),

  hugoTeamApproved: (name, email) => ({
    subject: '🎉 Chúc mừng! Bạn được phê duyệt tham gia Hugo Team',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Chúc mừng ${e(name)}! 🎉</h2>
        <p style="color: #666;">Bạn đã được phê duyệt tham gia <strong>Hugo Team</strong>!</p>
        <p style="color: #666;">Tôi sẽ liên hệ với bạn qua email trong <strong>24-48 giờ</strong> để hướng dẫn:</p>
        <ul style="color: #666;">
          <li>Setup môi trường development</li>
          <li>Làm quen với codebase</li>
          <li>Issue đầu tiên để bắt đầu</li>
          <li>Tham gia Slack team</li>
        </ul>
        <p style="color: #666;"><strong>Hãy sẵn sàng bắt đầu hành trình của bạn!</strong></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Liên hệ: ${process.env.EMAIL_SUPPORT}</p>
      </div>
    `
  }),

  hugoTeamRejected: (name, email) => ({
    subject: '📝 Kết quả đơn đăng ký Hugo Team',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Chào ${e(name)},</h2>
        <p style="color: #666;">Cảm ơn bạn đã nộp đơn đăng ký tham gia <strong>Hugo Team</strong>.</p>
        <p style="color: #666;">Sau khi xem xét, hiện tại chúng tôi chưa có thể phê duyệt đơn của bạn.</p>
        <p style="color: #666;">Bạn vẫn có thể nộp lại sau này khi bạn có thêm kinh nghiệm lập trình.</p>
        <p style="color: #666;"><strong>Hãy tiếp tục học tập và cố gắng!</strong></p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">Liên hệ: ${process.env.EMAIL_SUPPORT}</p>
      </div>
    `
  }),

  contactForm: (name, email, subject, message) => ({
    subject: `📨 Tin nhắn từ ${String(name).replace(/[\r\n]+/g, ' ')}: ${String(subject).replace(/[\r\n]+/g, ' ')}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p><strong>Từ:</strong> ${e(name)}</p>
        <p><strong>Email:</strong> ${e(email)}</p>
        <p><strong>Chủ đề:</strong> ${e(subject)}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p><strong>Nội dung:</strong></p>
        <p>${e(message).replace(/\n/g, '<br>')}</p>
      </div>
    `
  }),
};

const normalizeAttachments = (attachments = []) => attachments.map((attachment) => ({
  filename: attachment.filename,
  content: Buffer.isBuffer(attachment.content)
    ? attachment.content
    : Buffer.from(attachment.content || '', 'base64'),
  contentType: attachment.type || attachment.contentType,
}));

const sendWithResend = async (message) => {
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    ...message,
    attachments: message.attachments?.map(({ filename, content }) => ({ filename, content })),
  });
  if (error) throw new Error(error.message || 'Resend rejected the email');
  return data?.id;
};

const sendWithSmtp = (message) => nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_SMTP_PORT || 587),
  secure: process.env.EMAIL_SMTP_SECURE === 'true' || String(process.env.EMAIL_SMTP_PORT || '587') === '465',
  auth: { user: process.env.EMAIL_SMTP_USER, pass: process.env.EMAIL_SMTP_PASS },
}).sendMail(message);

// Một cổng gửi duy nhất: Resend trước, Nodemailer/SMTP fallback.
export const sendCustomEmail = async (
  to, subject, html, cc = null, fromEmail = null, attachments = null, replyTo = null,
) => {
  const sender = fromEmail || process.env.EMAIL_FROM || process.env.EMAIL_SUPPORT || 'support@hugowishpax.studio';
  const msg = { from: sender, to, subject: String(subject).replace(/[\r\n]+/g, ' '), html };
  if (cc) msg.cc = cc;
  if (replyTo) msg.replyTo = replyTo;
  if (attachments?.length) msg.attachments = normalizeAttachments(attachments);

  if (!isEmailDeliverable()) {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, simulated: true, error: 'Resend và SMTP chưa được cấu hình.' };
    }
    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true, message: `Email đã được mô phỏng gửi tới ${to}.` };
  }

  const errors = [];
  if (resendConfigured()) {
    try {
      const id = await sendWithResend(msg);
      return { success: true, provider: 'resend', id };
    } catch (error) {
      errors.push(`Resend: ${error.message}`);
    }
  }
  if (smtpConfigured()) {
    try {
      const info = await sendWithSmtp(msg);
      return { success: true, provider: 'smtp', id: info.messageId };
    } catch (error) {
      errors.push(`SMTP: ${error.message}`);
    }
  }
  const detail = errors.join('; ') || 'Không có kênh email khả dụng';
  console.error(`❌ Gửi email tới ${to} thất bại:`, detail);
  return { success: false, error: detail };
};

// Email sending functions — tất cả ủy thác cho sendCustomEmail để dùng chung
// luật mô phỏng/báo lỗi (trước đây mỗi hàm tự gọi sgMail.send và NÉM lỗi → route
// trả 500 khi chưa cấu hình khoá).
export const sendHugoTeamApplyConfirm = (name, email) => {
  const template = templates.hugoTeamApplyConfirm(name, email);
  return sendCustomEmail(email, template.subject, template.html, null, process.env.EMAIL_CONTACT);
};

export const sendHugoTeamApproved = (name, email) => {
  const template = templates.hugoTeamApproved(name, email);
  return sendCustomEmail(email, template.subject, template.html, null, process.env.EMAIL_SUPPORT, null, process.env.EMAIL_SUPPORT);
};

export const sendHugoTeamRejected = (name, email) => {
  const template = templates.hugoTeamRejected(name, email);
  return sendCustomEmail(email, template.subject, template.html, null, process.env.EMAIL_CONTACT);
};

export const sendContactForm = (name, email, subject, message, recipientEmail) => {
  const template = templates.contactForm(name, email, subject, message);
  return sendCustomEmail(recipientEmail, template.subject, template.html, null, process.env.EMAIL_CONTACT, null, email);
};

/** Gửi mã OTP đăng nhập Magic Link 1 lần (hạn 10 phút) */
export const sendMagicLinkOtp = async (to, code, purpose = 'login') => {
  const isIdentity = purpose === 'identity';
  const subject = isIdentity
    ? `🪪 Mã xác minh thông tin Hugo Studio: ${code}`
    : `🔐 Mã xác thực đăng nhập Hugo Studio: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 20px; border: 1px solid #1e293b;">
      <h2 style="color: #38bdf8; margin-top: 0;">Hugo Studio Authentication</h2>
      <p style="color: #94a3b8; font-size: 14px;">${isIdentity
        ? 'Hugo Studio đang kiểm tra định kỳ xem hòm thư này có đúng là của bạn không. Nhập mã dưới đây vào ứng dụng để hoàn tất:'
        : 'Bạn vừa yêu cầu đăng nhập bằng Mã xác thực dùng một lần (Magic OTP). Dưới đây là mã xác thực của bạn:'}</p>
      <div style="margin: 24px 0; text-align: center; background: #1e293b; padding: 18px; border-radius: 16px; border: 1px solid #334155;">
        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #38bdf8;">${code}</span>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">⏱️ Mã này có hiệu lực trong <strong>10 phút</strong> và chỉ sử dụng được <strong>1 lần duy nhất</strong>.</p>
      <p style="color: #64748b; font-size: 12px; margin-bottom: 0; border-top: 1px solid #1e293b; padding-top: 12px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
    </div>
  `;
  return sendCustomEmail(to, subject, html);
};

export default {
  sendHugoTeamApplyConfirm,
  sendHugoTeamApproved,
  sendHugoTeamRejected,
  sendContactForm,
  sendCustomEmail,
  sendMagicLinkOtp,
};
