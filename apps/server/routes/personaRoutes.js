import express from 'express';
import rateLimit from 'express-rate-limit';
import { accountOrIpKey } from '../config/limiter.js';
import { requireMemberSession } from '../middleware/authMiddleware.js';
import { PersonaService } from '../modules/persona/PersonaService.js';

// /api/persona — biệt danh + nhân vật của CHÍNH tài khoản đang đăng nhập (req.memberEmail).
// Client: packages/persona/PersonaClient.js.
const router = express.Router();
const writeLimiter = rateLimit({ keyGenerator: accountOrIpKey, windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

router.get('/', requireMemberSession, async (req, res) => {
  try {
    return res.json(await PersonaService.get(req.memberEmail));
  } catch (error) {
    console.error('[persona]', error.message);
    return res.status(503).json({ code: 'SERVICE_DEGRADED' });
  }
});

router.put('/', requireMemberSession, writeLimiter, async (req, res) => {
  try {
    return res.json(await PersonaService.save(req.memberEmail, { nickname: req.body?.nickname, avatar: req.body?.avatar }));
  } catch (error) {
    if (error.code && error.code !== 11000) return res.status(400).json({ code: error.code });
    console.error('[persona]', error.message);
    return res.status(503).json({ code: 'SERVICE_DEGRADED' });
  }
});

export default router;
