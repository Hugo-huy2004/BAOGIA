import NotificationSubscription from '../models/NotificationSubscription.js';
import EduLearner from '../models/EduLearner.js';
import Persona from '../models/Persona.js';
import { cleanEduPrefs } from '../../../packages/shared/eduPrefs.js';
import { escapeHtml as e, sendCustomEmail } from './emailService.js';
import { EDU_CAST, streakPush } from '../../../packages/shared/eduStreak.js';
import { EDU_ORIGIN } from '../../../packages/shared/eduSite.js';
import { notificationLanguage } from '../../../packages/shared/notificationText.js';

/**
 * Thư của Education Hugo theo kiểu thư Duolingo: chữ "Education Hugo" xám trên cùng,
 * một nhân vật cast to, tiêu đề đậm, một câu ngắn, nút xanh to. Chữ dùng chung với
 * push (STREAK_PUSH) nên mỗi tin chỉ viết một lần cho cả push, hộp thư và mail.
 * Chỉ gửi mail cho tin đáng giữ lại (MAIL_KEYS) — nhắc học hằng ngày chỉ đi push.
 * Ảnh là PNG (Gmail không hiện SVG): apps/web/public/edu/mail/<nhân vật>.png.
 */
const ESSENTIAL = new Set(['account', 'security']);
export const MAIL_KEYS = new Set(['welcome', 'account', 'security', 'frozen', 'milestone', 'friendRequest']);

const COPY = {
  vi: {
    cta: { welcome: 'HỌC NGAY', account: 'GIA HẠN TÀI KHOẢN', security: 'KIỂM TRA TÀI KHOẢN', frozen: 'SƯỞI ẤM LỬA NHỎ', milestone: 'XEM LỊCH LỬA', friendRequest: 'XEM LỜI MỜI' },
    tagline: 'Khoá học miễn phí cho học sinh – sinh viên · một dự án phi lợi nhuận của Hugo Studio',
    reason: 'Bạn nhận thư này vì có tài khoản Education Hugo. Tắt thư email trong Hồ sơ > Thông báo.',
    terms: 'Điều khoản', privacy: 'Quyền riêng tư', profile: 'Hồ sơ',
  },
  en: {
    cta: { welcome: 'LEARN NOW', account: 'EXTEND MY ACCOUNT', security: 'REVIEW MY ACCOUNT', frozen: 'WARM UP LITTLE FLAME', milestone: 'SEE MY STREAK', friendRequest: 'SEE THE REQUEST' },
    tagline: 'Free courses for students · a nonprofit project by Hugo Studio',
    reason: 'You are receiving this because you have an Education Hugo account. Turn emails off in Profile > Notifications.',
    terms: 'Terms', privacy: 'Privacy', profile: 'Profile',
  },
  zh: {
    cta: { welcome: '立即学习', account: '续期账户', security: '检查账户', frozen: '温暖小火苗', milestone: '查看火苗日历', friendRequest: '查看邀请' },
    tagline: '面向学生的免费课程 · Hugo Studio 的非营利项目',
    reason: '你收到此邮件是因为你拥有 Education Hugo 账户。可在 个人资料 > 通知 中关闭邮件。',
    terms: '条款', privacy: '隐私', profile: '个人资料',
  },
};

/** Dựng một thư Edu hoàn chỉnh. `data-hugo-mail` để sendCustomEmail không bọc khung www thêm lần nữa. */
export function eduEmail({ lang = 'vi', cast = 'cast-1', title, body, cta }) {
  const c = COPY[lang] || COPY.vi;
  const button = cta ? `<tr><td align="center" style="padding:28px 24px 8px;">
    <a href="${cta.href}" style="display:inline-block;background:#1cb0f6;color:#ffffff;padding:15px 34px;border-radius:14px;border-bottom:4px solid #1899d6;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:.06em;">${e(cta.label)}</a>
  </td></tr>` : '';
  const link = (path, label) => `<a href="${EDU_ORIGIN}${path}" style="color:#1cb0f6;text-decoration:none;font-weight:700;">${label}</a>`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body data-hugo-mail style="margin:0;padding:0;background:#ffffff;font-family:'Nunito','Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif;color:#3c3c3c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(body)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;">
  <tr><td align="center" style="font-size:26px;font-weight:800;letter-spacing:-.6px;color:#afafaf;">Education Hugo</td></tr>
  <tr><td align="center" style="padding:26px 0 0;"><img src="${EDU_ORIGIN}/edu/mail/${cast}.png" width="160" height="160" alt="" style="display:block;border:0;"></td></tr>
  <tr><td align="center" style="padding:26px 24px 0;font-size:26px;line-height:1.25;font-weight:800;color:#3c3c3c;">${e(title)}</td></tr>
  <tr><td align="center" style="padding:14px 28px 0;font-size:16px;line-height:1.6;color:#777777;">${e(body)}</td></tr>
  ${button}
  <tr><td style="padding:34px 24px 0;"><div style="border-top:2px solid #e5e5e5;font-size:0;line-height:0;">&nbsp;</div></td></tr>
  <tr><td align="center" style="padding:18px 24px 0;font-size:13px;line-height:1.7;color:#afafaf;">
    ${e(c.tagline)}<br>
    ${link('/terms', e(c.terms))} · ${link('/privacy', e(c.privacy))} · ${link('/profile', e(c.profile))}<br>
    <span style="display:inline-block;margin-top:8px;">${e(c.reason)}</span><br>
    <span style="display:inline-block;margin-top:8px;">© ${new Date().getFullYear()} Hugo Studio · contact@hugowishpax.studio</span>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

/** Ngôn ngữ thư = ngôn ngữ máy Edu mới nhất của người học (vi/en/zh, còn lại tiếng Việt). */
async function mailLanguage(email) {
  const sub = await NotificationSubscription.findOne({ email, site: 'edu' }).sort({ _id: -1 }).select('device').lean().catch(() => null);
  const lang = notificationLanguage(sub?.device?.locale);
  return ['vi', 'en', 'zh'].includes(lang) ? lang : 'vi';
}

/** Gửi thư cho một khoá thông báo Edu (bỏ qua khoá không thuộc MAIL_KEYS). */
export async function sendEduMail(email, { key, vars = {}, url = '/learn' }) {
  if (!MAIL_KEYS.has(key)) return null;
  // Công tắc "Gửi kèm thư email" trong Hồ sơ tắt MỌI thư Edu (push và hộp thư vẫn chạy).
  const doc = await EduLearner.findOne({ email }).select('prefs').lean();
  // Tắt email chỉ chặn thư phụ — thư bảo mật và tài khoản vẫn gửi (đúng Chính sách quyền riêng tư).
  if (doc && !cleanEduPrefs(doc.prefs).notifyEmail && !ESSENTIAL.has(key)) return null;
  const lang = await mailLanguage(email);
  const text = streakPush(lang, key, vars);
  if (!text) return null;
  const html = eduEmail({ lang, cast: EDU_CAST[key], title: text.title, body: text.body, cta: { href: `${EDU_ORIGIN}${url}`, label: COPY[lang].cta[key] } });
  // Tài khoản + đăng nhập lạ là thư quan trọng; còn lại là thư phụ, chỉ dùng tới 60% suất ngày.
  return sendCustomEmail(email, text.title, html, null, null, null, null, ESSENTIAL.has(key) ? 'essential' : 'extra');
}

// ── Thư xin tài trợ (một thư, đủ ba ngôn ngữ) ───────────────────────────────
// Kênh ủng hộ — cùng link mặc định với apps/web/src/config/donationConfig.js (đổi một bên thì đổi cả hai).
const WWW = 'https://www.hugowishpax.studio';
const DONATE = [
  ['PayOS', `${WWW}/?donate=1`, { vi: 'Chuyển khoản trong nước (VNĐ, từ 5.000đ)', en: 'Vietnam bank transfer (VND)', zh: '越南银行转账（越南盾）' }],
  ['Buy Me a Coffee', 'https://buymeacoffee.com/hugowishpax', { vi: 'Một ly cà phê, thẻ quốc tế', en: 'A coffee, any card', zh: '请一杯咖啡，国际卡' }],
  ['Ko-fi', 'https://ko-fi.com/V8Z52887XW', { vi: 'Ủng hộ một lần hoặc hằng tháng', en: 'One-off or monthly', zh: '一次性或每月' }],
  ['PayPal', 'https://www.paypal.com/ncp/payment/LS8MTC5AGLJMY', { vi: 'Ủng hộ qua PayPal', en: 'Give via PayPal', zh: '通过 PayPal 支持' }],
  ['GitHub Sponsors', 'https://github.com/sponsors/Hugo-huy2004', { vi: 'Tài trợ mã nguồn hằng tháng', en: 'Monthly open-source sponsorship', zh: '每月开源赞助' }],
];

const SPONSOR = {
  vi: {
    label: 'TIẾNG VIỆT', dear: 'Kính gửi {name},',
    about: 'Hugo Studio là một dự án cá nhân <b>phi lợi nhuận</b>: không bán quảng cáo, không bán dữ liệu, không thu phí học. Education Hugo mang tới những khoá học hoàn toàn miễn phí cho học sinh – sinh viên ở mọi ngành: từ kỹ năng mềm đến những kỹ thuật chuyên sâu. Khoá nào là đóng góp miễn phí cho học sinh – sinh viên, Education Hugo sẽ đồng hành — và luôn ở bên bạn trong từng bài hướng dẫn, mỗi ngày một bài nhỏ, có lộ trình, có bạn học.',
    review: 'Bạn đã học cùng chúng tôi, nên ý kiến của bạn là thứ quý nhất lúc này. Bạn có thể dành <b>1 phút</b> làm bài đánh giá chương trình học phi lợi nhuận tại Education Hugo: 5 câu chấm sao và một ô góp ý.',
    reviewCta: 'ĐÁNH GIÁ TRONG 1 PHÚT',
    ask: 'Bên cạnh đó, để tiếp tục xây cộng đồng, mở thêm khoá học cho nhiều ngành và giữ máy chủ chạy ổn định, Hugo Studio rất cần sự đồng hành của bạn. Mọi khoản ủng hộ, dù nhỏ, đều đi thẳng vào việc vận hành và phát triển Education Hugo — và bài học sẽ mãi miễn phí cho mọi người.',
    ways: 'Các hình thức ủng hộ',
    note: 'Ủng hộ là hoàn toàn tự nguyện và không mở thêm quyền lợi nào trong app — người không ủng hộ vẫn học đầy đủ như mọi người. Bạn nhận được thư cảm ơn sau mỗi khoản ủng hộ.',
    sign: 'Cảm ơn bạn đã ở đây,<br><b>Hugo Studio</b> — Education Hugo',
  },
  en: {
    label: 'ENGLISH', dear: 'Dear {name},',
    about: 'Hugo Studio is a personal <b>nonprofit</b> project: no ads, no selling data, no tuition. Education Hugo offers completely free courses for students in every field, from soft skills to deep technical know-how. Any course given freely to students is one Education Hugo will stand behind, and we stay with you through every lesson: one small step a day, with a clear path and study friends.',
    review: 'You have learned with us, so your opinion is the most valuable thing we could ask for. Could you spare <b>one minute</b> to review the nonprofit learning programme at Education Hugo? Five star questions and one box for your ideas.',
    reviewCta: 'REVIEW IN 1 MINUTE',
    ask: 'Beyond that, to keep growing the community, build new courses across many fields and keep the servers running, Hugo Studio would be grateful to have you alongside us. Every contribution, however small, goes straight into running and developing Education Hugo — and the lessons stay free for everyone, forever.',
    ways: 'Ways to support',
    note: 'Support is entirely voluntary and unlocks nothing extra in the app — everyone learns the same full course. You will receive a thank-you note after each contribution.',
    sign: 'Thank you for being here,<br><b>Hugo Studio</b> — Education Hugo',
  },
  zh: {
    label: '中文', dear: '亲爱的 {name}：',
    about: 'Hugo Studio 是一个个人<b>非营利</b>项目：不卖广告、不出售数据、不收学费。Education Hugo 为各专业的学生提供完全免费的课程：从软技能到深度技术。只要是免费奉献给学生的课程，Education Hugo 都会同行，并在每一课中陪伴你——每天一小步，有清晰的路线和学习伙伴。',
    review: '你曾和我们一起学习，所以你的意见对我们最珍贵。能否花 <b>1 分钟</b> 为 Education Hugo 的非营利课程做个评价？共 5 道星级题和 1 个建议框。',
    reviewCta: '1 分钟完成评价',
    ask: '此外，为了继续建设社区、为更多专业开设新课程并让服务器稳定运行，Hugo Studio 非常需要你的同行。每一笔支持，无论多少，都会直接用于运营和发展 Education Hugo——课程将永远对所有人免费。',
    ways: '支持方式',
    note: '支持完全自愿，不会在应用中解锁任何额外权益——每个人都能学到完整课程。每次支持后你都会收到一封感谢信。',
    sign: '感谢你的陪伴，<br><b>Hugo Studio</b> — Education Hugo',
  },
};

const p = (html) => `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.65;color:#4b4b4b;">${html}</p>`;
const btn = (href, label) => `<p style="margin:6px 0 22px;text-align:center;"><a href="${href}" style="display:inline-block;background:#58cc02;color:#ffffff;padding:15px 30px;border-radius:14px;border-bottom:4px solid #58a700;text-decoration:none;font-size:15px;font-weight:800;letter-spacing:.06em;">${e(label)}</a></p>`;

function sponsorSection(lang, name) {
  const c = SPONSOR[lang];
  const ways = DONATE.map(([brand, href, desc]) => `<tr><td style="padding:0 0 10px;"><a href="${href}" style="display:block;padding:13px 16px;border:2px solid #e5e5e5;border-bottom-width:4px;border-radius:14px;text-decoration:none;"><b style="font-size:15px;color:#1cb0f6;">${brand}</b><br><span style="font-size:13.5px;color:#777777;">${e(desc[lang])}</span></a></td></tr>`).join('');
  return `<tr><td id="${lang}" style="padding:30px 24px 6px;">
    <p style="margin:0 0 16px;font-size:12px;font-weight:800;letter-spacing:.12em;color:#afafaf;">${c.label}</p>
    ${p(`<b style="color:#3c3c3c;">${e(c.dear.replace('{name}', name))}</b>`)}
    ${p(c.about)}${p(c.review)}
    ${btn(`${EDU_ORIGIN}/feedback?from=mail&lang=${lang}`, c.reviewCta)}
    ${p(c.ask)}
    <p style="margin:18px 0 10px;font-size:17px;font-weight:800;color:#3c3c3c;">${e(c.ways)}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${ways}</table>
    <p style="margin:8px 0 16px;font-size:13px;line-height:1.6;color:#999999;">${e(c.note)}</p>
    ${p(c.sign)}
  </td></tr>`;
}

/** Thư xin tài trợ: một thư, Việt → Anh → Trung (mỗi phần có neo #vi #en #zh, liên kết nhảy ở đầu thư). */
export function sponsorEmail(name) {
  const safe = String(name || '').trim().slice(0, 40) || 'bạn';
  const divider = '<tr><td style="padding:10px 24px 0;"><div style="border-top:2px solid #e5e5e5;font-size:0;line-height:0;">&nbsp;</div></td></tr>';
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body data-hugo-mail style="margin:0;padding:0;background:#ffffff;font-family:'Nunito','Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Arial,sans-serif;color:#3c3c3c;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Đồng hành cùng Education Hugo · Support Education Hugo · 支持 Education Hugo</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;">
  <tr><td align="center" style="font-size:26px;font-weight:800;letter-spacing:-.6px;color:#afafaf;">Education Hugo</td></tr>
  <tr><td align="center" style="padding:22px 0 0;">
    <img src="${EDU_ORIGIN}/edu/mail/cast-3.png" width="86" height="86" alt="" style="display:inline-block;border:0;vertical-align:bottom;">
    <img src="${EDU_ORIGIN}/edu/mail/buddy-done.png" width="130" height="130" alt="" style="display:inline-block;border:0;vertical-align:bottom;">
    <img src="${EDU_ORIGIN}/edu/mail/cast-6.png" width="86" height="86" alt="" style="display:inline-block;border:0;vertical-align:bottom;">
  </td></tr>
  <tr><td align="center" style="padding:22px 24px 0;font-size:25px;line-height:1.3;font-weight:800;color:#3c3c3c;">Đồng hành cùng Education Hugo<br><span style="font-size:17px;color:#777777;">Support Education Hugo · 支持 Education Hugo</span></td></tr>
  <tr><td align="center" style="padding:14px 24px 0;font-size:14px;font-weight:800;"><a href="#vi" style="color:#1cb0f6;text-decoration:none;">Tiếng Việt</a> <span style="color:#d0d0d0;">·</span> <a href="#en" style="color:#1cb0f6;text-decoration:none;">English</a> <span style="color:#d0d0d0;">·</span> <a href="#zh" style="color:#1cb0f6;text-decoration:none;">中文</a></td></tr>
  ${sponsorSection('vi', safe)}${divider}${sponsorSection('en', safe)}${divider}${sponsorSection('zh', safe)}
  ${divider}
  <tr><td align="center" style="padding:18px 24px 0;font-size:12.5px;line-height:1.7;color:#afafaf;">
    Hugo Studio · dự án phi lợi nhuận · nonprofit project · 非营利项目<br>
    <a href="${EDU_ORIGIN}/terms" style="color:#1cb0f6;text-decoration:none;font-weight:700;">Terms</a> · <a href="${EDU_ORIGIN}/privacy" style="color:#1cb0f6;text-decoration:none;font-weight:700;">Privacy</a> · <a href="${EDU_ORIGIN}/profile" style="color:#1cb0f6;text-decoration:none;font-weight:700;">Tắt thư email / Turn off emails / 关闭邮件</a><br>
    © ${new Date().getFullYear()} Hugo Studio · contact@hugowishpax.studio
  </td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Gửi một đợt thư xin tài trợ (cron ngày 01–07 hoặc admin bấm). Mỗi người tối đa 1 thư / tháng, bỏ qua người tắt email.
 * Dùng hạng 'extra' của ngân sách thư → hết suất thì dừng đợt, lần sau bấm tiếp.
 */
// Còn được gửi tháng này: chưa từng nhận, hoặc lần nhận gần nhất trước ngày 01 tháng này.
const monthStart = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), 1);
const sponsorDue = (now = new Date()) => ({ 'prefs.notifyEmail': { $ne: false }, $or: [{ sponsorMailedAt: { $exists: false } }, { sponsorMailedAt: { $lt: monthStart(now) } }] });

/**
 * Cron 10h sáng ngày 01–07 hằng tháng: chia đều số người còn chờ cho các ngày còn lại trong khung
 * (ngày 01 gửi 1/7, ngày 07 vét nốt). Tối đa 40 thư/ngày — phần thư phụ còn 20 suất cho chào mừng,
 * mốc lửa… (utils/mailBudget.js). Không gửi hết trong tháng thì người còn lại chờ tháng sau.
 */
export async function runSponsorMonth(now = new Date()) {
  const day = now.getDate();
  if (day > 7) return { sent: 0 };
  const due = await EduLearner.countDocuments(sponsorDue(now));
  const today = Math.min(40, Math.ceil(due / (8 - day)));
  return today ? sendSponsorBatch(today) : { sent: 0 };
}

export async function sendSponsorBatch(limit = 30, { onlyEmail = null } = {}) {
  const filter = onlyEmail ? { email: onlyEmail } : sponsorDue();
  const learners = await EduLearner.find(filter).select('email').sort({ lastActiveAt: -1 }).limit(Math.min(Number(limit) || 30, 50)).lean();
  const names = new Map((await Persona.find({ email: { $in: learners.map((l) => l.email) } }).select('email nickname').lean()).map((x) => [x.email, x.nickname]));
  let sent = 0;
  for (const { email } of learners) {
    const result = await sendCustomEmail(email, 'Đồng hành cùng Education Hugo · Support Education Hugo · 支持 Education Hugo', sponsorEmail(names.get(email)), null, null, null, null, 'extra');
    if (result?.skipped === 'quota') return { sent, stopped: 'quota', candidates: learners.length };
    if (result?.success) { sent += 1; await EduLearner.updateOne({ email }, { $set: { sponsorMailedAt: new Date() } }); }
  }
  return { sent, candidates: learners.length };
}
