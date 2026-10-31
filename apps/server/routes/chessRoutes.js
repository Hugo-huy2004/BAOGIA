import express from 'express';
import { requireMember } from '../middleware/authMiddleware.js';
import {
  getChessLeaderboard,
  getChessHistory,
  getChessStats,
  initChessRating,
  updateChessRating,
  CHESS_JOY_MIN,
  CHESS_JOY_MAX,
} from '../modules/chess/chessController.js';

const router = express.Router();

// ==========================================
// API CHA: /api/chess
// Điều phối các API con của phân hệ Cờ Vua
// ==========================================

// --- 1. Bảng xếp hạng cờ vua (Công khai) ---
router.get('/leaderboard', async (req, res) => {
  return getChessLeaderboard(req, res);
});

// --- 2. Lịch sử ván đấu & Chỉ số cá nhân ---
router.get('/history', requireMember, async (req, res) => {
  return getChessHistory(req, res);
});

router.get('/stats', requireMember, async (req, res) => {
  return getChessStats(req, res);
});

// --- 3. Đăng ký xếp hạng & Cập nhật điểm trận đấu ---
router.post('/rating/init', requireMember, async (req, res) => {
  return initChessRating(req, res);
});

router.post('/rating/update', requireMember, async (req, res) => {
  return updateChessRating(req, res);
});

export { CHESS_JOY_MIN, CHESS_JOY_MAX };
export default router;
