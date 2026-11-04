import cron from 'node-cron';
import NotificationSubscription from '../models/NotificationSubscription.js';
import ScheduledPush from '../models/ScheduledPush.js';
import InAppNotification from '../models/InAppNotification.js';
import MemberActivity from '../models/MemberActivity.js';
import { sendPushToUser, isQuietHours, PRIME_SLOTS } from './pushGuard.js';
import { planPush } from './memberActivity.js';
import { notificationLanguage } from '../../../packages/shared/notificationText.js';
import { renderNotification } from '../../../packages/shared/pushText.js';

// Mỗi khung giờ vàng (PRIME_SLOTS) chạy một lượt; planPush quyết định với từng
// người có gửi không và gửi gì. Trước 31/10 cả 5 mốc đều phát cùng một câu cho
// mọi người — người nhận 5 push/ngày bất kể họ dùng app thế nào.
/**
 * Ngôn ngữ để AI viết thông báo: lấy từ thiết bị đã đăng ký push gần nhất.
 * Không có thiết bị nào thì rơi về tiếng Việt.
 */
function languageOf(subscriptions = []) {
  const newest = [...subscriptions].sort(
    (a, b) => new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0),
  )[0];
  return notificationLanguage(newest?.device?.locale);
}

async function pMap(items, limit, fn) {
  const results = [];
  const executing = new Set();
  for (const item of items) {
    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

// Push đã soạn sẵn mà pushGuard giữ lại chờ khung giờ vàng: tới lượt thì gửi nguyên văn.
async function runHeldPushes() {
  if (isQuietHours()) return;
  const pending = await ScheduledPush.find({ scheduledFor: { $lte: new Date() }, sent: false, payload: { $ne: null } });
  for (const item of pending) {
    try {
      const subs = await NotificationSubscription.find({ email: item.email }).lean();
      if (await sendPushToUser(item.email, subs, item.payload, { force: true }) !== 'queued') {
        item.sent = true;
        await item.save();
      }
    } catch (err) {
      console.error(`[HeldPush] ${item.email}:`, err.message);
    }
  }
}

async function runContextPushJob(slot) {
  const subscriptions = await NotificationSubscription.find({}).lean();
  if (!subscriptions.length) return;

  const emailMap = new Map();
  for (const sub of subscriptions) {
    if (!emailMap.has(sub.email)) emailMap.set(sub.email, []);
    emailMap.get(sub.email).push(sub);
  }
  const emails = [...emailMap.keys()];
  const [activities, unreadRows] = await Promise.all([
    MemberActivity.find({ email: { $in: emails } }).lean(),
    InAppNotification.aggregate([{ $match: { email: { $in: emails }, read: false } }, { $group: { _id: '$email', n: { $sum: 1 } } }]),
  ]);
  const activityOf = new Map(activities.map((a) => [a.email, a]));
  const unreadOf = new Map(unreadRows.map((r) => [r._id, r.n]));

  await pMap([...emailMap.entries()], 5, async ([email, subs]) => {
    try {
      const plan = planPush(activityOf.get(email), slot, { unread: unreadOf.get(email) || 0 });
      if (!plan) return;
      const language = languageOf(subs);
      const text = renderNotification(plan.key, plan.params || {}, language);

      await sendPushToUser(email, subs, {
        title: text.title,
        body: text.message,
        icon: '/image/avt7.png',
        badge: '/image/badge.png',
        url: plan.url,
        tag: plan.tag,
      });
    } catch (err) {
      console.error(`[ContextPush] Error for ${email}:`, err.message);
    }
  });
}

export function initSmartNotificationService() {
  const tz = { timezone: 'Asia/Ho_Chi_Minh' };
  PRIME_SLOTS.forEach(([h, m], slot) => {
    cron.schedule(`${m} ${h} * * *`, () => { runContextPushJob(slot).catch(console.error); }, tz);
  });

  // Gửi các push bị giữ lại vì giờ yên lặng (chạy mỗi 10 phút)
  cron.schedule('*/10 * * * *', () => {
    runHeldPushes().catch(console.error);
  }, tz);

  console.log('SmartNotification service initialized (context push at each prime slot, queue 10min)');
}

export { runHeldPushes };
