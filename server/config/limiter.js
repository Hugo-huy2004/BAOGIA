/**
 * CẤU HÌNH RATE LIMITING CHO SERVER
 * Tuân thủ Quy tắc 4 (Viblo): Cấu hình tập trung trong thư mục config/
 */
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/secrets.js';
import { recordSecurityViolation, sendSecurityBlockResponse } from '../services/securityEnforcement.js';

const isDev = process.env.NODE_ENV !== 'production';
export const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

// Đếm theo tài khoản khi có token hợp lệ: IP sau proxy (Vercel → Cloudflare) không
// phải IP người dùng, và kẻ tấn công xoay IP dân cư nhưng không xoay được tài khoản.
// Chỉ verify chữ ký, không chạm DB — token bị thu hồi vẫn bị requireMember chặn sau.
function memberEmail(req) {
  const auth = req.headers.authorization || '';
  const token = req.cookies?.member_jwt || (auth.startsWith('Bearer ') ? auth.slice(7) : '');
  if (!token) return '';
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'member' && decoded.email ? String(decoded.email).toLowerCase() : '';
  } catch {
    return '';
  }
}

function subjectKey(req) {
  req.limiterEmail = memberEmail(req);
  return req.limiterEmail ? `m:${req.limiterEmail}` : ipKeyGenerator(req.ip);
}

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 1500, // 0 = unlimited in dev; 1500/15 min (1.67 req/s avg) in prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || LOCALHOST_IPS.has(req.ip) || req.originalUrl.startsWith('/api/ops'),
  keyGenerator: subjectKey,
  message: { error: 'Quá nhiều truy cập, vui lòng thử lại sau 15 phút.' },
  handler: async (req, res, _next, options) => {
    try {
      const result = await recordSecurityViolation({
        req,
        email: req.limiterEmail,
        category: 'availability_attack',
        severity: 'high',
        ruleId: 'global_rate_limit_repeated',
        evidence: `${req.method} ${req.originalUrl}`,
        enforcement: 'threshold',
      });
      if (result.block) return sendSecurityBlockResponse(res, result.block);
    } catch (error) {
      console.error('[rate-limit security event]', error.message);
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
const isHeavy = (req) => (
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
