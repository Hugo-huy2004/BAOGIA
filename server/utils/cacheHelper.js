import { randomUUID } from 'node:crypto';
import NodeCache from 'node-cache';
import redis from './redisClient.js';

const MAX_AGE_MS = 300_000;
const MAX_KEYS = 1000;
const PREFIX = 'hugo:response:v1:';
const cache = new NodeCache({ checkperiod: 60, maxKeys: MAX_KEYS });
const pendingRequests = new Map();

// Bound cache latency without changing the presence/pubsub connection.
const shared = redis?.duplicate({
  commandTimeout: 200,
  connectTimeout: 1000,
  maxRetriesPerRequest: 0,
  enableOfflineQueue: false,
  autoResendUnfulfilledCommands: false,
});
shared?.on('error', () => {}); // Optional cache: fall back to RAM / source.
shared?.on('ready', () => { cache.flushAll(); pendingRequests.clear(); });
shared?.on('close', () => { cache.flushAll(); pendingRequests.clear(); });

// Fence old fetches, including ones on other Node instances, after invalidation.
const STORE_IF_UNCHANGED = `
  if (redis.call('GET', KEYS[1]) or '') == ARGV[1] then
    return redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])
  end
  return nil
`;

function remember(key, entry, ttlMs) {
  // ponytail: FIFO at 1000 entries; use byte-based LRU if payloads grow.
  if (!cache.has(key) && cache.getStats().keys >= MAX_KEYS) cache.del(cache.keys()[0]);
  cache.set(key, entry, ttlMs / 1000);
}

/** Public JSON only. Redis is authoritative while connected; RAM is the
 * outage fallback. Fresh for staleTimeMs, usable for at most 3x that (<= 5 min).
 * ponytail: single-flight is per process; add distributed leases if DB load warrants it.
 */
export async function fetchWithCache(key, staleTimeMs, fetcher) {
  if (!Number.isFinite(staleTimeMs) || staleTimeMs <= 0 || staleTimeMs > MAX_AGE_MS) {
    throw new RangeError('Cache freshness must be between 0 and 300000 ms');
  }
  const ttlMs = Math.min(staleTimeMs * 3, MAX_AGE_MS);
  const pending = pendingRequests.get(key);
  if (pending) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.updatedAt < ttlMs) return cached.data;
    return pending.promise;
  }

  const startedAt = Date.now();
  const work = {};
  const current = () => pendingRequests.get(key) === work;
  const cleanup = () => {
    if (!current()) return;
    pendingRequests.delete(key);
    if (shared?.status === 'ready') cache.del(key);
  };
  work.promise = Promise.resolve().then(async () => {
    let raw = null;
    let useRedis = shared?.status === 'ready';
    let entry;
    if (useRedis) {
      try {
        raw = await shared.get(PREFIX + key);
        try { entry = raw ? JSON.parse(raw) : null; } catch { entry = null; }
      } catch {
        useRedis = false;
      }
    }
    if (!useRedis) entry = cache.get(key);
    const age = Date.now() - (entry?.updatedAt || 0);
    const usable = entry && Object.hasOwn(entry, 'data') && age >= 0 && age < ttlMs;
    if (usable && age < staleTimeMs) {
      cleanup();
      return entry.data;
    }

    const refresh = async () => {
      const data = await fetcher(); // Also handles synchronous throws.
      const updated = { data, updatedAt: Date.now() };
      // A tombstone lives longer than any fill we permit to populate Redis.
      if (current() && Date.now() - startedAt < MAX_AGE_MS) {
        if (useRedis) {
          try {
            await shared.eval(STORE_IF_UNCHANGED, 1, PREFIX + key,
              raw || '', JSON.stringify(updated), ttlMs);
          } catch { /* Source reads still succeed when Redis fails. */ }
        } else {
          remember(key, updated, ttlMs);
        }
      }
      return data;
    };
    work.promise = refresh().finally(cleanup);
    if (usable) {
      if (current()) remember(key, entry, ttlMs - age);
      work.promise.catch(() => {}); // A failed refresh never extends the TTL.
      return entry.data;
    }
    return work.promise;
  }).catch(error => { cleanup(); throw error; });
  pendingRequests.set(key, work);
  return work.promise;
}

export async function clearCache(key) {
  cache.del(key);
  pendingRequests.delete(key);
  if (shared?.status !== 'ready') return;
  try {
    // Unique expiring tombstones fence fills that started on an empty cache too.
    await shared.set(PREFIX + key, JSON.stringify({ invalidated: randomUUID() }), 'PX', MAX_AGE_MS);
  } catch { /* DB writes must not fail because the optional cache is down. */ }
}
