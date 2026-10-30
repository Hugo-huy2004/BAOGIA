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

// ── Khung thư chung ─────────────────────────────────────────────────────────
// MỌI thư rời máy chủ đều đi qua sendCustomEmail → được bọc khung này nếu người
// gọi chưa tự bọc. Nhờ một cửa duy nhất mà luật "thư nào cũng có logo + chân
// thư đủ thông tin + ghi chú phi lợi nhuận" không thể bị quên ở một route nào.
// Không có quảng cáo: Hugo Studio chỉ gửi thư hệ thống, thư theo dõi hồ sơ và
// thư chính thức từ Ban Quản trị.
const SITE_URL = (process.env.APP_URL || 'https://www.hugowishpax.studio').replace(/\/$/, '');
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
const CONTACT_EMAIL = () => process.env.EMAIL_CONTACT || 'contact@hugowishpax.studio';
const SUPPORT_EMAIL = () => process.env.EMAIL_SUPPORT || 'support@hugowishpax.studio';
const MAIL_MARK = 'data-hugo-mail';
const ACCENT = '#0a84ff';
const SOCIALS = [
  ['tiktok.com/@hugo.studiotiktok', 'https://www.tiktok.com/@hugo.studiotiktok'],
  ['instagram.com/hugostudio.vn', 'https://www.instagram.com/hugostudio.vn'],
  ['facebook.com/hugostudio', 'https://www.facebook.com/share/1B8UdufQj4/'],
];

const link = (href, label, color = '#1a56db') => `<a href="${href}" style="color:${color};text-decoration:underline;">${label}</a>`;

/** Thanh theo dõi giai đoạn: đã qua ✓, đang ở ●, chưa tới ○; `stopped` = dừng ở bước hiện tại. */
function stageTracker(stages, current, stopped) {
  const rows = stages.map((label, index) => {
    const done = index < current;
    const now = index === current;
    const color = stopped && now ? '#d93025' : done || now ? ACCENT : '#c4c7cc';
    const mark = stopped && now ? '✕' : done ? '✓' : now ? '●' : '○';
    const text = now ? `<b style="color:#202124;">${e(label)}</b>${stopped ? ' — dừng tại đây' : ' — đang ở bước này'}` : e(label);
    return `<tr><td width="30" valign="top" style="padding:0 0 10px;"><span style="display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;border-radius:11px;font-size:12px;font-weight:800;color:${done || now ? '#fff' : color};background:${done || now ? color : '#fff'};border:1.5px solid ${color};">${mark}</span></td><td valign="top" style="padding:2px 0 10px;font-size:14px;line-height:1.4;color:${done ? '#5f6368' : now ? '#202124' : '#9aa0a6'};">${text}</td></tr>`;
  }).join('');
  return `<div style="margin:24px 0 4px;padding:18px 20px 8px;border:1px solid #e3e6ea;border-radius:14px;background:#fafbfc;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:${ACCENT};">Tiến trình hồ sơ · bước ${Math.min(current + 1, stages.length)}/${stages.length}</p>
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%">${rows}</table></div>`;
}

// Quy định đi kèm mọi thư chính thức của Ban Quản trị.
const LETTER_RULES = [
  'Đây là thư chính thức của Ban Quản trị Hugo Studio, gửi từ tên miền @hugowishpax.studio. Thư mạo danh không đến từ tên miền này.',
  'Hugo Studio KHÔNG BAO GIỜ yêu cầu mật khẩu, mã OTP, mã PIN hay chuyển tiền qua email.',
  'Nội dung thư dành riêng cho người nhận. Nếu nhận nhầm, xin vui lòng xoá thư và báo lại cho chúng tôi.',
  `Quyền và nghĩa vụ của hai bên theo ${link(`${SITE_URL}/terms`, 'Điều khoản sử dụng')} và ${link(`${SITE_URL}/privacy-policy`, 'Chính sách quyền riêng tư')}.`,
  `Mọi phản hồi về thư này gửi về ${link(`mailto:${SUPPORT_EMAIL()}`, SUPPORT_EMAIL())} — được ghi nhận và trả lời trong 3 ngày làm việc.`,
];

/**
 * Dựng một thư hoàn chỉnh.
 * - title/eyebrow: nội dung chính được nêu bật ngay đầu thư.
 * - stages + current (+ stopped): thư theo dõi giai đoạn tự động.
 * - letter: thư chính thức của Ban Quản trị → thêm lời ký + khối quy định.
 * - team/office: dòng ký tên kiểu "Ban Quản trị :: Hugo Studio".
 * - reason: vì sao người nhận có thư này (dòng cuối thư).
 */
export function brandEmail({
  body = '', title = '', eyebrow = '', preheader = '', cta = null,
  stages = null, current = 0, stopped = false,
  letter = false, team = 'Ban Quản trị', office = '',
  reason = 'Bạn nhận thư này vì có tài khoản hoặc yêu cầu đang xử lý tại Hugo Studio.',
} = {}) {
  const year = new Date().getFullYear();
  const signature = [`<b style="color:#1f3a68;">${e(team)}</b>`, office && e(office), 'Hugo Studio'].filter(Boolean).join(' :: ');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body ${MAIL_MARK} style="margin:0;padding:0;background:#eef1f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#202124;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preheader || title)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e3e6ea;">
  <tr><td style="background:#0b1220;padding:20px 28px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
      <td width="60" valign="middle"><img src="${SITE_URL}/brand/hugo-mail-logo.gif" width="52" height="52" alt="Hugo Studio" style="display:block;border:0;border-radius:13px;"></td>
      <td valign="middle" style="padding-left:12px;"><div style="font-size:20px;font-weight:800;letter-spacing:-.4px;color:#ffffff;">Hugo Studio</div><div style="font-size:12px;color:#8fb8e8;letter-spacing:.06em;">DỰ ÁN PHI LỢI NHUẬN</div></td>
      <td align="right" valign="middle" style="font-size:12px;color:#8fb8e8;">${letter ? 'Thư chính thức' : stages ? 'Theo dõi hồ sơ' : 'Thư hệ thống'}</td>
    </tr></table>
  </td></tr>
  <tr><td style="height:4px;background:${ACCENT};line-height:4px;font-size:0;">&nbsp;</td></tr>
  <tr><td style="padding:34px 32px 8px;">
    ${eyebrow ? `<p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:${ACCENT};">${e(eyebrow)}</p>` : ''}
    ${title ? `<h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;letter-spacing:-.5px;color:#111827;">${e(title)}</h1>` : ''}
    <div style="font-size:15px;line-height:1.65;color:#3c4043;">${body}</div>
    ${stages ? stageTracker(stages, current, stopped) : ''}
    ${cta ? `<p style="margin:26px 0 6px;"><a href="${cta.href}" style="display:inline-block;background:${ACCENT};color:#ffffff;padding:13px 26px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;">${e(cta.label)}</a></p>` : ''}
    ${letter ? `<p style="margin:26px 0 0;font-size:15px;line-height:1.6;color:#3c4043;">Trân trọng,<br><b>${e(team)}</b> — Hugo Studio</p>
    <div style="margin:24px 0 0;padding:16px 18px;border-left:3px solid ${ACCENT};background:#f5f8ff;border-radius:0 10px 10px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#1f3a68;">Quy định thư từ</p>
      <ol style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.6;color:#5f6368;">${LETTER_RULES.map((rule) => `<li>${rule}</li>`).join('')}</ol>
    </div>` : ''}
  </td></tr>
  <tr><td style="padding:28px 32px 6px;"><div style="border-top:1px solid #e3e6ea;"></div></td></tr>
  <tr><td style="padding:10px 32px 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.75;color:#3c4043;">
    ${signature}<br>
    Email : ${link(`mailto:${CONTACT_EMAIL()}`, CONTACT_EMAIL())} | Hỗ trợ : ${link(`mailto:${SUPPORT_EMAIL()}`, SUPPORT_EMAIL())} | Website : ${link(SITE_URL, SITE_HOST)}<br>
    ${SOCIALS.map(([label, href]) => link(href, label)).join(' :: ')}<br>
    <i>Hugo Studio là website phi lợi nhuận — dự án hoạt động không thu lợi nhuận, không bán quảng cáo và không bán dữ liệu.</i>
  </td></tr>
  <tr><td style="padding:16px 32px 8px;">
    <table role="presentation" cellspacing="0" cellpadding="0"><tr>
      <td valign="middle"><img src="${SITE_URL}/brand/hugo-mail-logo.png" width="44" height="44" alt="Hugo Studio" style="display:block;border:0;border-radius:11px;"></td>
      <td valign="middle" style="padding:0 16px 0 10px;border-right:1px solid #c4c7cc;"><div style="font-size:19px;font-weight:800;color:#0b1220;letter-spacing:-.3px;">Hugo Studio</div><div style="font-size:11px;color:#5f6368;">${e(SITE_HOST)}</div></td>
      <td valign="middle" style="padding-left:16px;font-size:12px;font-weight:800;letter-spacing:.06em;color:#1f3a68;white-space:nowrap;">DỰ ÁN PHI LỢI NHUẬN<br><span style="font-weight:600;color:#5f6368;letter-spacing:.02em;">Hoạt động không thu lợi</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:18px 32px 30px;font-size:12.5px;line-height:1.6;color:#5f6368;">
    ${link(`${SITE_URL}/support-request`, '<b>Trung tâm hỗ trợ</b>', '#1a56db')} • ${link(`${SITE_URL}/terms`, '<b>Điều khoản</b>', '#1a56db')} • ${link(`${SITE_URL}/privacy-policy`, '<b>Quyền riêng tư</b>', '#1a56db')}<br>
    <span style="display:inline-block;margin-top:8px;">${e(reason)}</span><br>
    <span style="display:inline-block;margin-top:8px;">© ${year} Hugo Studio · dự án cá nhân phi lợi nhuận · ${e(SITE_HOST)}</span>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

/** Thư chính thức của Ban Quản trị: khung + lời ký + khối quy định. */
export const sendAdminLetter = (to, subject, body, { team = 'Ban Quản trị', office = '', attachments = null, eyebrow = 'Thư từ Ban Quản trị', title = subject } = {}) =>
  sendCustomEmail(to, subject, brandEmail({
    body, title, eyebrow, letter: true, team, office,
    reason: 'Bạn nhận thư này vì Ban Quản trị Hugo Studio gửi thông báo liên quan trực tiếp tới tài khoản của bạn.',
  }), null, null, attachments, SUPPORT_EMAIL());

/** Thư theo dõi giai đoạn của một hồ sơ cần phê duyệt — gửi tự động mỗi khi hồ sơ đổi bước. */
export const sendStageEmail = (to, { subject, title, body, stages, current, stopped = false, cta = null, team = 'Ban Quản trị', office = '' }) =>
  sendCustomEmail(to, subject, brandEmail({
    body, title, eyebrow: 'Cập nhật hồ sơ', stages, current, stopped, cta, team, office,
    reason: 'Bạn nhận thư này vì hồ sơ của bạn tại Hugo Studio vừa chuyển sang giai đoạn mới. Thư được gửi tự động ở mỗi bước.',
  }));

// Lộ trình Hugo Team — một nguồn cho mọi thư theo dõi giai đoạn của chương trình.
export const HUGOTEAM_STAGES = ['Nộp hồ sơ', 'Xét duyệt', 'Học Coding (26 step)', 'Lời mời vào đội', 'Đồng hành cùng Mentor 30 ngày', 'Làm việc theo Team', 'Thành viên chính thức'];
const hugoTeamCta = { label: 'Mở Hugo Team', href: `${SITE_URL}/member/utilities/team` };
export const sendHugoTeamStage = (email, current, { subject, title, body, stopped = false }) =>
  sendStageEmail(email, { subject, title, body, stages: HUGOTEAM_STAGES, current, stopped, cta: stopped ? null : hugoTeamCta, team: 'Hugo Team', office: 'Chương trình đào tạo' });

const templates = {
  contactForm: (name, email, subject, message) => ({
    subject: `Tin nhắn từ ${String(name).replace(/[\r\n]+/g, ' ')}: ${String(subject).replace(/[\r\n]+/g, ' ')}`,
    html: brandEmail({
      eyebrow: 'Biểu mẫu liên hệ', title: String(subject),
      body: `<p style="margin:0;"><b>Từ:</b> ${e(name)}<br><b>Email:</b> ${e(email)}</p><p style="margin:16px 0 0;padding:14px 16px;background:#f6f7f9;border-radius:10px;">${e(message).replace(/\n/g, '<br>')}</p>`,
      reason: 'Thư nội bộ: có người gửi biểu mẫu liên hệ trên website Hugo Studio.',
    }),
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
  // Thư nào chưa tự bọc khung thì bọc ở đây — logo và chân thư là bắt buộc.
  const framed = String(html || '').includes(MAIL_MARK) ? html : brandEmail({ body: html, preheader: subject });
  const msg = { from: sender, to, subject: String(subject).replace(/[\r\n]+/g, ' '), html: framed };
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
export const sendHugoTeamApplyConfirm = (name, email) => sendHugoTeamStage(email, 1, {
  subject: 'Hugo Team đã nhận hồ sơ của bạn',
  title: 'Hồ sơ đã được tiếp nhận',
  body: `<p style="margin:0;">Chào ${e(name)},</p><p>Cảm ơn bạn đã đăng ký tham gia <b>Hugo Team</b>. Hồ sơ và CV của bạn đang được xét duyệt trong <b>3–5 ngày làm việc</b>. Mỗi khi hồ sơ chuyển bước, bạn sẽ nhận được thư cập nhật như thư này.</p>`,
});

export const sendHugoTeamApproved = (name, email) => sendHugoTeamStage(email, 2, {
  subject: 'Hồ sơ Hugo Team đã được phê duyệt',
  title: `Chúc mừng ${name}, bạn đã được phê duyệt`,
  body: `<p style="margin:0;">Bước tiếp theo là chương trình <b>Coding 26 step</b> ngay trong ứng dụng. Học xong toàn bộ, hệ thống tự gửi lời mời vào đội — không cần chờ ai duyệt thêm.</p>`,
});

export const sendHugoTeamRejected = (name, email) => sendHugoTeamStage(email, 1, {
  stopped: true,
  subject: 'Kết quả xét duyệt hồ sơ Hugo Team',
  title: 'Hồ sơ chưa được phê duyệt lần này',
  body: `<p style="margin:0;">Chào ${e(name)},</p><p>Cảm ơn bạn đã quan tâm tới Hugo Team. Sau khi xem xét, hiện tại chúng tôi chưa thể phê duyệt hồ sơ của bạn. Bạn hoàn toàn có thể nộp lại khi đã có thêm kinh nghiệm lập trình.</p>`,
});

export const sendContactForm = (name, email, subject, message, recipientEmail) => {
  const template = templates.contactForm(name, email, subject, message);
  return sendCustomEmail(recipientEmail, template.subject, template.html, null, process.env.EMAIL_CONTACT, null, email);
};

/** Gửi mã OTP đăng nhập Magic Link 1 lần (hạn 10 phút) */
export const sendMagicLinkOtp = async (to, code, purpose = 'login') => {
  const isIdentity = purpose === 'identity';
  const subject = isIdentity
    ? `Mã xác minh thông tin Hugo Studio: ${code}`
    : `Mã đăng nhập Hugo Studio: ${code}`;
  const html = brandEmail({
    eyebrow: isIdentity ? 'Xác minh định kỳ' : 'Đăng nhập',
    title: isIdentity ? 'Mã xác minh thông tin' : 'Mã đăng nhập dùng một lần',
    preheader: `Mã của bạn: ${code}`,
    body: `<p style="margin:0;">${isIdentity
      ? 'Hugo Studio đang kiểm tra định kỳ xem hòm thư này có đúng là của bạn không. Nhập mã dưới đây vào ứng dụng để hoàn tất.'
      : 'Bạn vừa yêu cầu đăng nhập bằng mã dùng một lần. Nhập mã dưới đây vào ứng dụng.'}</p>
      <p style="margin:20px 0;text-align:center;"><span style="display:inline-block;padding:14px 26px;border-radius:12px;background:#f1f6ff;border:1px solid #cfe0ff;font-family:Menlo,Consolas,monospace;font-size:30px;font-weight:800;letter-spacing:6px;color:#0b1220;">${e(code)}</span></p>
      <p style="margin:0;font-size:13px;color:#5f6368;">Mã có hiệu lực <b>10 phút</b> và chỉ dùng được <b>1 lần</b>. Nếu bạn không yêu cầu mã này, hãy bỏ qua thư — tài khoản của bạn vẫn an toàn.</p>`,
    reason: 'Bạn nhận thư này vì có yêu cầu mã xác thực cho tài khoản Hugo Studio dùng địa chỉ email này.',
  });
  return sendCustomEmail(to, subject, html);
};

export default {
  brandEmail,
  sendAdminLetter,
  sendStageEmail,
  sendHugoTeamApplyConfirm,
  sendHugoTeamApproved,
  sendHugoTeamRejected,
  sendContactForm,
  sendCustomEmail,
  sendMagicLinkOtp,
};
