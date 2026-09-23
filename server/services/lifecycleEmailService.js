import jwt from 'jsonwebtoken';
import Bio from '../models/Bio.js';
import Data from '../models/Data.js';
import UserProfile from '../models/UserProfile.js';
import { JWT_SECRET } from '../utils/secrets.js';
import { isEmailDeliverable, sendCustomEmail } from './emailService.js';

const DAY = 86_400_000;
// 20h lets the next 10:00 run through even if yesterday's job started a few
// milliseconds late; the cron itself is once daily, so it remains one/day.
const COOLDOWN_DAYS = 20 / 24;
const APP_URL = (process.env.APP_URL || 'https://hugowishpax.studio').replace(/\/$/, '');
const heroUrl = () => process.env.MARKETING_EMAIL_HERO_GIF_URL || `${APP_URL}/image/avt7.png`;
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

// 10 chủ đề × 10 cách kể = 100 biến thể. Để trong một catalog thay vì 100
// template copy/paste: cùng chuẩn email, nhưng người nhận không thấy lại một
// lời mời y hệt hôm qua.
const THEMES = [
  ['portfolio', 'Portfolio gọn để bạn tự tin gửi cùng CV.'],
  ['quán nhỏ', 'Một website rõ ràng giúp khách tìm thấy quán dễ hơn.'],
  ['shop nhỏ', 'Shop nhỏ cũng có thể có một nơi bán hàng mang dấu ấn riêng.'],
  ['freelancer', 'Dự án tốt xứng đáng có một nơi để được nhìn thấy.'],
  ['sự kiện', 'Một trang sự kiện gọn giúp lời mời của bạn đi xa hơn.'],
  ['bio cá nhân', 'Bio của bạn có thể là điểm bắt đầu cho câu chuyện lớn hơn.'],
  ['thương hiệu mới', 'Không cần làm quá nhiều ngay từ đầu để có một website tốt.'],
  ['menu online', 'Một menu dễ xem trên điện thoại là điều khách thực sự cần.'],
  ['trang giới thiệu', 'Một trang giới thiệu rõ ràng giúp người phù hợp hiểu bạn nhanh hơn.'],
  ['ý tưởng của bạn', 'Ý tưởng của bạn đáng có một không gian riêng trên web.'],
];
const ANGLES = [
  'Mình có thể cùng bạn bắt đầu từ nhu cầu nhỏ nhất.',
  'Không cần biết kỹ thuật; chỉ cần kể điều bạn muốn người khác thấy.',
  'Hugo sẽ chốt phạm vi rõ ràng trước khi bắt tay vào làm.',
  'Điện thoại là ưu tiên đầu tiên, vì khách của bạn thường xem từ đó.',
  'Bạn có thể mang bản nháp, một ý tưởng, hoặc chỉ một câu hỏi để bắt đầu.',
  'Mỗi phần đều được chọn vì nó hữu ích, không phải để làm website phức tạp hơn.',
  'Trao đổi trực tiếp giúp mọi thứ bớt vòng vo và đúng ý hơn.',
  'Một bước nhỏ hôm nay có thể giúp bạn tự tin giới thiệu mình ngày mai.',
  'Mình luôn ưu tiên cách làm vừa đủ với thời gian và mục tiêu của bạn.',
  'Nếu chưa phải lúc này, bạn vẫn có thể lưu lại ý tưởng cho khi sẵn sàng.',
];
const PALETTES = [
  ['#0071e3', '#e8f3ff'], ['#5856d6', '#efefff'], ['#af52de', '#faefff'], ['#ff2d55', '#fff0f3'], ['#ff9500', '#fff5e8'],
  ['#34c759', '#edfff2'], ['#00a6a6', '#e9fbfb'], ['#0a84ff', '#edf6ff'], ['#5e5ce6', '#f0efff'], ['#bf5af2', '#faf0ff'],
];
const DEFAULT_CONFIG = Object.freeze({ enabled: true, lastRunAt: null, lastSentCount: 0, lastError: '' });

async function lifecycleConfig() {
  const data = await Data.findOne({ userId: 'default' }, 'systemSettings.marketingEmail').lean();
  return { ...DEFAULT_CONFIG, ...(data?.systemSettings?.marketingEmail || {}) };
}

export async function getLifecycleEmailStatus() {
  const [config, optedIn] = await Promise.all([
    lifecycleConfig(),
    UserProfile.countDocuments({ 'marketing.optedInAt': { $ne: null }, 'marketing.optedOutAt': null }),
  ]);
  return { ...config, optedIn, deliveryReady: isEmailDeliverable() };
}

export async function setLifecycleEmailEnabled(enabled) {
  await Data.updateOne(
    { userId: 'default' },
    { $set: { 'systemSettings.marketingEmail.enabled': enabled } },
    { upsert: true },
  );
  return getLifecycleEmailStatus();
}

function dateKey(now) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function variantFor(email, now) {
  const { year, month, day } = dateKey(now);
  const salt = `${email}:${year}-${month}-${day}`;
  const hash = [...salt].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  return hash % 100;
}

function unsubscribeUrl(email) {
  const token = jwt.sign({ email, purpose: 'marketing-unsubscribe' }, JWT_SECRET, { expiresIn: '2y' });
  return `${APP_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

function emailHtml({ name, eyebrow, title, body, cta, href, unsubscribe, palette = PALETTES[0], progressStep = 0 }) {
  const [accent, tint] = palette;
  const completedWidth = `${[34, 67, 100][progressStep] || 34}%`;
  const nextStep = ['Kể nhu cầu của bạn', 'Chọn phạm vi vừa đủ', 'Bắt đầu xây trang web'][progressStep] || 'Kể nhu cầu của bạn';
  return `<!doctype html><html><body style="margin:0;background:#f3f3f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#202124;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(title)} ${escapeHtml(body)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:36px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td style="background:${accent};padding:24px 32px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="color:#fff;font-size:29px;font-weight:800;letter-spacing:-1.2px;vertical-align:middle;">Hugo Studio</td>
            <td width="92" align="right"><img src="${heroUrl()}" alt="Hugo Studio" width="72" height="72" style="display:block;border:0;border-radius:18px;object-fit:cover;background:${tint};"></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:42px 40px 30px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td style="vertical-align:top;padding-right:18px;">
              <p style="margin:0 0 9px;font-size:12px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:${accent};">${eyebrow}</p>
              <h1 style="margin:0;font-size:30px;line-height:1.18;letter-spacing:-.9px;color:#202124;">${title}</h1>
            </td>
            <td width="112" valign="top" align="right"><img src="${heroUrl()}" alt="Minh họa Hugo Studio" width="100" style="display:block;border:0;border-radius:50%;background:${tint};"></td>
          </tr></table>
          <p style="margin:22px 0 0;font-size:17px;line-height:1.52;color:#6b6f76;">Chào ${escapeHtml(name)},<br>${body}</p>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:#e8e8e8;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>
        <tr><td style="padding:32px 40px 12px;text-align:center;">
          <p style="margin:0;font-size:19px;font-weight:750;letter-spacing:-.3px;color:#303238;">Lộ trình cùng Hugo</p>
          <p style="margin:8px 0 22px;font-size:14px;line-height:1.45;color:#85878c;">${nextStep} — từng bước nhỏ, đúng với điều bạn cần.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
            <td width="34" align="center" style="font-size:15px;font-weight:800;color:#fff;background:${accent};border-radius:50%;height:34px;">1</td>
            <td style="padding:0 0 0 0;"><div style="height:8px;background:#ededed;line-height:8px;font-size:1px;"><div style="width:${completedWidth};height:8px;background:${accent};line-height:8px;font-size:1px;">&nbsp;</div></div></td>
            <td width="34" align="center" style="font-size:15px;font-weight:800;color:#8c8f94;background:#ededed;border-radius:50%;height:34px;">3</td>
          </tr></table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;"><tr><td align="left" style="font-size:12px;color:#85878c;">Ý tưởng</td><td align="right" style="font-size:12px;color:#85878c;">Website sẵn sàng</td></tr></table>
        </td></tr>
        <tr><td align="center" style="padding:24px 40px 38px;"><a href="${href}" style="display:inline-block;background:${accent};color:#fff;padding:15px 30px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:750;">${cta}</a></td></tr>
        <tr><td style="padding:22px 32px 30px;background:#fafafa;text-align:center;font-size:12px;line-height:1.55;color:#8b8e93;">Bạn nhận thư này vì đã chọn nhận cập nhật từ Hugo Studio.<br><a href="${unsubscribe}" style="color:#62656a;text-decoration:underline;">Hủy đăng ký</a></td></tr>
      </table>
    </td></tr></table></body></html>`;
}

function campaignFor(profile, now) {
  const inactiveDays = (now - new Date(profile.lastSignalAt)) / DAY;
  const { year, month, day } = dateKey(now);
  const today = `${year}-${month}-${day}`;
  if (!profile.marketing?.lastCampaignAt) return { key: 'welcome', subject: 'Chào mừng bạn đến với Hugo Studio', eyebrow: 'Hugo Studio', title: 'Bắt đầu từ điều bạn đang có.', body: 'Bio, công cụ học tập và các quyền lợi thành viên luôn sẵn sàng để bạn quay lại đúng lúc cần.', cta: 'Khám phá quyền lợi', href: `${APP_URL}/member` };
  const variant = variantFor(profile.email, now);
  const [topic, promise] = THEMES[variant % THEMES.length];
  const angle = ANGLES[Math.floor(variant / THEMES.length)];
  const returning = inactiveDays >= 21 ? ' Mình vẫn giữ chỗ cho hành trình của bạn ở Hugo Studio.' : '';
  return {
    key: `daily-${today}`,
    subject: `Một ý tưởng website cho ${topic} của bạn`,
    eyebrow: `Gợi ý hôm nay · ${variant + 1}/100`,
    title: promise,
    body: `${angle}${returning}`,
    cta: 'Kể nhu cầu của bạn',
    href: `${APP_URL}/contact`,
    palette: PALETTES[Math.floor(variant / THEMES.length)],
    progressStep: variant % 3,
  };
}

export async function runLifecycleEmailJob(now = new Date()) {
  const config = await lifecycleConfig();
  if (!config.enabled) return { scanned: 0, sent: 0, disabled: true };
  if (!isEmailDeliverable()) {
    const error = 'SENDGRID_API_KEY chưa hợp lệ; email đang ở chế độ mô phỏng.';
    await Data.updateOne({ userId: 'default' }, {
      $set: { 'systemSettings.marketingEmail.lastRunAt': now, 'systemSettings.marketingEmail.lastSentCount': 0, 'systemSettings.marketingEmail.lastError': error },
    }, { upsert: true });
    return { scanned: 0, sent: 0, deliveryUnavailable: true, error };
  }
  const cooldown = new Date(now - COOLDOWN_DAYS * DAY);
  const profiles = await UserProfile.find({
    'marketing.optedInAt': { $ne: null },
    'marketing.optedOutAt': null,
    lastSignalAt: { $ne: null },
    $or: [{ 'marketing.lastCampaignAt': null }, { 'marketing.lastCampaignAt': { $lte: cooldown } }],
  }).sort({ lastSignalAt: -1 }).limit(100).lean();
  let sent = 0;
  let simulated = 0;
  try {
    for (const profile of profiles) {
      const campaign = campaignFor(profile, now);
      if (!campaign) continue;
      const bio = await Bio.findOne({ email: profile.email }, 'displayName').lean();
      const result = await sendCustomEmail(profile.email, campaign.subject, emailHtml({
        name: bio?.displayName || 'bạn', ...campaign, unsubscribe: unsubscribeUrl(profile.email),
      }));
      if (result.simulated) {
        simulated += 1;
        continue;
      }
      if (result.success) {
        await UserProfile.updateOne({ _id: profile._id, 'marketing.optedOutAt': null }, {
          $set: { 'marketing.lastCampaignAt': now, 'marketing.lastCampaignKey': campaign.key },
        });
        sent += 1;
      }
    }
    await Data.updateOne({ userId: 'default' }, {
      $set: {
        'systemSettings.marketingEmail.lastRunAt': now,
        'systemSettings.marketingEmail.lastSentCount': sent,
        'systemSettings.marketingEmail.lastError': simulated ? 'SendGrid không chấp nhận một hoặc nhiều email; không người dùng nào bị đánh dấu đã nhận thư.' : '',
      },
    }, { upsert: true });
  } catch (error) {
    await Data.updateOne({ userId: 'default' }, {
      $set: { 'systemSettings.marketingEmail.lastRunAt': now, 'systemSettings.marketingEmail.lastError': error.message.slice(0, 500) },
    }, { upsert: true });
    throw error;
  }
  return { scanned: profiles.length, sent, simulated };
}

export function initLifecycleEmailService() {
  // node-cron được nạp động ở đây để không khởi tạo lịch khi import service.
  import('node-cron').then(({ default: cron }) => cron.schedule('0 10 * * *', () => {
    runLifecycleEmailJob().then(({ sent }) => console.log(`[LifecycleEmail] sent ${sent}`)).catch((e) => console.error('[LifecycleEmail]', e.message));
  }, { timezone: 'Asia/Ho_Chi_Minh' }));
}

export function verifyUnsubscribeToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);
  return payload?.purpose === 'marketing-unsubscribe' && payload.email ? payload.email : null;
}
