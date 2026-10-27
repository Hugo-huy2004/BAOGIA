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
async function fetchShared(key, staleTimeMs, fetcher, hotMs = 0) {
  if (!Number.isFinite(staleTimeMs) || staleTimeMs <= 0 || staleTimeMs > MAX_AGE_MS) {
    throw new RangeError('Cache freshness must be between 0 and 300000 ms');
  }
  const generation = hotGeneration.get(key) || 0;
  const markHot = (data, ageMs) => {
    if (!hotMs || (hotGeneration.get(key) || 0) !== generation) return;
    const lifetime = Math.min(hotMs, HOT_MAX_MS, staleTimeMs - ageMs);
    if (lifetime <= 0) return;
    if (hot.size >= MAX_KEYS) hot.delete(hot.keys().next().value);
    hot.set(key, { data, until: Date.now() + lifetime });
  };
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
      markHot(entry.data, age);
      return entry.data;
    }

    const refresh = async () => {
      const data = await fetcher(); // Also handles synchronous throws.
      const updated = { data, updatedAt: Date.now() };
      markHot(data, 0);
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
  hot.delete(key);
  hotGeneration.set(key, (hotGeneration.get(key) || 0) + 1);
  cache.del(key);
  pendingRequests.delete(key);
  if (shared?.status !== 'ready') return;
  try {
    // Unique expiring tombstones fence fills that started on an empty cache too.
    await shared.set(PREFIX + key, JSON.stringify({ invalidated: randomUUID() }), 'PX', MAX_AGE_MS);
  } catch { /* DB writes must not fail because the optional cache is down. */ }
}

/**
 * Lớp nóng trong RAM trước Redis — TUỲ CHỌN theo route (`{ hotMs }`).
 *
 * Mỗi lượt đọc qua Redis là một lệnh tính vào hạn mức Upstash gói Free
 * (500.000/tháng; hệ thống phi lợi nhuận, không dùng gói trả phí): 200 người
 * cùng mở `/api/data` là 200 lệnh cho cùng một nội dung. Route bật `hotMs` thì
 * nhiều người đọc cùng lúc chỉ tốn một lệnh.
 *
 * Đổi lại, instance KHÁC có thể thấy bản cũ thêm tối đa `hotMs` sau khi xoá
 * cache (instance này thì clearCache xoá ngay). Vì vậy mặc định TẮT: chỉ bật
 * cho dữ liệu công khai mà chậm vài giây không sai gì. Lớp nóng chỉ nhận bản đã
 * biết là tươi (đọc tươi từ Redis hoặc vừa nạp từ nguồn) và không sống quá phần
 * độ tươi còn lại, nên không kéo dài một bản cũ đang chờ làm mới nền.
 */
const HOT_MAX_MS = 10_000;
const hot = new Map();
// Mỗi lần clearCache tăng thế hệ của khoá: một lượt đọc bắt đầu TRƯỚC khi xoá
// mà về SAU khi xoá thì không được ghi bản cũ trở lại lớp nóng.
const hotGeneration = new Map();

export async function fetchWithCache(key, staleTimeMs, fetcher, { hotMs = 0 } = {}) {
  const entry = hot.get(key);
  if (entry && Date.now() < entry.until) return entry.data;
  return fetchShared(key, staleTimeMs, fetcher, hotMs);
}
