import cron from 'node-cron';
import NotificationSubscription from '../models/NotificationSubscription.js';
import SleepLog from '../models/SleepLog.js';
import Bio from '../models/Bio.js';
import CompanionHistory from '../models/CompanionHistory.js';
import ScheduledPush from '../models/ScheduledPush.js';
import InAppNotification from '../models/InAppNotification.js';
import { sendPushToUser, isQuietHours, askPushAI } from './pushGuard.js';
import { notificationLanguage, renderNotification } from '../../shared/notificationText.js';

// Khung giờ vàng (giờ VN) — khớp PRIME_SLOTS trong pushGuard. 15:30 là của
// proactivePushService. Giữa hai mốc liền nhau luôn ≥ 2 giờ 30, rộng hơn khoảng
// chờ 90 phút, nên các job không đạp nhau.
const SCHEDULES = {
  wake_check:     '30 7 * * *',   // 07:30 — vừa dậy, đang trên đường đi học/làm
  wellness_noon:  '15 12 * * *',  // 12:15 — nghỉ trưa, lướt điện thoại nhiều nhất
  streak_check:   '30 18 * * *',  // 18:30 — tan tầm, còn đủ giờ giữ chuỗi ngày
  sleep_reminder: '0 21 * * *',   // 21:00 — trước giờ yên lặng 22:00
};

// Câu soạn sẵn cho từng mốc — dùng khi AI hỏng hoặc chê không đáng gửi, để
// không mốc nào trôi qua im lặng.
const CONTEXT_KEY = {
  wake_cheer: 'push.wake',
  wellness_nudge: 'push.noon',
  streak_protect: 'push.streak',
  sleep_reminder: 'push.sleep',
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

      const language = languageOf(subs);
      const ai = await askPushAI('/api/notifications/smart-push', {
        bio: bio || {},
        sleepLogs: sleepData || [],
        historyLogs: (history?.historyLogs || []).slice(-15),
        streak,
        lastCheckin,
        pendingActions: [contextHint],
        language,
      });

      // Mốc nào cũng gửi: AI viết được và thấy đáng gửi thì dùng chữ của AI (cá
      // nhân hoá), còn lại dùng câu soạn sẵn của đúng mốc giờ đó.
      const aiResult = ai?.should_send && ai.title ? ai : {};
      const fallback = renderNotification(CONTEXT_KEY[contextHint] || 'event.wellnessNudge', {}, language);
      await sendPushToUser(email, subs, {
        title: aiResult.title || fallback.title,
        body:  aiResult.body  || fallback.message,
        icon:  '/image/avt7.png',
        badge: '/image/badge.png',
        url:   aiResult.url  || '/member/utilities/psychology',
        tag:   contextHint,
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

  console.log('SmartNotification service initialized (wake 7:30, noon 12:15, streak 18:30, sleep 21:00, queue 10min)');
}

export async function triggerSmartPushNow(contextHint = 'wellness_nudge') {
  await runSmartPushJob(contextHint);
}

export { runScheduledCompanionPushes };
