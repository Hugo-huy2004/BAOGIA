/**
 * CẤU HÌNH RATE LIMITING CHO SERVER
 * Tuân thủ Quy tắc 4 (Viblo): Cấu hình tập trung trong thư mục config/
 */
import rateLimit from 'express-rate-limit';
import { recordSecurityViolation, sendSecurityBlockResponse } from '../services/securityEnforcement.js';

const isDev = process.env.NODE_ENV !== 'production';
export const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 0 : 1500, // 0 = unlimited in dev; 1500/15 min (1.67 req/s avg) in prod
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || LOCALHOST_IPS.has(req.ip) || req.originalUrl.startsWith('/api/ops'),
  message: { error: 'Quá nhiều truy cập từ IP này, vui lòng thử lại sau 15 phút.' },
  handler: async (req, res, _next, options) => {
    try {
      const result = await recordSecurityViolation({
        req,
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
