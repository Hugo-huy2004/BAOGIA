import express from 'express';
import ChessRating from '../models/ChessRating.js';
import ChessGame from '../models/ChessGame.js';

const router = express.Router();

// GET /api/chess/leaderboard?limit=20
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const players = await ChessRating.find({})
      .sort({ rating: -1 })
      .limit(limit)
      .select('-__v')
      .lean();

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
      return res.json({ success: true, stats: { email, rating: 1200, wins: 0, losses: 0, draws: 0, gamesPlayed: 0, rank: null } });
    }

    const rank = (await ChessRating.countDocuments({ rating: { $gt: player.rating } })) + 1;

    res.json({ success: true, stats: { ...player, rank } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chess/rating/init — body: { email, displayName }
router.post('/rating/init', async (req, res) => {
  try {
    const { email, displayName } = req.body;
    if (!email || !displayName) {
      return res.status(400).json({ error: 'email and displayName are required' });
    }

    const player = await ChessRating.findOneAndUpdate(
      { email },
      { $setOnInsert: { email, displayName, rating: 1200, wins: 0, losses: 0, draws: 0, gamesPlayed: 0 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({ success: true, player });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
