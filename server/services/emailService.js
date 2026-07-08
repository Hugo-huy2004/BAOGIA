import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: parseInt(process.env.EMAIL_SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

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
    await transporter.sendMail({
      from: `"Hugo Team" <${process.env.EMAIL_CONTACT}>`,
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
    await transporter.sendMail({
      from: `"Hugo Team Support" <${process.env.EMAIL_SUPPORT}>`,
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
    await transporter.sendMail({
      from: `"Hugo Team" <${process.env.EMAIL_CONTACT}>`,
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
    await transporter.sendMail({
      from: `"Hugo Contact" <${process.env.EMAIL_CONTACT}>`,
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

export const sendCustomEmail = async (to, subject, html, cc = null, fromEmail = null) => {
  try {
    const mailOptions = {
      from: fromEmail || `"Hugo Support" <${process.env.EMAIL_SUPPORT}>`,
      to,
      subject,
      html,
    };
    if (cc) mailOptions.cc = cc;

    await transporter.sendMail(mailOptions);
    console.log(`✅ Custom email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send custom email:`, error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendHugoTeamApplyConfirm,
  sendHugoTeamApproved,
  sendHugoTeamRejected,
  sendContactForm,
  sendCustomEmail,
};
