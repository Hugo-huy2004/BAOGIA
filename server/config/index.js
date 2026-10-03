/**
 * ENTRY POINT CHO TẬP TRUNG CẤU HÌNH (CONFIG BARREL)
 * Tuân thủ Quy tắc 2 & 4 (Viblo): Không chứa logic nặng, chỉ export tài nguyên từ các module config
 */
export { connectDatabase, MONGODB_URI } from './database.js';
export { allowedOrigins, isDev, localOriginRegex, oauthCorsOptions, appCorsOptions } from './cors.js';
export { globalLimiter, LOCALHOST_IPS } from './limiter.js';
export { default as redisClient, getRedisStatus, REDIS_URL } from './redis.js';
