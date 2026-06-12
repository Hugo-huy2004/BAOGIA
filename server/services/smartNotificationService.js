import cron from 'node-cron';
import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import SleepLog from '../models/SleepLog.js';
import Bio from '../models/Bio.js';
import CompanionHistory from '../models/CompanionHistory.js';

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

// Duolingo-style push windows (VN timezone)
const SCHEDULES = {
  sleep_reminder: '0 21 * * *',    // 21:00 — sleep reminder
  wake_check:     '0 7  * * *',    // 07:00 — good morning check
  wellness_noon:  '0 12 * * *',    // 12:00 — midday wellness nudge
  streak_check:   '0 19 * * *',    // 19:00 — streak protect before evening
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

  console.log('✅ SmartNotification service initialized (sleep_reminder 21h, wake 7h, wellness 12h, streak 19h)');
}

export async function triggerSmartPushNow(contextHint = 'wellness_nudge') {
  await runSmartPushJob(contextHint);
}
