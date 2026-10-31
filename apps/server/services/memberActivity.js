import MemberActivity from '../models/MemberActivity.js';
import { PRIME_SLOTS } from './pushGuard.js';

/**
 * Bộ theo dõi tương tác của thành viên — đọc từ chính các lượt gọi API, client
 * không phải gửi gì thêm.
 *
 * requireMember gọi touchActivity mỗi request; mỗi (người, khu API) chỉ ghi DB
 * một lần mỗi 10 phút, nên "hours" đếm số khối 10 phút có hoạt động chứ không
 * đếm request. Mở app trong 2 giờ sau một push = đã đáp lại push đó.
 */
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const VN_OFFSET_MS = 7 * HOUR;
const THROTTLE_MS = 10 * 60 * 1000;
const ANSWER_WINDOW_MS = 2 * HOUR;

// ponytail: bộ đếm trong RAM, khởi động lại thì ghi thêm một lượt — chấp nhận được.
const lastWrite = new Map();

const vnParts = (date = new Date()) => {
  const vn = new Date(date.getTime() + VN_OFFSET_MS);
  return { hour: vn.getUTCHours(), day: vn.toISOString().slice(0, 10) };
};

export function touchActivity(email, path = '') {
  if (!email) return;
  const area = /^\/api\/([a-z][a-z0-9-]{0,23})/.exec(path)?.[1] || 'other';
  const key = `${email}|${area}`;
  const now = new Date();
  if (now - (lastWrite.get(key) || 0) < THROTTLE_MS) return;
  if (lastWrite.size > 50_000) lastWrite.clear();
  lastWrite.set(key, now.getTime());

  const { hour, day } = vnParts(now);
  const answered = { $and: [
    { $gt: ['$push.lastSentAt', new Date(now - ANSWER_WINDOW_MS)] },
    { $lt: [{ $ifNull: ['$lastActiveAt', new Date(0)] }, '$push.lastSentAt'] },
  ] };
  MemberActivity.updateOne({ email }, [{ $set: {
    [`hours.${hour}`]: { $add: [{ $ifNull: [`$hours.${hour}`, 0] }, 1] },
    [`apps.${area}`]: { $add: [{ $ifNull: [`$apps.${area}`, 0] }, 1] },
    days: { $slice: [{ $concatArrays: [{ $filter: { input: { $ifNull: ['$days', []] }, cond: { $ne: ['$$this', day] } } }, [day]] }, -30] },
    'push.opened': { $add: [{ $ifNull: ['$push.opened', 0] }, { $cond: [answered, 1, 0] }] },
    'push.ignored': { $cond: [answered, 0, { $ifNull: ['$push.ignored', 0] }] },
    lastActiveAt: now,
  } }], { upsert: true }).catch(() => {}); // theo dõi hỏng không được làm hỏng request
}

export function markPushSent(email) {
  return MemberActivity.updateOne(
    { email },
    { $inc: { 'push.sent': 1, 'push.ignored': 1 }, $set: { 'push.lastSentAt': new Date() } },
    { upsert: true },
  ).catch(() => {});
}

/** Khung giờ vàng người này hay mở app nhất (chỉ số trong PRIME_SLOTS), hoặc null khi chưa đủ dữ liệu. */
export function favouriteSlot(hours = {}) {
  const total = Object.values(hours).reduce((a, b) => a + b, 0);
  if (total < 6) return null;
  const weight = ([h]) => [h - 1, h, h + 1, h + 2].reduce((sum, x) => sum + (hours[(x + 24) % 24] || 0), 0);
  return PRIME_SLOTS.reduce((best, slot, i) => (weight(slot) > weight(PRIME_SLOTS[best]) ? i : best), 0);
}

// Khu API → màn đáng quay lại. Khu không có ở đây (thông báo, đăng nhập…) không
// tính là "app hay dùng".
const AREA_URL = {
  today: '/member/today',
  arcade: '/member/utilities/arcade',
  chess: '/member/utilities/arcade_chess',
  companion: '/member/utilities/psychology',
  checkin: '/member/utilities/psychology',
  sleep: '/member/utilities/psychology',
  hugoteam: '/member/utilities/team',
  bios: '/member/utilities/bio',
  profile: '/member/utilities/bio',
  joy: '/member/utilities/joy_wallet',
};

export function favouriteUrl(apps = {}) {
  const [area] = Object.entries(apps).filter(([a]) => AREA_URL[a]).sort((x, y) => y[1] - x[1])[0] || [];
  return AREA_URL[area] || '/member/today';
}

const DEFAULT_SLOT = 3; // 18:30 — người mới chưa có thói quen thì nhắc lúc rảnh nhất
const SLOT_KEY = ['push.wake', 'push.noon', 'push.checkin', 'push.streak', 'push.sleep'];

/**
 * Quyết định push cho MỘT người ở khung giờ `slot`: trả { key, params, url, tag }
 * hoặc null (không gửi). Mỗi người tối đa một push ngữ cảnh mỗi ngày, vào giờ
 * họ hay dùng app; ai lờ push liên tục thì gửi thưa dần.
 */
export function planPush(activity, slot, { unread = 0, sleepTracker = false, now = new Date() } = {}) {
  const last = activity?.lastActiveAt ? new Date(activity.lastActiveAt) : null;
  if (last && now - last < 30 * 60 * 1000) return null; // đang mở app rồi
  const ignored = activity?.push?.ignored || 0;
  const lastSent = activity?.push?.lastSentAt ? now - new Date(activity.push.lastSentAt) : Infinity;
  if (ignored >= 6 && lastSent < 7 * DAY) return null;
  if (ignored >= 3 && lastSent < 3 * DAY) return null;
  if (lastSent < 20 * HOUR) return null;

  // Người tự theo dõi giấc ngủ vẫn được nhắc ngủ lúc 21:00 dù giờ quen là giờ khác.
  const isSleepSlot = slot === PRIME_SLOTS.length - 1;
  if (sleepTracker && isSleepSlot) return { key: 'push.sleep', url: '/member/utilities/psychology', tag: 'sleep' };
  if (slot !== (favouriteSlot(activity?.hours) ?? DEFAULT_SLOT)) return null;

  // Kéo người ta về đúng app họ thích nhất — một cú chạm là vào việc đang dở,
  // không phải mở trang chủ rồi tự tìm.
  const home = favouriteUrl(activity?.apps);
  const idle = last ? Math.floor((now - last) / DAY) : null;
  if (idle != null && idle >= 7) return { key: 'push.winback', url: '/member/today', tag: 'winback' };
  if (idle != null && idle >= 2) return { key: 'push.missYou', params: { days: idle }, url: home, tag: 'miss-you' };
  if (unread >= 2) return { key: 'push.unread', params: { count: unread }, url: '/member/activity', tag: 'unread' };
  const { day } = vnParts(now);
  const yesterday = vnParts(new Date(now - DAY)).day;
  const days = activity?.days || [];
  if (slot >= 3 && days.includes(yesterday) && !days.includes(day)) return { key: 'push.streak', url: home, tag: 'streak' };
  return { key: SLOT_KEY[slot], url: '/member/utilities/psychology', tag: 'checkin', ai: true };
}
