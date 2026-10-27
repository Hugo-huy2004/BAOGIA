import webpush from 'web-push';
import Bio from '../models/Bio.js';
import NotificationSubscription from '../models/NotificationSubscription.js';
import ScheduledPush from '../models/ScheduledPush.js';

// Shared by every push cron (proactive, smart, scheduled companion)
// so a sleepy/insomniac user never gets woken up by a "mindless" reminder,
// and doesn't get stacked notifications from unrelated jobs firing close
// together on the same day.
//
// 26/10/2026: thông báo bị giữ lại KHÔNG còn bị bỏ — trước đây rơi vào giờ yên
// lặng hay khoảng chờ là mất hẳn. Giờ nó được xếp hàng tới khung giờ vàng kế
// tiếp. Thông báo hệ thống (biến động JOY) không đi qua đây: pushNotifier gửi
// ngay, mọi giờ.

const QUIET_HOUR_START = 22; // 22:00 — from here until QUIET_HOUR_END, no pushes go out
const QUIET_HOUR_END = 7;    // 07:00
const MIN_PUSH_GAP_MS = 90 * 60 * 1000; // hai push tiếp thị cùng người cách nhau ít nhất 90 phút
const VN_OFFSET_MS = 7 * 60 * 60 * 1000; // Việt Nam không có giờ mùa hè — UTC+7 cố định

// Khung giờ vàng (giờ VN), theo nhịp sinh hoạt: dậy & đi làm, nghỉ trưa, uể oải
// giữa chiều, tan tầm, trước giờ ngủ. Cron trong smart/proactive chạy đúng các
// mốc này; push bị giữ lại cũng chỉ được gửi lại vào đây.
export const PRIME_SLOTS = [[7, 30], [12, 15], [15, 30], [18, 30], [21, 0]];

const AI_SERVER_URL = process.env.AI_SERVER_URL || process.env.PYTHON_AI_URL || 'http://localhost:8000';

/**
 * Gọi Python soạn chữ cho push. Python chỉ nhận request có X-Internal-Key và
 * nằm ở AI_SERVER_URL — hai service push cũ đọc PYTHON_AI_URL (không có trên
 * prod) và không gửi khoá, nên trên prod chưa push AI nào từng đi được.
 * Hỏng thì trả null để nơi gọi dùng câu soạn sẵn — push vẫn đi.
 */
export async function askPushAI(path, body) {
  try {
    const res = await fetch(`${AI_SERVER_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Key': process.env.INTERNAL_API_KEY || '' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function hourInVN(date = new Date()) {
  return new Date(date.getTime() + VN_OFFSET_MS).getUTCHours();
}

export function isQuietHours(date = new Date()) {
  const h = hourInVN(date);
  return h >= QUIET_HOUR_START || h < QUIET_HOUR_END;
}

/** Khung giờ vàng đầu tiên SAU `after`. */
function nextPrimeSlot(after = new Date()) {
  const vn = new Date(after.getTime() + VN_OFFSET_MS);
  for (let day = 0; day < 2; day += 1) {
    for (const [h, m] of PRIME_SLOTS) {
      const t = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate() + day, h, m) - VN_OFFSET_MS;
      if (t > after.getTime()) return new Date(t);
    }
  }
  return new Date(after.getTime() + 24 * 60 * 60 * 1000); // không xảy ra — PRIME_SLOTS khác rỗng
}

// Rolls a target send time out of quiet hours — used when *scheduling* a
// future push (e.g. "remind in 24h") so it never lands at 2am in the first
// place.
export function nextAllowedSendTime(date = new Date()) {
  return isQuietHours(date) ? nextPrimeSlot(date) : date;
}

async function deliver(email, subs, payload) {
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, JSON.stringify(payload), { urgency: 'normal', TTL: 12 * 3600 });
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await NotificationSubscription.deleteOne({ _id: sub._id });
      }
    }
  }
  await Bio.updateOne({ email }, { $set: { lastPushSentAt: new Date() } });
}

/**
 * Cửa duy nhất gửi push tiếp thị. Đúng giờ thì gửi ngay; rơi vào giờ yên lặng
 * hay chưa đủ 90 phút từ push trước thì xếp hàng tới khung giờ vàng kế tiếp.
 * Mỗi người chỉ giữ MỘT push chờ cho mỗi `tag` — bản mới thay bản cũ, để sáng
 * ra không bị dội một chồng thông báo cùng loại.
 *
 * `force` dùng cho hàng chờ: tới lượt rồi thì gửi, không xét khoảng chờ nữa.
 * @returns {'sent'|'queued'|false}
 */
export async function sendPushToUser(email, subs, payload, { force = false } = {}) {
  if (!subs || !subs.length) return false;

  let held = isQuietHours();
  if (!held && !force) {
    const bio = await Bio.findOne({ email }, { lastPushSentAt: 1 }).lean();
    const last = bio?.lastPushSentAt ? new Date(bio.lastPushSentAt).getTime() : 0;
    held = Date.now() - last < MIN_PUSH_GAP_MS;
  }

  if (held) {
    const tag = payload.tag || 'marketing';
    await ScheduledPush.updateOne(
      { email, feature: `deferred:${tag}`, sent: false },
      { $set: { label: tag, payload, scheduledFor: nextPrimeSlot() } },
      { upsert: true },
    );
    return 'queued';
  }

  await deliver(email, subs, payload);
  return 'sent';
}
