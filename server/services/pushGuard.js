import webpush from 'web-push';
import Bio from '../models/Bio.js';
import NotificationSubscription from '../models/NotificationSubscription.js';

// Shared by every push cron (proactive, smart, skincare, scheduled companion)
// so a sleepy/insomniac user never gets woken up by a "mindless" reminder,
// and doesn't get stacked notifications from unrelated jobs firing close
// together on the same day.

const QUIET_HOUR_START = 22; // 22:00 — from here until QUIET_HOUR_END, no pushes go out
const QUIET_HOUR_END = 7;    // 07:00
const MIN_PUSH_GAP_MS = 3 * 60 * 60 * 1000; // don't push the same user twice within 3h, regardless of which job

function hourInVN(date = new Date()) {
  return parseInt(
    date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hour12: false }),
    10
  );
}

export function isQuietHours(date = new Date()) {
  const h = hourInVN(date);
  return h >= QUIET_HOUR_START || h < QUIET_HOUR_END;
}

// Rolls a target send time out of quiet hours — used when *scheduling* a
// future push (e.g. "remind in 24h") so it never lands at 2am in the first
// place, rather than silently sitting until the next cron tick after 07:00.
export function nextAllowedSendTime(date = new Date()) {
  if (!isQuietHours(date)) return date;
  const h = hourInVN(date);
  const rolled = new Date(date);
  if (h >= QUIET_HOUR_START) rolled.setDate(rolled.getDate() + 1);
  rolled.setHours(8, 0, 0, 0); // 08:00 local — a bit after quiet hours end, avoids piling up right on 07:00 wake_check
  return rolled;
}

// Single choke point for actually delivering a push: quiet-hours + per-user
// cooldown gate, then send + record. Returns true if it sent, false if held back.
export async function sendPushToUser(email, subs, payload) {
  if (isQuietHours()) return false;
  if (!subs || !subs.length) return false;

  const bio = await Bio.findOne({ email }, { lastPushSentAt: 1 }).lean();
  const last = bio?.lastPushSentAt ? new Date(bio.lastPushSentAt).getTime() : 0;
  if (Date.now() - last < MIN_PUSH_GAP_MS) return false;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await NotificationSubscription.deleteOne({ _id: sub._id });
      }
    }
  }
  await Bio.updateOne({ email }, { $set: { lastPushSentAt: new Date() } });
  return true;
}
