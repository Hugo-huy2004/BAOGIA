// Đẩy một payload JSON tới mọi WebSocket mà một thành viên đang mở.
// Dùng để trạng thái portal (số dư JOY, duyệt xác minh…) đổi ngay trên màn hình
// mà không phải tải lại trang.
import crypto from 'crypto';
import redis from './redisClient.js';

/**
 * Socket nằm ở ĐÚNG process đang giữ nó — không thể đem cất vào Redis.
 *
 * Một process thì `global.wsClients` là đủ. Nhiều process thì không: người dùng
 * cắm socket vào process B, còn việc cộng JOY cho họ lại xảy ra ở process A, nên
 * A gọi broadcastToEmail mà chẳng có socket nào để gửi — thông báo im lặng biến
 * mất. Cách chữa không phải là chia sẻ socket, mà là LOAN TIN: A phát lên Redis,
 * B nghe được thì tự gửi cho socket của mình.
 *
 * Không có REDIS_URL thì mọi thứ chạy y như cũ (chỉ gửi tại chỗ) — đúng trạng
 * thái hôm nay, một process.
 */
const CHANNEL = 'hugo:ws:broadcast';
// Mỗi process một mã: Redis trả lại chính bản tin mình vừa phát, không lọc thì
// client nhận hai lần.
const PROCESS_ID = crypto.randomUUID();

let subscriber = null;

function deliverLocally(email, payload) {
  const clients = global.wsClients?.[email];
  if (!clients || clients.size === 0) return 0;
  const message = JSON.stringify(payload);
  let sent = 0;
  for (const client of clients) {
    if (client.readyState === 1) { client.send(message); sent += 1; }
  }
  return sent;
}

/**
 * Nghe bản tin từ các process khác. Gọi một lần lúc khởi động.
 * Trả về false khi không có Redis — khi đó hệ thống chỉ chạy đúng ở một process.
 */
export function initRealtimeFanout() {
  if (!redis || subscriber) return false;
  // Kết nối đăng ký phải RIÊNG: một client ioredis đang ở chế độ subscribe thì
  // không chạy được lệnh thường nữa, mà `redis` còn dùng cho presence.
  subscriber = redis.duplicate();
  subscriber.on('error', (err) => console.error('[realtime] lỗi kết nối nghe:', err.message));
  subscriber.subscribe(CHANNEL, (err) => {
    if (err) console.error('[realtime] không đăng ký được kênh:', err.message);
    else console.log('📡 Realtime: loan tin qua Redis đã bật');
  });
  subscriber.on('message', (_channel, raw) => {
    try {
      const { email, payload, from } = JSON.parse(raw);
      if (from === PROCESS_ID) return; // bản tin của chính mình, đã gửi tại chỗ rồi
      deliverLocally(email, payload);
    } catch (error) {
      console.error('[realtime] bản tin hỏng:', error.message);
    }
  });
  return true;
}

export function broadcastToEmail(email, payload) {
  deliverLocally(email, payload);
  // Socket của người này có thể đang nằm ở process khác. Không có Redis thì bỏ
  // qua — một process thì gửi tại chỗ đã là đủ.
  if (!redis) return;
  redis
    .publish(CHANNEL, JSON.stringify({ email, payload, from: PROCESS_ID }))
    .catch((error) => console.error('[realtime] không loan tin được:', error.message));
}
