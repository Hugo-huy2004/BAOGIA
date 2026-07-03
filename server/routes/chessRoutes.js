import express from 'express';
import ChessRating from '../models/ChessRating.js';
import ChessGame from '../models/ChessGame.js';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { fetchWithCache } from '../utils/cacheHelper.js';

const router = express.Router();

// Reward bounds mirror the arcade table (win max 75, flat -10 loss stake).
// The client computes the reward for bot games, so without a server-side cap
// a single crafted request could mint any amount of JOY.
const CHESS_JOY_MIN = -10;
const CHESS_JOY_MAX = 75;

// GET /api/chess/leaderboard?limit=20
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    // Shared 5s cache + single-flight so many concurrent viewers collapse to
    // one DB read (same rationale as the arcade leaderboard).
    const players = await fetchWithCache(`chess_lb_${limit}`, 5000, () =>
      ChessRating.find({})
        .sort({ rating: -1 })
        .limit(limit)
        .select('-__v')
        .lean()
    );

    const leaderboard = players.map((p, idx) => ({ rank: idx + 1, ...p }));
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chess/history?email=X&limit=10
router.get('/history', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const games = await ChessGame.find({
      $or: [{ 'white.email': email }, { 'black.email': email }],
    })
      .sort({ playedAt: -1 })
      .limit(limit)
      .select('-__v -moves') // skip full move list for list views
      .lean();

    res.json({ success: true, games });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chess/stats?email=X
router.get('/stats', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'email query parameter is required' });
    }

    const player = await ChessRating.findOne({ email }).lean();
    if (!player) {
      return res.json({ success: true, stats: { email, rating: 1500, wins: 0, losses: 0, draws: 0, gamesPlayed: 0, rank: null } });
    }

    const rank = (await ChessRating.countDocuments({ rating: { $gt: player.rating } })) + 1;

    res.json({ success: true, stats: { ...player, rank } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chess/rating/init — body: { email, displayName, avatar, avatarUrl }
router.post('/rating/init', requireMember, async (req, res) => {
  try {
    const { displayName, avatar, avatarUrl } = req.body;
    const email = req.memberEmail;
    if (!email || !displayName) {
      return res.status(400).json({ error: 'email and displayName are required' });
    }
    const finalAvatar = avatarUrl || avatar || null;

    // Force-resync the chess-displayed rating to the real JOY balance on every
    // page load — self-heals any drift (e.g. JOY earned elsewhere while the
    // ChessRating doc didn't exist yet, or events recorded before this sync
    // existed) instead of only seeding it once on first insert.
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    const currentBalance = bio?.joyBalance || 0;

    const player = await ChessRating.findOneAndUpdate(
      { email },
      {
        $setOnInsert: { email, displayName, wins: 0, losses: 0, draws: 0, gamesPlayed: 0 },
        $set: { avatar: finalAvatar, rating: currentBalance }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chess/rating/update — body: { email, ratingChange, win, loss, draw, avatar, avatarUrl, joyReward, gameId }
// JOY is the single source of truth for the chess rating: ratingChange/joyReward
// is applied directly to the real spendable wallet (can be negative on a loss),
// and ChessRating.rating is kept in sync automatically by awardJoy().
router.post('/rating/update', requireMember, async (req, res) => {
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
    res.json({ success: true, rating: player?.rating ?? 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
