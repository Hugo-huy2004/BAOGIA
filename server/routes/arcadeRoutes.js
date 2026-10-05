import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  postScore,
  postEcoCaro,
  getLeaderboard,
  getProfile,
  getMyScore,
  buy2048Hammer,
  unlock2048Character,
  get2048Collection,
  get2048CollectionLeaderboard,
  SCORE_CEILINGS,
  RESULTS,
  ARCADE_DAILY_JOY_CAP,
} from '../modules/arcade/arcadeController.js';

const router = express.Router();

const scoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 40 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Gửi kết quả quá nhanh. Vui lòng thử lại sau ít phút.' },
});

// ==========================================
// API CHA: /api/arcade
// Điều phối các API con của phân hệ HugoArcade
// ==========================================

// --- 1. Điểm số & Phần thưởng ---
router.post('/score', requireMember, scoreLimiter, async (req, res) => {
  return postScore(req, res);
});

router.post('/eco-caro', requireMember, async (req, res) => {
  return postEcoCaro(req, res);
});

// --- 2. Bảng xếp hạng & Hồ sơ người chơi ---
router.get('/leaderboard', async (req, res) => {
  return getLeaderboard(req, res);
});

router.get('/profile', requireMember, async (req, res) => {
  return getProfile(req, res);
});

router.get('/me', requireMember, async (req, res) => {
  return getMyScore(req, res);
});

// --- 3. Phân hệ Game 2048 (Vật phẩm, Nhân vật, Bộ sưu tập) ---
router.post('/2048/buy-hammer', requireMember, async (req, res) => {
  return buy2048Hammer(req, res);
});

router.post('/2048/unlock-character', requireMember, async (req, res) => {
  return unlock2048Character(req, res);
});

router.get('/2048/collection', requireMember, async (req, res) => {
  return get2048Collection(req, res);
});

router.get('/2048/collection-leaderboard', async (req, res) => {
  return get2048CollectionLeaderboard(req, res);
});

export { SCORE_CEILINGS, RESULTS, ARCADE_DAILY_JOY_CAP };
export default router;
