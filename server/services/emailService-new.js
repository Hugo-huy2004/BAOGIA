import nodemailer from "nodemailer";

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