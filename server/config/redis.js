/**
 * CẤU HÌNH & KẾT NỐI REDIS CACHE & REALTIME
 * Tuân thủ Quy tắc 4 (Viblo): Cấu hình tập trung trong thư mục config/
 */
import 'dotenv/config';
import Redis from 'ioredis';

export const REDIS_URL = process.env.REDIS_URL || null;

let redisClient = null;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      commandTimeout: 500,
      enableOfflineQueue: false,
      autoResendUnfulfilledCommands: false,
      retryStrategy: (times) => Math.min(times * 250, 3000),
    });

    redisClient.on('error', (err) => {
      // Log lỗi kết nối nhẹ nhàng, không làm sập tiến trình Node
      console.warn('⚠️ [Redis] Cảnh báo kết nối:', err.message);
    });

    redisClient.on('ready', () => {
      console.log('✅ [Redis] Đã kết nối thành công (Cache & PubSub online)');
    });

    redisClient.on('close', () => {
      console.warn('ℹ️ [Redis] Kết nối đóng — chuyển sang RAM fallback');
    });
  } catch (err) {
    console.warn('⚠️ [Redis] Không thể khởi tạo client:', err.message);
    redisClient = null;
  }
} else {
  // Môi trường dev hoặc Render chưa cấp Redis URL
  console.log('ℹ️ [Redis] REDIS_URL chưa khai báo — chạy chế độ RAM In-Memory Fallback');
}

/**
 * Trả về thông tin trạng thái Redis phục vụ giám sát và /health endpoint
 */
export function getRedisStatus() {
  if (!redisClient) {
    return {
      enabled: false,
      status: 'in-memory-fallback',
      message: 'Chạy trên bộ nhớ đệm RAM cục bộ',
    };
  }
  return {
    enabled: true,
    status: redisClient.status,
    connected: redisClient.status === 'ready',
  };
}

export default redisClient;
