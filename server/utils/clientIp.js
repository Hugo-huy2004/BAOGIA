/**
 * IP thật của người dùng. Đo trên prod (26/10/2026): req.ip là IP nội bộ của
 * load balancer Render (10.x) — mọi người dùng chung một IP. Render luôn đứng
 * sau Cloudflare, và Cloudflare GHI ĐÈ cf-connecting-ip ở edge, nên client không
 * giả được header này. Không có header (dev, health check nội bộ) thì dùng IP socket.
 */
export const clientIp = (req, fallback = '') => {
  const cf = req.headers['cf-connecting-ip'];
  return typeof cf === 'string' && cf ? cf.trim() : fallback;
};
