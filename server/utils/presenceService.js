import redis from './redisClient.js';
import Bio from '../models/Bio.js';
import Counter from '../models/Counter.js';

const PRESENCE_TTL_SECONDS = 90;       // "online" window — refreshed by a ~45s client heartbeat
const BITMAP_TTL_SECONDS = 35 * 86400; // keep ~5 weeks of daily active-user bitmaps, then auto-expire

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Assigns each Bio a stable sequential integer once, for bitmap addressing (SETBIT offset). */
async function ensurePresenceIndex(bio) {
  if (bio.presenceIndex != null) return bio.presenceIndex;
  const counter = await Counter.findOneAndUpdate(
    { _id: 'bioPresenceIndex' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  bio.presenceIndex = counter.seq;
  await bio.save();
  return bio.presenceIndex;
}

/**
 * Called on each member heartbeat (~every 45s while the tab is visible).
 * Marks the member online for PRESENCE_TTL_SECONDS and flips today's DAU bit.
 * Fails silently if Redis is unreachable — presence is best-effort, never
 * something that should break the page.
 */
export async function recordHeartbeat(email) {
  if (!redis) return;
  try {
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return;

    await redis.set(`presence:${bio.email}`, '1', 'EX', PRESENCE_TTL_SECONDS);

    const idx = await ensurePresenceIndex(bio);
    const key = `activeusers:${todayStr()}`;
    await redis.setbit(key, idx, 1);
    await redis.expire(key, BITMAP_TTL_SECONDS);
  } catch (e) {
    console.error('[presence] heartbeat error:', e.message);
  }
}

/** Batch online check — one Redis pipeline round trip regardless of list size. */
export async function getOnlineStatuses(emails) {
  if (!redis || !emails.length) return Object.fromEntries(emails.map(e => [e, false]));
  try {
    const pipeline = redis.pipeline();
    emails.forEach(email => pipeline.exists(`presence:${email}`));
    const results = await pipeline.exec();
    const statuses = {};
    emails.forEach((email, i) => {
      statuses[email] = !!(results[i] && results[i][1]);
    });
    return statuses;
  } catch (e) {
    console.error('[presence] batch status error:', e.message);
    return Object.fromEntries(emails.map(e => [e, false]));
  }
}

export async function isOnline(email) {
  if (!redis) return false;
  try {
    return !!(await redis.exists(`presence:${email}`));
  } catch (e) {
    console.error('[presence] status error:', e.message);
    return false;
  }
}

/** Count of distinct members active at all on a given day (default: today). */
export async function getDailyActiveCount(dateStr) {
  if (!redis) return 0;
  try {
    return await redis.bitcount(`activeusers:${dateStr || todayStr()}`);
  } catch (e) {
    console.error('[presence] dau count error:', e.message);
    return 0;
  }
}
