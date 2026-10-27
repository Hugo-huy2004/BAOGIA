import { monitorEventLoopDelay } from 'node:perf_hooks';
import { verifiedActor, isMachineWebhook } from '../services/securityEnforcement.js';
import { isHeavy } from '../config/limiter.js';
import { sendTelegramAlert } from '../services/telegramService.js';

/**
 * Khiên tải — tầng 12 trong docs/chong-ddos-12-tang.md.
 *
 * Rate limit đếm theo TỪNG người; botnet xoay IP thì mỗi IP đều "trong hạn mức"
 * mà server vẫn chết. Khiên nhìn TỔNG: req/s so với mức nền đo được, và độ trễ
 * event loop (thước đo thật của "server sắp chết" trên 0,1 CPU của Render free).
 *
 * Bậc 1 (lưu lượng gấp SHIELD_MULT lần mức nền, hoặc lag > SHIELD_LAG_MS):
 *   khách ẩn danh nhận 503 + Retry-After. Thành viên đã đăng nhập, webhook,
 *   health và cổng đăng nhập vẫn đi — người thật không bị liên luỵ.
 * Bậc 2 (lag > 2×SHIELD_LAG_MS): thêm cả thao tác NẶNG (AI, upload) của thành viên.
 *
 * ENV: SHIELD=off tắt hẳn · SHIELD_FORCE=1 bật tay bậc 1 · SHIELD_RPS_FLOOR (60)
 * · SHIELD_MULT (5) · SHIELD_LAG_MS (250).
 */
const num = (name, def) => (process.env[name] ? Number(process.env[name]) : def);
const EXEMPT = /^\/(health|api\/health|api\/auth\/member|api\/ops)/;

const lag = monitorEventLoopDelay({ resolution: 20 });
lag.enable();

let level = 0;
let count = 0;
let baseline = 0; // req/s, trung bình trượt chậm (~5 phút)
let calm = 0;     // số giây liên tiếp đã yên — hạ khiên phải chờ đủ lâu, đừng bật tắt liên hồi
let hot = 0;      // số giây liên tiếp vượt ngưỡng
let lastRps = 0;
let lastLagMs = 0;

function alert(text) {
  sendTelegramAlert(`🛡️ <b>Khiên tải</b>: ${text}\nreq/s: <b>${lastRps}</b> · nền: <b>${baseline.toFixed(1)}</b> · lag p99: <b>${lastLagMs}ms</b>`)
    .catch(() => {});
}

setInterval(() => {
  const rps = count;
  count = 0;
  const lagMs = Math.round(lag.percentile(99) / 1e6);
  lag.reset();
  lastRps = rps;
  lastLagMs = lagMs;

  const lagLimit = num('SHIELD_LAG_MS', 250);
  const trigger = Math.max(num('SHIELD_RPS_FLOOR', 60), baseline * num('SHIELD_MULT', 5));
  const next = process.env.SHIELD_FORCE === '1' ? Math.max(1, lagMs > lagLimit * 2 ? 2 : 1)
    : lagMs > lagLimit * 2 ? 2
      : (lagMs > lagLimit || rps > trigger) ? 1
        : 0;

  if (next > 0) { calm = 0; hot += 1; } else { calm += 1; hot = 0; }
  // Học mức nền chỉ khi yên: đừng để chính cơn lũ nâng "bình thường" lên.
  if (level === 0 && next === 0) baseline = baseline ? baseline * 0.997 + rps * 0.003 : rps;

  // Phải nóng 3 giây liền mới bật: một nhịp GC hay một cron nặng không đáng khoá ai.
  if (next > level && (hot >= 3 || process.env.SHIELD_FORCE === '1')) {
    level = next;
    console.warn(`[load-shield] bậc ${level} rps=${rps} baseline=${baseline.toFixed(1)} lag=${lagMs}ms`);
    alert(`BẬT bậc ${level} — khách ẩn danh${level === 2 ? ' và thao tác nặng' : ''} tạm nhận 503.`);
  } else if (level > 0 && calm >= 60) {
    level = 0;
    console.warn('[load-shield] hạ khiên');
    alert('HẠ khiên — đã yên 60 giây.');
  }
}, 1000).unref();

export function loadShieldStatus() {
  return { level, rps: lastRps, baseline: Number(baseline.toFixed(1)), lagP99Ms: lastLagMs };
}

export function loadShield(req, res, next) {
  if (process.env.SHIELD === 'off') return next();
  count += 1;
  if (level === 0 || EXEMPT.test(req.path) || isMachineWebhook(req)) return next();
  const member = verifiedActor(req);
  if (member && !(level === 2 && isHeavy(req))) return next();
  res.set('Retry-After', '30');
  return res.status(503).json({ error: 'Hệ thống đang quá tải, xin thử lại sau ít phút.', code: 'LOAD_SHIELD' });
}
