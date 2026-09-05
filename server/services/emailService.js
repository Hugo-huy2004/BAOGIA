import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email chỉ tới người dùng thật khi SendGrid có key thật; nếu không, sendCustomEmail
// im lặng "mô phỏng" và trả success. Lớp xác thực tiền phải BIẾT điều này để
// không bao giờ coi một mã OTP không hề được gửi là đã gửi.
export const isEmailDeliverable = () =>
  Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.'));

// Email templates
const templates = {
  hugoTeamApplyConfirm: (name, email) => ({
    subject: '✅ Đơn đăng ký Hugo Team đã nhận được',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Chào ${name}!</h2>
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
        <h2 style="color: #22c55e;">Chúc mừng ${name}! 🎉</h2>
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
        <h2 style="color: #333;">Chào ${name},</h2>
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
    subject: `📨 Tin nhắn từ ${name}: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p><strong>Từ:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Chủ đề:</strong> ${subject}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p><strong>Nội dung:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `
  }),
};

// Email sending functions
export const sendHugoTeamApplyConfirm = async (name, email) => {
  try {
    const template = templates.hugoTeamApplyConfirm(name, email);
    await sgMail.send({
      from: process.env.EMAIL_CONTACT,
      to: email,
      subject: template.subject,
      html: template.html,
    });
    console.log(`✅ Hugo Team apply confirmation sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const sendHugoTeamApproved = async (name, email) => {
  try {
    const template = templates.hugoTeamApproved(name, email);
    await sgMail.send({
      from: process.env.EMAIL_SUPPORT,
      to: email,
      replyTo: process.env.EMAIL_SUPPORT,
      subject: template.subject,
      html: template.html,
    });
    console.log(`✅ Hugo Team approved notification sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const sendHugoTeamRejected = async (name, email) => {
  try {
    const template = templates.hugoTeamRejected(name, email);
    await sgMail.send({
      from: process.env.EMAIL_CONTACT,
      to: email,
      subject: template.subject,
      html: template.html,
    });
    console.log(`✅ Hugo Team rejection notification sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
};

export const sendContactForm = async (name, email, subject, message, recipientEmail) => {
  try {
    const template = templates.contactForm(name, email, subject, message);
    await sgMail.send({
      from: process.env.EMAIL_CONTACT,
      to: recipientEmail,
      replyTo: email,
      subject: template.subject,
      html: template.html,
    });
    console.log(`✅ Contact form email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send contact form email:`, error.message);
    return { success: false, error: error.message };
  }
};

export const sendCustomEmail = async (to, subject, html, cc = null, fromEmail = null, attachments = null) => {
  try {
    const sender = fromEmail || process.env.EMAIL_SUPPORT || 'support@hugostudio.vn';
    const msg = {
      from: sender,
      to,
      subject,
      html,
    };
    if (cc) msg.cc = cc;
    if (attachments?.length) msg.attachments = attachments;

    if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.includes('YOUR_')) {
      console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true, message: `Email đã được mô phỏng gửi thành công tới ${to}` };
    }

    await sgMail.send(msg);
    console.log(`✅ Custom email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.warn(`⚠️ SendGrid API error, falling back to simulated email:`, error.message);
    return { success: true, simulated: true, message: `Đã mô phỏng gửi email tới ${to} (SendGrid API key chưa kích hoạt)` };
  }
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
