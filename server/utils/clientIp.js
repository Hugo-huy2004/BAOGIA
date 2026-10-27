import { timingSafeEqual } from 'node:crypto';

/**
 * IP thật của người dùng. Đo trên prod (26/10/2026): req.ip là IP nội bộ của
 * load balancer Render (10.x) — mọi người dùng chung một IP. Render luôn đứng
 * sau Cloudflare, và Cloudflare GHI ĐÈ cf-connecting-ip ở edge, nên client không
 * giả được header này. Không có header (dev, health check nội bộ) thì dùng IP socket.
 *
 * Bẫy thứ hai (đo 27/10/2026): web gọi `/api` trên www → Vercel rewrite sang
 * api.* → Cloudflare thấy IP của VERCEL, nên cf-connecting-ip là IP Vercel và cả
 * vùng khách ẩn danh đếm chung một bucket, bị khoá thì khoá chung. Chặng www cũng
 * đi qua Cloudflare và ở đó ip.src là IP thật: Transform Rule trên www gắn
 * `x-hugo-client-ip` (ghi đè, nên client không giả được) kèm `x-hugo-edge-auth`
 * = EDGE_CLIENT_IP_SECRET. Chỉ tin header IP khi chữ ký khớp — gọi thẳng api.*
 * thì không có chữ ký, rơi về cf-connecting-ip như cũ. Xem docs/chong-ddos-12-tang.md.
 */
function edgeSigned(req) {
  const secret = process.env.EDGE_CLIENT_IP_SECRET;
  if (!secret) return false;
  const got = Buffer.from(String(req.headers['x-hugo-edge-auth'] || ''));
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

export const clientIp = (req, fallback = '') => {
  const relayed = req.headers['x-hugo-client-ip'];
  if (typeof relayed === 'string' && relayed && edgeSigned(req)) return relayed.trim();
  const cf = req.headers['cf-connecting-ip'];
  return typeof cf === 'string' && cf ? cf.trim() : fallback;
};

/**
 * IP thật ĐÃ ĐƯỢC EDGE KÝ, hoặc '' nếu không chắc. Dùng cho luật "mỗi người một
 * lần": request đi qua Vercel rewrite mà thiếu chữ ký thì cf-connecting-ip là IP
 * của Vercel — mọi người dùng chung, đếm theo nó là chặn nhầm cả loạt.
 */
export const signedClientIp = (req) => {
  const relayed = req.headers['x-hugo-client-ip'];
  return typeof relayed === 'string' && relayed && edgeSigned(req) ? relayed.trim() : '';
};
