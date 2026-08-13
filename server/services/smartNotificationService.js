import cron from 'node-cron';
import NotificationSubscription from '../models/NotificationSubscription.js';
import SleepLog from '../models/SleepLog.js';
import Bio from '../models/Bio.js';
import CompanionHistory from '../models/CompanionHistory.js';
import ScheduledPush from '../models/ScheduledPush.js';
import InAppNotification from '../models/InAppNotification.js';
import { sendPushToUser, isQuietHours } from './pushGuard.js';
import { notificationLanguage, renderNotification } from '../../shared/notificationText.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// Duolingo-style push windows (VN timezone)
const SCHEDULES = {
  sleep_reminder: '0 21 * * *',    // 21:00 — sleep reminder
  wake_check:     '0 7  * * *',    // 07:00 — good morning check
  wellness_noon:  '0 12 * * *',    // 12:00 — midday wellness nudge
  streak_check:   '0 19 * * *',    // 19:00 — streak protect before evening
};

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
      const bio = await Bio.findOne({ email: item.email }).lean();
      // Lấy thiết bị TRƯỚC khi gọi AI: ngôn ngữ của người nhận là đầu vào của
      // prompt, không phải thứ chọn sau khi đã có chữ.
      const subs = await NotificationSubscription.find({ email: item.email }).lean();
      const response = await fetch(`${PYTHON_AI_URL}/api/notifications/companion-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio || {},
          feature_label: item.label,
          language: languageOf(subs)
        }),
      });

      if (!response.ok) continue;
      const aiResult = await response.json();

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

async function runSmartPushJob(contextHint) {
  const subscriptions = await NotificationSubscription.find({}).lean();
  if (!subscriptions.length) return;

  // Group by email
  const emailMap = new Map();
  for (const sub of subscriptions) {
    if (!emailMap.has(sub.email)) emailMap.set(sub.email, []);
    emailMap.get(sub.email).push(sub);
  }

  const entries = Array.from(emailMap.entries());

  await pMap(entries, 5, async ([email, subs]) => {
    try {
      const [bio, sleepData, history] = await Promise.all([
        Bio.findOne({ email }).lean(),
        SleepLog.find({ email }).sort({ date: -1 }).limit(14).lean(),
        CompanionHistory.findOne({ email }).lean(),
      ]);

      const streak = computeStreak(history?.historyLogs || []);
      const lastCheckin = history?.historyLogs?.slice(-1)[0]?.date || null;

      const response = await fetch(`${PYTHON_AI_URL}/api/notifications/smart-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio || {},
          sleepLogs: sleepData || [],
          historyLogs: (history?.historyLogs || []).slice(-15),
          streak,
          lastCheckin,
          pendingActions: [contextHint],
          language: languageOf(subs),
        }),
      });

      if (!response.ok) return;

      const aiResult = await response.json();
      if (!aiResult?.should_send) return;

      const fallback = renderNotification('event.wellnessNudge', {}, languageOf(subs));
      await sendPushToUser(email, subs, {
        title: aiResult.title || fallback.title,
        body:  aiResult.body  || fallback.message,
        icon:  '/image/avt7.png',
        badge: '/image/badge.png',
        url:   aiResult.url  || '/member/utilities/psychology',
        tag:   aiResult.type || 'smart_push',
      });
    } catch (err) {
      console.error(`[SmartPush] Error for ${email}:`, err.message);
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

  cron.schedule(SCHEDULES.sleep_reminder, () => {
    runSmartPushJob('sleep_reminder').catch(console.error);
  }, tz);

  cron.schedule(SCHEDULES.wake_check, () => {
    runSmartPushJob('wake_cheer').catch(console.error);
  }, tz);

  cron.schedule(SCHEDULES.wellness_noon, () => {
    runSmartPushJob('wellness_nudge').catch(console.error);
  }, tz);

  cron.schedule(SCHEDULES.streak_check, () => {
    runSmartPushJob('streak_protect').catch(console.error);
  }, tz);

  // Quét các thông báo đẩy AI lập lịch sau 24h (chạy mỗi 10 phút)
  cron.schedule('*/10 * * * *', () => {
    runScheduledCompanionPushes().catch(console.error);
  }, tz);

  console.log('SmartNotification service initialized (sleep_reminder 21h, wake 7h, wellness 12h, streak 19h, companion_push 10min)');
}

export async function triggerSmartPushNow(contextHint = 'wellness_nudge') {
  await runSmartPushJob(contextHint);
}

export { runScheduledCompanionPushes };
