/**
 * chessController.js
 * Controller tập trung toàn bộ logic nghiệp vụ module Cờ Vua (Chess).
 */
import ChessRating from '../../models/ChessRating.js';
import ChessGame from '../../models/ChessGame.js';
import Bio from '../../models/Bio.js';
import { awardJoy } from '../../utils/joyService.js';
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
    return res.json({ success: true, leaderboard });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Lấy lịch sử ván cờ của thành viên hiện tại
 */
export async function getChessHistory(req, res) {
  try {
    const email = req.memberEmail;
    if (!email) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const games = await ChessGame.find({
      $or: [{ 'white.email': email }, { 'black.email': email }],
    })
      .sort({ playedAt: -1 })
      .limit(limit)
      .select('-__v -moves')
      .lean();

    return res.json({ success: true, games });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Lấy thống kê elo/hạng của người chơi
 */
export async function getChessStats(req, res) {
  try {
    const email = req.memberEmail;
    if (!email) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }

    const player = await ChessRating.findOne({ email }).lean();
    if (!player) {
      return res.json({
        success: true,
        stats: { email, rating: 1500, wins: 0, losses: 0, draws: 0, gamesPlayed: 0, rank: null },
      });
    }

    const rank = (await ChessRating.countDocuments({ rating: { $gt: player.rating } })) + 1;
    return res.json({ success: true, stats: { ...player, rank } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Khởi tạo/đồng bộ xếp hạng cờ vua với số dư JOY
 */
export async function initChessRating(req, res) {
  try {
    const { displayName, avatar, avatarUrl } = req.body;
    const email = req.memberEmail;
    if (!email || !displayName) {
      return res.status(400).json({ error: 'email and displayName are required' });
    }
    const finalAvatar = avatarUrl || avatar || null;

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    const currentBalance = bio?.joyBalance || 0;

    const player = await ChessRating.findOneAndUpdate(
      { email },
      {
        $setOnInsert: { email, displayName, wins: 0, losses: 0, draws: 0, gamesPlayed: 0 },
        $set: { avatar: finalAvatar, rating: currentBalance },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ success: true, player });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Cập nhật kết quả ván cờ và tính thưởng/phạt JOY
 */
export async function updateChessRating(req, res) {
  try {
    const { win, loss, draw, avatar, avatarUrl, joyReward, gameId } = req.body;
    const email = req.memberEmail;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    const increment = {
      gamesPlayed: 1,
      wins: win ? 1 : 0,
      losses: loss ? 1 : 0,
      draws: draw ? 1 : 0,
    };

    const updateFields = { lastPlayedAt: new Date(), updatedAt: new Date() };
    const finalAvatar = avatarUrl || avatar;
    if (finalAvatar) {
      updateFields.avatar = finalAvatar;
    }

    await ChessRating.findOneAndUpdate(
      { email },
      { $inc: increment, $set: updateFields },
      { upsert: true }
    );

    const delta = Math.max(CHESS_JOY_MIN, Math.min(CHESS_JOY_MAX, Math.trunc(Number(joyReward) || 0)));
    if (delta !== 0) {
      try {
        await awardJoy(
          email,
          delta,
          'chess_match',
          delta > 0 ? `Thắng trận cờ vua (+${delta} JOY)` : `Thua trận cờ vua (${delta} JOY)`,
          { refId: gameId || '' }
        );
      } catch (e) {
        console.error('[chess joy award]', e.message);
      }
    }

    const player = await ChessRating.findOne({ email }).lean();
    return res.json({ success: true, rating: player?.rating ?? 0 });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
