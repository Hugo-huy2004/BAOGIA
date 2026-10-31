import { clientIp } from './clientIp.js';

/**
 * Cloudflare Turnstile (gói miễn phí) — chặn bot gửi form công khai.
 *
 * Chưa đặt TURNSTILE_SECRET thì CHO QUA: form đang chạy trên production không
 * được chết chỉ vì chưa tạo widget. Đã đặt thì đóng chặt: token thiếu, sai
 * action, sai tên miền, hay không gọi được Cloudflare đều trả false.
 *
 * TURNSTILE_HOSTNAMES: tên miền frontend được chấp nhận, cách nhau dấu phẩy
 * (production KHÔNG để localhost).
 */
export function turnstileEnabled() {
  return Boolean(process.env.TURNSTILE_SECRET);
}

export async function verifyTurnstile(req, expectedAction) {
  if (!turnstileEnabled()) return true;
  const token = req.body?.['cf-turnstile-response'];
  const hostnames = new Set((process.env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean));
  if (typeof token !== 'string' || !token || token.length > 2048 || hostnames.size === 0) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, remoteip: clientIp(req) }),
    });
    if (!r.ok) return false;
    const result = await r.json();
    return result.success === true && result.action === expectedAction && hostnames.has(result.hostname);
  } catch {
    return false;
  }
}
