import { timingSafeEqual } from 'node:crypto';

/**
 * Khoá origin. Render nhận request trực tiếp ở *.onrender.com, đi vòng qua
 * WAF, cache và luật chặn của Cloudflare — đánh thẳng vào đó là bỏ qua mọi lớp
 * phòng thủ ở edge. Cloudflare (Transform Rule trên api.hugowishpax.studio)
 * gắn header `x-origin-auth`; thiếu nó nghĩa là request không đi qua edge.
 *
 * Tắt khi chưa đặt ORIGIN_SHARED_SECRET, để bật bằng env sau khi luật
 * Cloudflare đã chạy. Đọc env lúc gọi vì import ESM chạy trước dotenv.config().
 */
// Những đường bên thứ ba gọi thẳng vào onrender.com, tự xác thực bằng chữ ký riêng.
const EXEMPT = new Set(['/health', '/api/health', '/api/telegram/webhook', '/api/payos/webhook', '/api/ops/sentry-hook']);

export function originAllowed(req) {
  const secret = process.env.ORIGIN_SHARED_SECRET;
  if (!secret) return true;
  const got = Buffer.from(String(req.headers['x-origin-auth'] || ''));
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

export function originLock(req, res, next) {
  if (EXEMPT.has(req.path) || originAllowed(req)) return next();
  return res.status(403).json({ error: 'ORIGIN_LOCKED' });
}
