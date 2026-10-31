/**
 * Chống gửi lặp giao dịch: khoá theo khoá idempotency trong RAM, sống 5 phút.
 * ponytail: theo tiến trình (Render free chạy một tiến trình); tách nhiều
 * instance thì chuyển sang một collection Mongo có unique index + TTL.
 */
import NodeCache from 'node-cache';

const locks = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/** true nếu chiếm được khoá (request mới), false nếu trùng lặp. */
export async function acquireIdempotencyLock(key, ttlSeconds = 300) {
  if (!key) return true;
  if (locks.has(key)) return false;
  locks.set(key, true, ttlSeconds);
  return true;
}

/** Nhả khoá khi giao dịch bị từ chối sớm (validation failure). */
export async function releaseIdempotencyLock(key) {
  if (key) locks.del(key);
}
