import express from 'express';
import {
  getChessLeaderboard,
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

export { CHESS_JOY_MIN, CHESS_JOY_MAX };
export default router;
