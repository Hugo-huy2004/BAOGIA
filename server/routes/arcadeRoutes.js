import express from 'express';
import ArcadeScore from '../models/ArcadeScore.js';
import { awardJoy } from '../utils/joyService.js';
import { requireMember } from '../middleware/authMiddleware.js';

const router = express.Router();

// Per-game score ceilings — reject obviously implausible/forged values outright.
// Not full replay verification, just sanity bounds; real abuse resistance comes
// from the win/loss-driven reward table + shared daily net-JOY cap below.
// Nới theo thang điểm mới (combo + hệ số nhân + thưởng cấp) — vẫn chỉ là chặn
// giá trị bịa đặt, không phải xác thực ván chơi.
// wordguess trước đây để 100 là SAI: chế độ vô tận giải ~3 từ đã vượt trần nên
// server trả 400 và người chơi mất trắng điểm của cả ván dài.
const SCORE_CEILINGS = { '2048': 1000000, caro: 200, wordguess: 20000, survivor: 200000, snake: 8000, tetris: 2000000, chess: 3000, flappy: 20000 };

const RESULTS = ['win', 'lose', 'draw'];

// ─── JOY Calculation — per-game tiered formulas (must match src/utils/joyCalculation.js) ─
// Each game defines score→JOY tiers: [threshold, baseJoy, perPoint]
// joy = baseJoy + floor((score - threshold) × perPoint)
// 2026-07-27 — thang điểm trong game đã đổi (combo/hệ số nhân/thưởng cấp). Các
// mốc dưới đây nhân theo hệ số lạm phát của từng game và chia lại perPoint, nên
// JOY cho cùng một trình độ chơi không đổi.
// Hệ số: snake ×6, flappy ×7, tetris ×3, survivor ×3, 2048 ×2, wordguess ×3.
const JOY_TIERS = {
  snake: [
    [0,    2,  0.0833333],  [60,   7,  0.0583333],  [240, 17,  0.0333333],  [600, 29,  0.0200],  [1200,41,  0.0133333],
  ],
  flappy: [
    [0,    2,  0.2142857],  [21,   6,  0.1142857],  [70,  12,  0.0714286],  [175, 20,  0.0428571],
  ],
  tetris: [
    [0,     2,  0.0026667],  [1500,  6,  0.0016667],  [6000, 13,  0.00100],  [18000,25,  0.0006667],
  ],
  survivor: [
    [0,     2,  0.00400],  [600,   4,  0.0026667],  [3000, 10,  0.0016667],  [9000, 20,  0.00100],
  ],
  '2048': [
    [0,     2,  0.0030],  [1000,  5,  0.0020],  [4000, 11,  0.0015],  [16000,29,  0.0005],
  ],
  wordguess: [
    [0,   2,  0.4000],  [15,  8,  0.2666667],  [45, 16,  0.1666667],  [90, 23,  0.1166667],
  ],
  caro: [
    [0,   2,  0.40],   [15,  8,  0.25],   [50, 17,  0.20],   [120,31,  0.12],
  ],
  chess: [
    [0,   2,  0.03],   [100, 5,  0.015],  [500,11,  0.008],  [2000,23, 0.004],
  ],
};

function calcJoy(game, score) {
  const tiers = JOY_TIERS[game];
  if (!tiers) return Math.max(1, Math.floor(score * 0.01));
  let baseJoy = 1, perPoint = 0, threshold = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (score >= tiers[i][0]) {
      threshold = tiers[i][0]; baseJoy = tiers[i][1]; perPoint = tiers[i][2]; break;
    }
  }
  return Math.max(1, Math.floor(baseJoy + (score - threshold) * perPoint));
}

// POST /api/arcade/score — body: { game, score, result, displayName, avatarUrl }
// Endless mode: difficulty is ignored. JOY is calculated purely from score.
router.post('/score', requireMember, async (req, res) => {
  try {
    const { game, score, result, displayName, avatarUrl } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!Object.keys(SCORE_CEILINGS).includes(game)) {
      return res.status(400).json({ error: 'invalid game' });
    }
    const numScore = Number(score);
    if (!Number.isFinite(numScore) || !Number.isInteger(numScore) || numScore < 0 || numScore > SCORE_CEILINGS[game]) {
      return res.status(400).json({ error: 'invalid score' });
    }
    if (!RESULTS.includes(result)) {
      return res.status(400).json({ error: 'invalid result' });
    }

    let doc = await ArcadeScore.findOneAndUpdate(
      { email, game },
      {
        $setOnInsert: { email, game, bestScore: 0, joyAwardedDate: '', joyAwardedToday: 0 },
        $inc: { gamesPlayed: 1 },
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

    // Standardized JOY: joy = max(1, floor(score × rate))
    joyDelta = calcJoy(game, numScore);

    try {
      // Câu mô tả KHÔNG nhắc lại số JOY: `amount` đã là field riêng trên thông
      // báo và được hiện thành "+N JOY" ở cột phải, viết vào đây nữa là người
      // dùng thấy hai lần cùng một con số.
      await awardJoy(
        email, joyDelta, 'arcade_score',
        `${game} — ${numScore.toLocaleString('vi-VN')} điểm`,
        { refId: game }
      );
      joyAwarded = true;
    } catch (e) {
      console.error('[arcade joy award]', e.message);
    }

    await doc.save();
    res.json({ bestScore: doc.bestScore, joyDelta, joyAwarded, dailyCapReached: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function cleanDisplayName(name) {
  if (!name) return 'Thành viên Hugo';
  let str = String(name);
  try {
    if (/[\u00C0-\u00FF]/.test(str)) {
      const decoded = Buffer.from(str, 'latin1').toString('utf8');
      if (decoded && !decoded.includes('')) str = decoded;
    }
  } catch {}
  return str.replace(/[\uFFFD\u007F-\u009F]/g, '').trim() || 'Thành viên Hugo';
}

// GET /api/arcade/leaderboard?game=2048&limit=30
router.get('/leaderboard', async (req, res) => {
  try {
    const { game, limit } = req.query;
    const targetGame = (game && game !== 'all' && Object.keys(SCORE_CEILINGS).includes(game)) ? game : 'all';
    const cap = Math.min(Number(limit) || 30, 100);

    const matchStage = targetGame === 'all' ? {} : { game: targetGame };

    const agg = await ArcadeScore.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $toLower: {
              $trim: { input: { $ifNull: ['$displayName', '$email'] } }
            }
          },
          email: { $first: '$email' },
          displayName: { $first: '$displayName' },
          avatarUrl: { $first: '$avatar' },
          bestScore: { $sum: '$bestScore' },
          gamesPlayed: { $sum: '$gamesPlayed' },
          lastPlayedAt: { $max: '$lastPlayedAt' }
        }
      },
      { $sort: { bestScore: -1, gamesPlayed: -1 } },
      { $limit: cap * 2 }
    ]);

    // Only resolve accounts present in this capped leaderboard. A full Bio scan
    // made this endpoint progressively slower as the member collection grew.
    const leaderboardEmails = [
      ...new Set(
        agg
          .map(item => (item.email || '').toLowerCase().trim())
          .filter(Boolean)
      )
    ];
    const existingBios = await Bio.find({
      $or: [
        { email: { $in: leaderboardEmails } },
        { contactEmail: { $in: leaderboardEmails } }
      ]
    }).select('email contactEmail displayName name').lean();
    const validBioKeys = new Set(
      existingBios.flatMap(b => [
        (b.email || '').toLowerCase().trim(),
        (b.contactEmail || '').toLowerCase().trim(),
        (b.displayName || b.name || '').toLowerCase().trim()
      ]).filter(Boolean)
    );

    const playerMap = new Map();
    for (const item of agg) {
      const cleanName = cleanDisplayName(item.displayName || item.email);
      const normKey = cleanName.toLowerCase().trim();
      const normEmail = (item.email || '').toLowerCase().trim();

      // Exclude deleted accounts that are no longer in Bio
      if (validBioKeys.size > 0 && !validBioKeys.has(normKey) && !validBioKeys.has(normEmail)) {
        continue;
      }

      if (!playerMap.has(normKey)) {
        playerMap.set(normKey, {
          email: item.email || normKey,
          displayName: cleanName,
          avatarUrl: item.avatarUrl || item.avatar || '',
          bestScore: Number(item.bestScore) || 0,
          gamesPlayed: Number(item.gamesPlayed) || 1
        });
      } else {
        const existing = playerMap.get(normKey);
        existing.bestScore += Number(item.bestScore) || 0;
        existing.gamesPlayed += Number(item.gamesPlayed) || 0;
        if (item.avatarUrl && !existing.avatarUrl) existing.avatarUrl = item.avatarUrl;
      }
    }

    const finalList = Array.from(playerMap.values()).sort((a, b) => b.bestScore - a.bestScore).slice(0, cap);

    res.json({ leaderboard: finalList });
  } catch (error) {
    res.json({ leaderboard: [] });
  }
});

// GET /api/arcade/profile?email= — all 3 games' record/bestScore/gamesPlayed in
// one call, used by the lobby + achievement computation (read-only, no abuse surface).
router.get('/profile', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
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
router.get('/me', requireMember, async (req, res) => {
  try {
    const { game } = req.query;
    const email = req.memberEmail;
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
