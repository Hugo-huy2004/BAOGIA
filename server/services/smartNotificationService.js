import cron from 'node-cron';
import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import SleepLog from '../models/SleepLog.js';
import Bio from '../models/Bio.js';
import CompanionHistory from '../models/CompanionHistory.js';
import ScheduledPush from '../models/ScheduledPush.js';
import InAppNotification from '../models/InAppNotification.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// Duolingo-style push windows (VN timezone)
const SCHEDULES = {
  sleep_reminder: '0 21 * * *',    // 21:00 — sleep reminder
  wake_check:     '0 7  * * *',    // 07:00 — good morning check
  wellness_noon:  '0 12 * * *',    // 12:00 — midday wellness nudge
  streak_check:   '0 19 * * *',    // 19:00 — streak protect before evening
  skincare_morning: '0 8 * * *',   // 08:00 — skincare morning nudge
  skincare_night:   '30 21 * * *', // 21:30 — skincare evening nudge
};

async function sendPushToUser(subs, payload) {
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await NotificationSubscription.deleteOne({ _id: sub._id });
      }
    }
  }
}

async function runSkincareReminders(timeOfDay) {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[new Date().getDay()];

  const bios = await Bio.find({ skincareReminderEnabled: true }).lean();
  if (!bios.length) return;

  for (const bio of bios) {
    try {
      const email = bio.email;
      const plan = bio.skinAnalysis?.plan;
      if (!plan || !plan[todayName]) continue;

      const steps = timeOfDay === 'morning' ? plan[todayName].morning : plan[todayName].night;
      if (!steps || !steps.length) continue;

      const title = timeOfDay === 'morning' ? '✨ HugoSkin: Skincare Buổi Sáng!' : '🌙 HugoSkin: Skincare Buổi Tối!';
      const body = `Hôm nay là ${todayName}. Liệu trình dưỡng da của bạn gồm: ${steps.join(', ')}. Hãy bắt đầu ngay nhé!`;

      // 1. Tạo In-App Notification
      await InAppNotification.create({
        email,
        type: 'inbox',
        category: 'system',
        title,
        message: body,
        actionUrl: '/member/portal?tab=utilities&sub=hugoskin'
      });

      // 2. Gửi Web Push
      const subs = await NotificationSubscription.find({ email });
      if (subs.length) {
        await sendPushToUser(subs, {
          title,
          body,
          icon: '/image/avt7.png',
          badge: '/image/badge.png',
          url: '/member/portal?tab=utilities&sub=hugoskin',
          tag: 'skincare_reminder'
        });
      }
    } catch (err) {
      console.error(`[SkincareReminder] Lỗi gửi nhắc nhở cho ${bio.email}:`, err.message);
    }
  }
}

async function runScheduledCompanionPushes() {
  const now = new Date();
  const pending = await ScheduledPush.find({
    scheduledFor: { $lte: now },
    sent: false
  });
  if (!pending.length) return;

  for (const item of pending) {
    try {
      const bio = await Bio.findOne({ email: item.email }).lean();
      const response = await fetch(`${PYTHON_AI_URL}/api/notifications/companion-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio || {},
          feature_label: item.label
        }),
      });

      if (!response.ok) continue;
      const aiResult = await response.json();

      const subs = await NotificationSubscription.find({ email: item.email });
      if (subs.length) {
        await sendPushToUser(subs, {
          title: aiResult.title || 'Bạn Học Đường',
          body:  aiResult.body  || 'Gợi ý trị liệu hôm nay dành cho bạn!',
          icon:  '/image/avt7.png',
          badge: '/image/badge.png',
          url:   aiResult.url  || '/member/portal?tab=banhocduong',
          tag:   'companion_push',
        });
      }

      // Tạo thêm thông báo trong hộp thư (In-App)
      await InAppNotification.create({
        email: item.email,
        type: 'inbox',
        category: 'system',
        title: aiResult.title || 'Bạn Học Đường Trị Liệu',
        message: aiResult.body || 'Lời khuyên chăm sóc sức khỏe tinh thần dành cho bạn!',
        actionUrl: aiResult.url || '/member/portal?tab=banhocduong'
      });

      item.sent = true;
      await item.save();
    } catch (err) {
      console.error(`[CompanionPush] Lỗi xử lý gửi tin cho ${item.email}:`, err.message);
    }
  }
}

async function runSmartPushJob(contextHint) {
  const subscriptions = await NotificationSubscription.find({});
  if (!subscriptions.length) return;

  // Group by email
  const emailMap = new Map();
  for (const sub of subscriptions) {
    if (!emailMap.has(sub.email)) emailMap.set(sub.email, []);
    emailMap.get(sub.email).push(sub);
  }

  for (const [email, subs] of emailMap.entries()) {
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
        }),
      });

      if (!response.ok) continue;

      const aiResult = await response.json();
      if (!aiResult?.should_send) continue;

      await sendPushToUser(subs, {
        title: aiResult.title || 'Bạn Học Đường',
        body:  aiResult.body  || 'Cậu ơi, mình có điều muốn chia sẻ!',
        icon:  '/image/avt7.png',
        badge: '/image/badge.png',
        url:   aiResult.url  || '/member/portal?tab=banhocduong',
        tag:   aiResult.type || 'smart_push',
      });
    } catch (err) {
      console.error(`[SmartPush] Error for ${email}:`, err.message);
    }
  }
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

  // Nhắc nhở skincare buổi sáng (08:00)
  cron.schedule(SCHEDULES.skincare_morning, () => {
    runSkincareReminders('morning').catch(console.error);
  }, tz);

  // Nhắc nhở skincare buổi tối (21:30)
  cron.schedule(SCHEDULES.skincare_night, () => {
    runSkincareReminders('night').catch(console.error);
  }, tz);

  console.log('SmartNotification service initialized (sleep_reminder 21h, wake 7h, wellness 12h, streak 19h, companion_push 10min, skincare 8h/21h30)');
}

export async function triggerSmartPushNow(contextHint = 'wellness_nudge') {
  await runSmartPushJob(contextHint);
}

export { runScheduledCompanionPushes };
