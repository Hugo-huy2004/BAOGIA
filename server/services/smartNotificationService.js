import cron from 'node-cron';
import NotificationSubscription from '../models/NotificationSubscription.js';
import SleepLog from '../models/SleepLog.js';
import Bio from '../models/Bio.js';
import CompanionHistory from '../models/CompanionHistory.js';
import ScheduledPush from '../models/ScheduledPush.js';
import InAppNotification from '../models/InAppNotification.js';
import MemberActivity from '../models/MemberActivity.js';
import { sendPushToUser, isQuietHours, askPushAI, PRIME_SLOTS } from './pushGuard.js';
import { planPush } from './memberActivity.js';
import { notificationLanguage } from '../../shared/notificationText.js';
import { renderNotification } from '../../shared/pushText.js';

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

async function runScheduledCompanionPushes() {
  const now = new Date();
  const pending = await ScheduledPush.find({
    scheduledFor: { $lte: now },
    sent: false
  });
  if (!pending.length) return;

  for (const item of pending) {
    // Quiet hours: skip the whole iteration (no AI call, no push, no in-app
    // record) — item stays unsent and the next 10-min tick retries it, so it
    // naturally lands once quiet hours pass instead of firing overnight.
    if (isQuietHours()) continue;
    try {
      const subs = await NotificationSubscription.find({ email: item.email }).lean();
      // Push đã soạn sẵn, bị pushGuard giữ lại chờ khung giờ vàng: tới lượt thì
      // gửi nguyên văn, không xét khoảng chờ nữa.
      if (item.payload) {
        if (await sendPushToUser(item.email, subs, item.payload, { force: true }) !== 'queued') {
          item.sent = true;
          await item.save();
        }
        continue;
      }
      const bio = await Bio.findOne({ email: item.email }).lean();
      // Thiết bị lấy TRƯỚC khi gọi AI: ngôn ngữ của người nhận là đầu vào của
      // prompt, không phải thứ chọn sau khi đã có chữ. AI hỏng thì vẫn gửi câu
      // dự phòng — trước đây AI hỏng là bỏ qua, và lần sau lại hỏng.
      const aiResult = await askPushAI('/api/notifications/companion-push', {
        bio: bio || {},
        feature_label: item.label,
        language: languageOf(subs),
      }) || {};

      // Cooldown only suppresses the OS push (avoids stacking with another
      // job's notification) — the in-app inbox record below still lands.
      // Câu dự phòng khi AI không trả về gì cũng phải đúng ngôn ngữ người
      // nhận — nếu không thì mọi lần AI hỏng là một lần rơi về tiếng Việt.
      const fallback = renderNotification('event.wellnessNudge', {}, languageOf(subs));
      if (subs.length) {
        await sendPushToUser(item.email, subs, {
          title: aiResult.title || fallback.title,
          body:  aiResult.body  || fallback.message,
          icon:  '/image/avt7.png',
          badge: '/image/badge.png',
          url:   aiResult.url  || '/member/utilities/psychology',
          tag:   'companion_push',
        });
      }

      // Tạo thêm thông báo trong hộp thư (In-App)
      await InAppNotification.create({
        email: item.email,
        type: 'info',
        category: 'wellness',
        title: aiResult.title || fallback.title,
        message: aiResult.body || fallback.message,
        actionUrl: aiResult.url || '/member/utilities/psychology'
      });

      item.sent = true;
      await item.save();
    } catch (err) {
      console.error(`[CompanionPush] Lỗi xử lý gửi tin cho ${item.email}:`, err.message);
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
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const [activities, unreadRows, sleepers] = await Promise.all([
    MemberActivity.find({ email: { $in: emails } }).lean(),
    InAppNotification.aggregate([{ $match: { email: { $in: emails }, read: false } }, { $group: { _id: '$email', n: { $sum: 1 } } }]),
    SleepLog.distinct('email', { email: { $in: emails }, date: { $gte: weekAgo } }),
  ]);
  const activityOf = new Map(activities.map((a) => [a.email, a]));
  const unreadOf = new Map(unreadRows.map((r) => [r._id, r.n]));
  const sleeperSet = new Set(sleepers);

  await pMap([...emailMap.entries()], 5, async ([email, subs]) => {
    try {
      const plan = planPush(activityOf.get(email), slot, { unread: unreadOf.get(email) || 0, sleepTracker: sleeperSet.has(email) });
      if (!plan) return;
      const language = languageOf(subs);
      const text = renderNotification(plan.key, plan.params || {}, language);

      // Câu hỏi thăm chung để AI viết riêng theo nhật ký; các tình huống cụ thể
      // (chưa đọc, lâu không ghé, giữ chuỗi) dùng câu soạn sẵn có số liệu thật.
      let ai = null;
      if (plan.ai) {
        const [bio, sleepData, history] = await Promise.all([
          Bio.findOne({ email }).lean(),
          SleepLog.find({ email }).sort({ date: -1 }).limit(14).lean(),
          CompanionHistory.findOne({ email }).lean(),
        ]);
        const logs = history?.historyLogs || [];
        ai = await askPushAI('/api/notifications/smart-push', {
          bio: bio || {},
          sleepLogs: sleepData || [],
          historyLogs: logs.slice(-15),
          streak: computeStreak(logs),
          lastCheckin: logs.slice(-1)[0]?.date || null,
          pendingActions: [plan.key],
          language,
        });
        if (!(ai?.should_send && ai.title)) ai = null;
      }

      await sendPushToUser(email, subs, {
        title: ai?.title || text.title,
        body: ai?.body || text.message,
        icon: '/image/avt7.png',
        badge: '/image/badge.png',
        url: ai?.url || plan.url,
        tag: plan.tag,
      });
    } catch (err) {
      console.error(`[ContextPush] Error for ${email}:`, err.message);
    }
  });
}

/** Compute consecutive active days (streak) from historyLogs */
function computeStreak(logs) {
  if (!logs.length) return 0;
  const days = new Set(logs.map(l => l.date?.slice(0, 10)).filter(Boolean));
  let streak = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function initSmartNotificationService() {
  const tz = { timezone: 'Asia/Ho_Chi_Minh' };
  PRIME_SLOTS.forEach(([h, m], slot) => {
    cron.schedule(`${m} ${h} * * *`, () => { runContextPushJob(slot).catch(console.error); }, tz);
  });

  // Quét các thông báo đẩy AI lập lịch sau 24h (chạy mỗi 10 phút)
  cron.schedule('*/10 * * * *', () => {
    runScheduledCompanionPushes().catch(console.error);
  }, tz);

  console.log('SmartNotification service initialized (context push at each prime slot, queue 10min)');
}

export { runScheduledCompanionPushes };
