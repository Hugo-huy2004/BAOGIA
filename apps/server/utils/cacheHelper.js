import NodeCache from 'node-cache';

/**
 * Đệm JSON công khai trong RAM của tiến trình. Render free chạy đúng MỘT tiến
 * trình nên RAM là đủ — không cần Redis (đã gỡ 31/10/2026: tốn hạn mức, thêm
 * một chỗ có thể sập mà không đem lại gì).
 *
 * Tươi trong staleTimeMs; quá hạn thì trả bản cũ ngay và làm mới ở nền, dùng
 * được tối đa 3× staleTimeMs (≤ 5 phút). Nhiều người hỏi cùng một khoá lúc
 * trống thì nguồn chỉ bị gọi một lần.
 * ponytail: đệm theo tiến trình; tách nhiều instance thì mỗi instance tự đệm, cũ tối đa ttl.
 */
const MAX_AGE_MS = 300_000;
const MAX_KEYS = 1000;
const cache = new NodeCache({ checkperiod: 60 });
const pending = new Map();
// Mỗi lần xoá tăng thế hệ của khoá: lượt nạp bắt đầu TRƯỚC khi xoá mà về SAU
// khi xoá thì không được ghi bản cũ trở lại.
const generation = new Map();

function load(key, ttlMs, fetcher) {
  if (pending.has(key)) return pending.get(key);
  const gen = generation.get(key) || 0;
  const work = Promise.resolve().then(fetcher).then((data) => {
    if ((generation.get(key) || 0) === gen) {
      // ponytail: FIFO ở 1000 khoá; đổi sang LRU theo byte nếu payload phình.
      if (!cache.has(key) && cache.keys().length >= MAX_KEYS) cache.del(cache.keys()[0]);
      cache.set(key, { data, updatedAt: Date.now() }, ttlMs / 1000);
    }
    return data;
  }).finally(() => { if (pending.get(key) === work) pending.delete(key); });
  pending.set(key, work);
  return work;
}

export async function fetchWithCache(key, staleTimeMs, fetcher) {
  if (!Number.isFinite(staleTimeMs) || staleTimeMs <= 0 || staleTimeMs > MAX_AGE_MS) {
    throw new RangeError('Cache freshness must be between 0 and 300000 ms');
  }
  const ttlMs = Math.min(staleTimeMs * 3, MAX_AGE_MS);
  const entry = cache.get(key);
  if (!entry) return load(key, ttlMs, fetcher);
  // Làm mới hỏng thì bản cũ vẫn chỉ sống tới hết ttl, không bao giờ được gia hạn.
  if (Date.now() - entry.updatedAt >= staleTimeMs) load(key, ttlMs, fetcher).catch(() => {});
  return entry.data;
}

export async function clearCache(key) {
  generation.set(key, (generation.get(key) || 0) + 1);
  cache.del(key);
  pending.delete(key);
}
