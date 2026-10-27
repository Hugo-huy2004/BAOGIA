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

// MỘT đường gửi thật duy nhất. Mọi hàm gửi bên dưới đều đi qua đây nên luật
// "mô phỏng khi chưa có khoá / báo lỗi thật khi đã có khoá" chỉ nằm MỘT chỗ.
//
// NGHIÊM TRỌNG đã sửa (27/10/2026): trước đây hàm này nuốt MỌI lỗi SendGrid rồi
// trả { success: true, simulated: true }. Admin bấm gửi, thấy "thành công",
// nhưng người nhận không bao giờ nhận được — người gửi chưa verify, khoá sai,
// 401… đều bị giấu. Giờ: CHƯA có khoá thật → mô phỏng (chỉ hợp lệ ở dev); ĐÃ có
// khoá → lỗi gửi thật phải lộ ra ({ success: false, error }), không báo giả.
export const sendCustomEmail = async (
  to, subject, html, cc = null, fromEmail = null, attachments = null, replyTo = null,
) => {
  const sender = fromEmail || process.env.EMAIL_SUPPORT || 'support@hugowishpax.studio';
  const msg = { from: sender, to, subject, html };
  if (cc) msg.cc = cc;
  if (replyTo) msg.replyTo = replyTo;
  if (attachments?.length) msg.attachments = attachments;

  if (!isEmailDeliverable()) {
    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true, message: `Email đã được mô phỏng gửi tới ${to} (SENDGRID_API_KEY chưa cấu hình).` };
  }

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    // SendGrid gói chi tiết lỗi (sender chưa verify, 401…) trong response.body.
    const detail = error.response?.body?.errors?.map((e) => e.message).join('; ') || error.message;
    console.error(`❌ SendGrid gửi tới ${to} thất bại:`, detail);
    return { success: false, error: detail };
  }
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
