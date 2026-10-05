/**
 * DỊCH VỤ IDEMPOTENCY PHÒNG CHỐNG TRÙNG LẶP GIAO DỊCH
 *
 * Hỗ trợ đồng bộ trên cả hệ thống đa máy chủ (Multi-instance / Cluster) qua Redis
 * kèm cơ chế dự phòng RAM In-Memory tự động (NodeCache) khi Redis tạm thời vắng mặt.
 */
import NodeCache from 'node-cache';
import redisClient from '../config/redis.js';

// Bộ nhớ đệm fallback cục bộ cho từng process khi không có Redis URL
const memoryFallback = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Thử chiếm giữ khoá Idempotency (Atomic Lock)
 * @param {string} key - Khoá định danh giao dịch
 * @param {number} ttlSeconds - Thời gian sống của khoá (mặc định 300s = 5 phút)
 * @returns {Promise<boolean>} true nếu khoá thành công (request mới), false nếu trùng lặp
 */
export async function acquireIdempotencyLock(key, ttlSeconds = 300) {
  if (!key) return true;

  // 1. Thử khóa trên Redis nếu kết nối sẵn sàng (Atomic SET NX EX)
  if (redisClient && redisClient.status === 'ready') {
    try {
      const result = await redisClient.set(key, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (err) {
      console.warn('⚠️ [Idempotency] Lỗi Redis, chuyển sang RAM fallback:', err.message);
    }
  }

  // 2. Fallback sang RAM In-Memory
  if (memoryFallback.has(key)) {
    return false;
  }
  memoryFallback.set(key, true, ttlSeconds);
  return true;
}

/**
 * Giải phóng khoá Idempotency khi giao dịch bị từ chối sớm (validation failure)
 * @param {string} key - Khoá định danh giao dịch
 */
export async function releaseIdempotencyLock(key) {
  if (!key) return;

  if (redisClient && redisClient.status === 'ready') {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn('⚠️ [Idempotency] Không thể giải phóng Redis key:', err.message);
    }
  }

  memoryFallback.del(key);
}
