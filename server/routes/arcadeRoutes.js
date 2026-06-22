import express from 'express';
import ArcadeScore from '../models/ArcadeScore.js';
import { awardJoy } from '../utils/joyService.js';

const router = express.Router();

// Per-game score ceilings — reject obviously implausible/forged values outright.
// Not full replay verification, just sanity bounds; real abuse resistance comes
// from the win/loss-driven reward table + shared daily net-JOY cap below.
const SCORE_CEILINGS = { '2048': 500000, caro: 200, wordguess: 100 };

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const RESULTS = ['win', 'lose', 'draw'];

// Shared across all 3 games — one difficulty system, simple player expectations.
const REWARD_TABLE = {
  easy:   { win: 12, lose: -1 },
  medium: { win: 25, lose: -2 },
  hard:   { win: 50, lose: -3 },
};

// Bounds the daily net swing while allowing multiple high-tier wins.
const ARCADE_DAILY_NET_JOY_CAP = 120;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// POST /api/arcade/score — body: { email, game, score, difficulty, result, displayName, avatarUrl }
router.post('/score', async (req, res) => {
  try {
    const { email, game, score, difficulty, result, displayName, avatarUrl } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!Object.keys(SCORE_CEILINGS).includes(game)) {
      return res.status(400).json({ error: 'invalid game' });
    }
    const numScore = Number(score);
    if (!Number.isFinite(numScore) || !Number.isInteger(numScore) || numScore < 0 || numScore > SCORE_CEILINGS[game]) {
      return res.status(400).json({ error: 'invalid score' });
    }
    if (!DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: 'invalid difficulty' });
    }
    if (!RESULTS.includes(result)) {
      return res.status(400).json({ error: 'invalid result' });
    }

    const recordInc = {};
    if (result === 'win') recordInc[`record.${difficulty}.wins`] = 1;
    else if (result === 'lose') recordInc[`record.${difficulty}.losses`] = 1;

    let doc = await ArcadeScore.findOneAndUpdate(
      { email, game },
      {
        $setOnInsert: { email, game, bestScore: 0, joyAwardedDate: '', joyAwardedToday: 0 },
        $inc: { gamesPlayed: 1, ...recordInc },
        $set: {
          lastScore: numScore,
          lastPlayedAt: new Date(),
          ...(displayName ? { displayName } : {}),
          ...(avatarUrl ? { avatar: avatarUrl } : {})
        }
      },
      { upsert: true, new: true }
    );

    if (numScore > doc.bestScore) {
      doc.bestScore = numScore;
    }

    let joyDelta = 0;
    let joyAwarded = false;
    let dailyCapReached = false;

    if (result !== 'draw') {
      const today = todayStr();
      if (doc.joyAwardedDate !== today) {
        doc.joyAwardedDate = today;
        doc.joyAwardedToday = 0;
      }

      // Shared cap across all 3 games — sum today's NET JOY from the user's
      // other game docs too, not just this one. Signed, can be negative.
      const otherDocs = await ArcadeScore.find({ email, game: { $ne: game }, joyAwardedDate: today }).lean();
      const netSoFar = doc.joyAwardedToday + otherDocs.reduce((sum, d) => sum + (d.joyAwardedToday || 0), 0);

      if (Math.abs(netSoFar) < ARCADE_DAILY_NET_JOY_CAP) {
        const delta = REWARD_TABLE[difficulty][result];
        try {
          await awardJoy(
            email, delta, 'arcade_score',
            delta > 0 ? `Thắng ở HugoArcade (+${delta} JOY)` : `Thua ở HugoArcade (${delta} JOY)`,
            { refId: game }
          );
          doc.joyAwardedToday += delta;
          joyDelta = delta;
          joyAwarded = true;
        } catch (e) {
          console.error('[arcade joy award]', e.message);
        }
      } else {
        dailyCapReached = true;
      }
    }

    await doc.save();
    res.json({ bestScore: doc.bestScore, joyDelta, joyAwarded, dailyCapReached });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/arcade/leaderboard?game=2048&limit=30
router.get('/leaderboard', async (req, res) => {
  try {
    const { game, limit } = req.query;
    if (!Object.keys(SCORE_CEILINGS).includes(game)) {
      return res.status(400).json({ error: 'invalid game' });
    }
    const leaderboard = await ArcadeScore.find({ game })
      .sort({ bestScore: -1 })
      .limit(Math.min(Number(limit) || 30, 100))
      .select('email displayName avatar bestScore gamesPlayed lastPlayedAt')
      .lean();
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/arcade/profile?email= — all 3 games' record/bestScore/gamesPlayed in
// one call, used by the lobby + achievement computation (read-only, no abuse surface).
router.get('/profile', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const docs = await ArcadeScore.find({ email }).lean();
    const zeroRecord = () => ({ easy: { wins: 0, losses: 0 }, medium: { wins: 0, losses: 0 }, hard: { wins: 0, losses: 0 } });
    const profile = {};
    for (const game of Object.keys(SCORE_CEILINGS)) {
      const doc = docs.find((d) => d.game === game);
      profile[game] = {
        bestScore: doc?.bestScore || 0,
        gamesPlayed: doc?.gamesPlayed || 0,
        record: doc?.record || zeroRecord()
      };
    }
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/arcade/me?email=&game=
router.get('/me', async (req, res) => {
  try {
    const { email, game } = req.query;
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!Object.keys(SCORE_CEILINGS).includes(game)) {
      return res.status(400).json({ error: 'invalid game' });
    }
    const doc = await ArcadeScore.findOne({ email, game }).lean();
    res.json({ bestScore: doc?.bestScore || 0, gamesPlayed: doc?.gamesPlayed || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
