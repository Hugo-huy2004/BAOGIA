import express from 'express';
import ArcadeScore from '../models/ArcadeScore.js';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { requireMember } from '../middleware/authMiddleware.js';
import { minorEmailSet } from '../utils/memberAge.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Per-game score ceilings — reject obviously implausible/forged values outright.
// Not full replay verification, just sanity bounds; real abuse resistance comes
// from the win/loss-driven reward table + shared daily net-JOY cap below.
// Nới theo thang điểm mới (combo + hệ số nhân + thưởng cấp) — vẫn chỉ là chặn
// giá trị bịa đặt, không phải xác thực ván chơi.
//
// Đây cũng là danh sách trắng game duy nhất của server: 3 game gỡ khỏi hệ thống
// (tetris/flappy/wordguess) không còn ở đây nên điểm mới bị từ chối. Điểm CŨ
// trong DB vẫn đọc được bình thường — không xoá dữ liệu người chơi đã đạt.
const SCORE_CEILINGS = { '2048': 1000000, caro: 200, survivor: 80000, snake: 8000, chess: 3000 };

const RESULTS = ['win', 'lose', 'draw'];
const ARCADE_DAILY_JOY_CAP = 150;
const scoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 40 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Gửi kết quả quá nhanh. Vui lòng thử lại sau ít phút.' },
});

async function reserveDailyArcadeJoy(email, amount) {
  if (amount <= 0 || amount > ARCADE_DAILY_JOY_CAP) return null;
  const today = new Date().toISOString().slice(0, 10);
  const owner = { $or: [{ email }, { contactEmail: email }] };
  await Bio.updateOne(
    { ...owner, arcadeJoyDate: { $ne: today } },
    { $set: { arcadeJoyDate: today, arcadeJoyToday: 0 } },
  );
  return Bio.findOneAndUpdate(
    { ...owner, arcadeJoyDate: today, arcadeJoyToday: { $lte: ARCADE_DAILY_JOY_CAP - amount } },
    { $inc: { arcadeJoyToday: amount } },
    { new: true, projection: { arcadeJoyToday: 1 } },
  ).lean();
}

async function releaseDailyArcadeJoy(email, amount) {
  const today = new Date().toISOString().slice(0, 10);
  await Bio.updateOne(
    { $or: [{ email }, { contactEmail: email }], arcadeJoyDate: today, arcadeJoyToday: { $gte: amount } },
    { $inc: { arcadeJoyToday: -amount } },
  );
}

// ─── Saturday 2x JOY Event ──────────────────────────────────────────────────
// Every Saturday (00:00–23:59:59 Vietnam time, UTC+7) all arcade games award
// 2× JOY — commemorating the Resurrection and salvation of the Son of God.
const SATURDAY_JOY_MULTIPLIER = 2;

// ponytail: cộng 7h rồi đọc theo UTC — đúng dù máy chủ chạy múi giờ nào.
export function isSaturdayEvent(date = new Date()) {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).getUTCDay() === 6;
}

function getEventMultiplier() {
  return isSaturdayEvent() ? SATURDAY_JOY_MULTIPLIER : 1;
}

// ─── JOY Calculation — per-game tiered formulas (must match src/utils/joyCalculation.js) ─
// Each game defines score→JOY tiers: [threshold, baseJoy, perPoint]
// joy = baseJoy + floor((score - threshold) × perPoint)
// 2026-07-27 — thang điểm trong game đã đổi (combo/hệ số nhân/thưởng cấp). Các
// mốc dưới đây nhân theo hệ số lạm phát của từng game và chia lại perPoint, nên
// JOY cho cùng một trình độ chơi không đổi.
// Hệ số: snake ×6, survivor ×3, 2048 ×2.
const JOY_TIERS = {
  snake: [
    [0,    2,  0.0833333],  [60,   7,  0.0583333],  [240, 17,  0.0333333],  [600, 29,  0.0200],  [1200,41,  0.0133333],
  ],
  survivor: [
    [0,     1,  0.00150],  [600,   2,  0.00100],  [3000,  5,  0.00050],  [9000,  8,  0.00030],
  ],
  '2048': [
    [0,     5.5,  0.0055],  [1000,  11,   0.0055],  [2000,  16.5, 0.0055],  [4000,  27.5, 0.0055],
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
router.post('/score', requireMember, scoreLimiter, async (req, res) => {
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
    joyDelta = numScore > 0 ? calcJoy(game, numScore) : 0;
    const joyBase = joyDelta;

    // Nhân đôi thứ Bảy, rồi KẸP xuống trần ngày: reserveDailyArcadeJoy từ chối
    // thẳng (trả null) khoản lớn hơn trần, nên không kẹp thì ván điểm cao vào
    // thứ Bảy mất sạch JOY thay vì nhận tối đa.
    const multiplier = getEventMultiplier();
    joyDelta = Math.min(joyDelta * multiplier, ARCADE_DAILY_JOY_CAP);

    const reservation = await reserveDailyArcadeJoy(email, joyDelta);
    if (!reservation) joyDelta = 0;

    if (joyDelta > 0) {
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
        await releaseDailyArcadeJoy(email, joyDelta);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    if (doc.joyAwardedDate !== today) {
      doc.joyAwardedDate = today;
      doc.joyAwardedToday = 0;
    }
    if (joyAwarded) doc.joyAwardedToday += joyDelta;

    await doc.save();
    res.json({
      bestScore: doc.bestScore,
      joyDelta,
      joyBase,
      joyAwarded,
      multiplier,
      event: multiplier > 1 ? 'resurrection_saturday' : null,
      dailyCapReached: !reservation || Number(reservation.arcadeJoyToday) >= ARCADE_DAILY_JOY_CAP,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Cờ ca-rô trong chế độ Bảo vệ môi trường ─────────────────────────────────
// Thắng +10 JOY, thua -10 JOY. Kết quả do máy người dùng tự báo (game chạy hoàn
// toàn ngoại tuyến), nên chặn lạm dụng bằng hạn mức ngày thay vì tin lời client.
const ECO_CARO_JOY = 10;
const ECO_CARO_DAILY_GAMES = 5;

router.post('/eco-caro', requireMember, async (req, res) => {
  try {
    const { result } = req.body;
    if (!['win', 'lose'].includes(result)) {
      return res.status(400).json({ error: 'invalid result' });
    }
    const email = req.memberEmail;
    const today = new Date().toISOString().slice(0, 10);

    const doc = await ArcadeScore.findOneAndUpdate(
      { email, game: 'caro' },
      {
        $setOnInsert: { email, game: 'caro', bestScore: 0 },
        $inc: { gamesPlayed: 1 },
        $set: { lastPlayedAt: new Date() },
      },
      { upsert: true, new: true },
    );

    if (doc.joyAwardedDate !== today) {
      doc.joyAwardedDate = today;
      doc.joyAwardedToday = 0;
    }
    if (doc.joyAwardedToday >= ECO_CARO_DAILY_GAMES) {
      await doc.save();
      return res.json({ joyDelta: 0, reason: 'daily_cap', remainingGames: 0 });
    }

    const delta = result === 'win' ? ECO_CARO_JOY : -ECO_CARO_JOY;
    const ecoMultiplier = getEventMultiplier();
    const adjustedDelta = delta > 0 ? delta * ecoMultiplier : delta;
    try {
      await awardJoy(email, adjustedDelta, 'arcade_score', `Cờ ca-rô (chế độ tiết kiệm) — ${result === 'win' ? 'thắng' : 'thua'}`, { refId: 'caro' });
    } catch (error) {
      // Không đủ JOY để trừ thì bỏ qua ván này, không đẩy số dư xuống âm.
      if (error.message === 'INSUFFICIENT_JOY') {
        await doc.save();
        return res.json({ joyDelta: 0, reason: 'insufficient', remainingGames: ECO_CARO_DAILY_GAMES - doc.joyAwardedToday });
      }
      throw error;
    }

    doc.joyAwardedToday += 1;
    await doc.save();
    return res.json({
      joyDelta: adjustedDelta,
      multiplier: ecoMultiplier,
      event: ecoMultiplier > 1 ? 'resurrection_saturday' : null,
      remainingGames: ECO_CARO_DAILY_GAMES - doc.joyAwardedToday,
    });
  } catch (error) {
    console.error('[eco caro]', error);
    return res.status(500).json({ error: error.message });
  }
});

function cleanDisplayName(name) {
  if (!name) return 'Thành viên Hugo';
  let str = String(name);
  try {
    if (/[\u00C0-\u00FF]/.test(str)) {
      const decoded = Buffer.from(str, 'latin1').toString('utf8');
      if (decoded && !decoded.includes('�')) str = decoded;
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
      // Gom theo email, không theo tên: đổi tên hiển thị từng làm một người tách
      // thành nhiều dòng và chia nhỏ điểm. $sort trước để $first lấy tên/avatar mới nhất.
      { $sort: { lastPlayedAt: -1 } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$email' } } },
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

    // Bảng xếp hạng là trang công khai: thành viên dưới 18 hiện dưới dạng tên
    // rút gọn và không kèm email, để không ai lần ra tài khoản thật của trẻ.
    const minors = await minorEmailSet(leaderboardEmails);
    const shortName = (name) => {
      const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
      if (parts.length < 2) return parts[0] || 'Thành viên';
      return `${parts.slice(0, -1).join(' ')} ${parts.at(-1)[0]}.`;
    };

    const finalList = agg
      .filter(item => {
        const normKey = cleanDisplayName(item.displayName || item.email).toLowerCase().trim();
        const normEmail = (item.email || '').toLowerCase().trim();
        // Exclude deleted accounts that are no longer in Bio
        return validBioKeys.size === 0 || validBioKeys.has(normEmail) || validBioKeys.has(normKey);
      })
      .map(item => {
        const email = String(item.email || item._id || '').toLowerCase();
        const minor = minors.has(email);
        const name = cleanDisplayName(item.displayName || item.email);
        return {
          email: minor ? '' : (item.email || item._id),
          displayName: minor ? shortName(name) : name,
          avatarUrl: item.avatarUrl || '',
          bestScore: Number(item.bestScore) || 0,
          gamesPlayed: Number(item.gamesPlayed) || 1
        };
      })
      .slice(0, cap);

    res.json({ leaderboard: finalList });
  } catch (error) {
    // Đừng nuốt im: một ReferenceError ở đây từng làm bảng xếp hạng rỗng cả tháng.
    console.error('[arcade leaderboard]', error);
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
