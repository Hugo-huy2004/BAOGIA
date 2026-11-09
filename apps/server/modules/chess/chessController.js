/**
 * chessController.js
 * Controller tập trung toàn bộ logic nghiệp vụ module Cờ Vua (Chess).
 */
import ChessRating from '../../models/ChessRating.js';
import { fetchWithCache } from '../../utils/cacheHelper.js';

export const CHESS_JOY_MIN = -10;
export const CHESS_JOY_MAX = 75;

/**
 * Lấy bảng xếp hạng cờ vua (có cache 5s, ẩn email PII)
 */
export async function getChessLeaderboard(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const players = await fetchWithCache(`chess_lb_${limit}`, 5000, () =>
      ChessRating.find({})
        .sort({ rating: -1 })
        .limit(limit)
        .select('displayName avatar rating wins losses draws gamesPlayed lastPlayedAt')
        .lean()
    );

    const leaderboard = players.map((p, idx) => ({ rank: idx + 1, ...p }));
    res.set('Cache-Control', 'public, max-age=15, s-maxage=15, stale-while-revalidate=60');
    return res.json({ success: true, leaderboard });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
