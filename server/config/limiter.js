/**
 * CẤU HÌNH RATE LIMITING CHO SERVER
 * Tuân thủ Quy tắc 4 (Viblo): Cấu hình tập trung trong thư mục config/
 */
import rateLimit, { ipKeyGenerator, MemoryStore } from 'express-rate-limit';
import crypto from 'crypto';
import { recordSecurityViolation } from '../services/securityEnforcement.js';
import { RedisStore } from 'rate-limit-redis';
import redis from './redis.js';

const isDev = process.env.NODE_ENV !== 'production';

// Bộ đếm qua Redis khi có REDIS_URL — CHỈ cho các trần lượt ít request nhưng cần
// sống qua lần khởi động lại (đăng nhập, OTP): chống dò mật khẩu bằng cách chờ
// Render restart. Trần trên mọi request ở lại RAM để giữ Upstash trong gói Free.
// Một kết nối riêng (không đụng kết nối pub/sub).
const limiterRedis = redis?.duplicate();
limiterRedis?.on('error', () => {});

/**
 * Redis trước, RAM khi Redis lỗi. Upstash gói Free hết hạn mức tháng thì trả lỗi
 * cho mọi lệnh; nếu chỉ "cho qua khi lỗi" thì lúc đó KHÔNG còn trần lượt nào —
 * đúng lúc đông người nhất. Rơi về bộ đếm trong RAM giữ được trần (theo từng
 * instance), và tự quay lại Redis ngay khi Redis trả lời được.
 */
class FallbackStore {
  constructor(primary) {
    this.primary = primary;
    this.memory = new MemoryStore();
    this.localKeys = false;
  }

  init(options) {
    this.primary.init?.(options);
    this.memory.init(options);
  }

  async get(key) {
    try { return await this.primary.get(key); } catch { return this.memory.get(key); }
  }

  async increment(key) {
    try { return await this.primary.increment(key); } catch { return this.memory.increment(key); }
  }

  async decrement(key) {
    await Promise.allSettled([this.primary.decrement(key), this.memory.decrement(key)]);
  }

  async resetKey(key) {
    await Promise.allSettled([this.primary.resetKey(key), this.memory.resetKey(key)]);
  }

  shutdown() {
    this.memory.shutdown?.();
  }
}

export function limiterStore(prefix) {
  if (!limiterRedis) return {};
  const redisStore = new RedisStore({ prefix: `rl:${prefix}:`, sendCommand: (...args) => limiterRedis.call(...args) });
  // Lúc khởi động Redis chưa kết nối xong nên lần nạp script đầu có thể hỏng;
  // store tự nạp lại ở lượt đếm sau. Bắt lỗi ở đây để nó không thành
  // unhandledRejection (báo động Telegram/Sentry giả mỗi lần deploy).
  redisStore.incrementScriptSha?.catch?.(() => {});
  redisStore.getScriptSha?.catch?.(() => {});
  return { store: new FallbackStore(redisStore), passOnStoreError: true };
}
export const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// Đếm theo PHIÊN khi có: IP sau proxy (Vercel → Cloudflare) không phải IP người
// dùng. Chỉ băm token phiên, không chạm DB — phiên giả thì requireMember chặn sau.
// ponytail: khoá theo phiên chứ không theo email (email cần một lượt đọc DB); đổi
// sang email nếu thấy kẻ tấn công xoay phiên.
function sessionKey(req) {
  const auth = req.headers.authorization || '';
  const token = req.cookies?.['hugo.session_token'] || req.cookies?.['__Secure-hugo.session_token']
    || (auth.startsWith('Bearer ') ? auth.slice(7) : '');
  return token ? crypto.createHash('sha256').update(token).digest('hex').slice(0, 24) : '';
}

/**
 * Khoá đếm cho limiter của từng route: tài khoản (requireMember đã gắn, hoặc
 * token hợp lệ), không có thì mới tới IP. Lượt đi www → Vercel → api mà chưa có
 * chữ ký edge thì IP là IP Vercel, cả trăm người chung một bucket — đếm theo IP
 * ở đó là một lớp học 200 người cùng đọc bài nhận 429 hàng loạt.
 */
export function accountOrIpKey(req) {
  if (req.memberEmail) return `m:${String(req.memberEmail).toLowerCase()}`;
  const session = req.limiterSession || sessionKey(req);
  return session ? `s:${session}` : ipKeyGenerator(req.ip);
}

function subjectKey(req) {
  req.limiterSession = sessionKey(req);
  return req.limiterSession ? `s:${req.limiterSession}` : ipKeyGenerator(req.ip);
}

// TRUSTED_IPS="1.2.3.4,5.6.7.8": IP public của hội trường/văn phòng — cả trăm người
// sau một NAT, trước khi đăng nhập đều đếm chung một bucket. Chỉ miễn trần lượt;
// heavyLimiter, khiên tải và mọi cổng xác thực vẫn áp dụng. Đọc env lúc gọi
// (import ESM chạy trước dotenv.config()).
const trustedIp = (ip) => String(process.env.TRUSTED_IPS || '').split(',').map((s) => s.trim()).filter(Boolean).includes(ip);

// ponytail: bộ nhớ trong tiến trình, dọn theo cửa sổ 15 phút; nhiều instance thì chuyển Redis.
const FLAG_WINDOW_MS = 15 * 60 * 1000;
const flagged = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, at] of flagged) if (now - at > FLAG_WINDOW_MS) flagged.delete(k);
}, 60 * 1000).unref();

// Đếm trong RAM, không qua Redis: lượt này chạy trên MỌI request, qua Redis là
// một lệnh mỗi request — đủ để đốt hết 500.000 lệnh/tháng của Upstash gói Free
// (hệ thống phi lợi nhuận, không dùng gói trả phí). Render Free chạy một instance
// nên đếm trong RAM là đủ; chỉ mất bộ đếm khi khởi động lại.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Thành viên đếm theo tài khoản: 1500/15 phút. Khách ẩn danh đếm theo IP mà IP
  // có thể là của Vercel (chung cho mọi người chưa đăng nhập) nên trần rộng hơn;
  // lũ thật do khiên tải (loadShield) chặn theo tổng lưu lượng.
  max: (req) => (isDev ? 0 : req.limiterSession ? 1500 : 6000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || LOCALHOST_IPS.has(req.ip) || trustedIp(req.ip) || req.originalUrl.startsWith('/api/ops'),
  keyGenerator: subjectKey,
  message: { error: 'Quá nhiều truy cập, vui lòng thử lại sau 15 phút.' },
  // Vượt trần chỉ là 429, KHÔNG khoá. Bản cũ khoá IP 30 ngày từ lần vượt thứ hai,
  // mà IP ở đây có thể là IP dùng chung (Vercel, wifi hội trường) — một người
  // nện là cả trăm người mất trang đăng nhập. Ghi sổ đúng MỘT lần mỗi cửa sổ:
  // ghi Mongo cho từng lượt bị từ chối là biến cơn lũ thành lũ vào pool DB.
  handler: (req, res, _next, options) => {
    const key = req.limiterSession ? `s:${req.limiterSession}` : req.ip;
    if (!flagged.has(key)) {
      flagged.set(key, Date.now());
      recordSecurityViolation({
        req,
        category: 'availability_attack',
        severity: 'high',
        ruleId: 'global_rate_limit_repeated',
        evidence: `${req.method} ${req.originalUrl}`,
        enforcement: 'observe',
      }).catch((error) => console.error('[rate-limit security event]', error.message));
    }
    return res.status(options.statusCode).json(options.message);
  },
});

// Route TỐN TIỀN (chống Denial of Wallet): gọi AI, tool xử lý file, và mọi request
// mang upload — multipart hoặc JSON to (ảnh base64). globalLimiter chặn LƯỢT, còn
// đây chặn những lượt đắt, nên ngưỡng thấp hơn nhiều. Hạn mức AI theo ngày vẫn do
// Python giữ; lớp này chỉ chặn dồn dập trong ngắn hạn.
const HEAVY_PREFIXES = ['/api/ai', '/api/files', '/api/companion/brain', '/api/sleep/analyze'];
const HEAVY_BODY_BYTES = 256 * 1024;
export const isHeavy = (req) => (
  HEAVY_PREFIXES.some((p) => req.originalUrl.startsWith(p))
  || String(req.headers['content-type'] || '').startsWith('multipart/form-data')
  || Number(req.headers['content-length'] || 0) > HEAVY_BODY_BYTES
);

export const heavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 60,
  standardHeaders: false,
  legacyHeaders: false,
  skip: (req) => isDev || LOCALHOST_IPS.has(req.ip) || !isHeavy(req),
  keyGenerator: subjectKey,
  message: { error: 'Thao tác nặng quá dày, xin vui lòng thử lại sau ít phút.', code: 'HEAVY_RATE_LIMIT' },
});
