/**
 * arcadeController.js
 * Controller tập trung toàn bộ logic nghiệp vụ trò chơi HugoArcade.
 */
import ArcadeScore from '../../models/ArcadeScore.js';
import Bio from '../../models/Bio.js';
import { awardJoy } from '../../utils/joyService.js';
import { minorEmailSet } from '../../utils/memberAge.js';
import { getVietnamDateString } from '../../utils/timeUtils.js';

export const SCORE_CEILINGS = { '2048': 2000000, caro: 200, survivor: 80000, snake: 8000, chess: 3000, pinball: 500000 };
export const RESULTS = ['win', 'lose', 'draw'];
export const ARCADE_DAILY_JOY_CAP = 3000;

export async function reserveDailyArcadeJoy(email, amount) {
  if (amount <= 0) return null;
  const today = getVietnamDateString();
  const owner = { $or: [{ email }, { contactEmail: email }] };
  await Bio.updateOne(
    { ...owner, arcadeJoyDate: { $ne: today } },
    { $set: { arcadeJoyDate: today, arcadeJoyToday: 0 } },
  );

  const bio = await Bio.findOne(owner, 'arcadeJoyToday').lean();
  if (!bio) return null;

  const currentToday = bio.arcadeJoyToday || 0;
  const grantAmount = amount;

  const updated = await Bio.findOneAndUpdate(
    { _id: bio._id },
    { $inc: { arcadeJoyToday: grantAmount } },
    { new: true, projection: { arcadeJoyToday: 1 } },
  ).lean();

  return { granted: grantAmount, arcadeJoyToday: updated?.arcadeJoyToday || currentToday + grantAmount };
}

export async function releaseDailyArcadeJoy(email, amount) {
  if (amount <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  await Bio.updateOne(
    { $or: [{ email }, { contactEmail: email }], arcadeJoyDate: today, arcadeJoyToday: { $gte: amount } },
    { $inc: { arcadeJoyToday: -amount } },
  );
}

const SATURDAY_JOY_MULTIPLIER = 2;
export function isSaturdayEvent(date = new Date()) {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000).getUTCDay() === 6;
}

export function getEventMultiplier() {
  return isSaturdayEvent() ? SATURDAY_JOY_MULTIPLIER : 1;
}

export const JOY_TIERS = {
  snake: [
    [0, 2, 0.0833333], [60, 7, 0.0583333], [240, 17, 0.0333333], [600, 29, 0.0200], [1200, 41, 0.0133333],
  ],
  survivor: [
    [0, 1, 0.00150], [600, 2, 0.00100], [3000, 5, 0.00050], [9000, 8, 0.00030],
  ],
  '2048': [
    [0, 2, 0.003], [1000, 5, 0.002], [3000, 9, 0.0015], [8000, 16, 0.0006], [20000, 23, 0.0002], [50000, 29, 0.0001],
  ],
  caro: [
    [0, 2, 0.40], [15, 8, 0.25], [50, 17, 0.20], [120, 31, 0.12],
  ],
  chess: [
    [0, 2, 0.03], [100, 5, 0.015], [500, 11, 0.008], [2000, 23, 0.004],
  ],
  pinball: [
    [0, 2, 0.0001], [10000, 5, 0.00008], [50000, 10, 0.00005], [200000, 20, 0.00003],
  ],
};

export function calcJoy(game, score) {
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

export function cleanDisplayName(name) {
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

const ECO_CARO_JOY = 10;
const ECO_CARO_DAILY_GAMES = 5;
const HAMMER_COST_JOY = 50;
const JELLY_UNLOCK_BONUSES = {
  1: 5, 2: 10, 3: 15, 4: 20, 5: 30, 6: 40, 7: 50, 8: 75,
  9: 100, 10: 150, 11: 250, 12: 350, 13: 500, 14: 750,
  15: 1000, 16: 1500, 17: 2000, 18: 3000, 19: 4000, 20: 5000,
};

// ─── API CON: Gửi điểm chơi ─────────────────────────────────────────────────
export async function postScore(req, res) {
  try {
    const { game, score, result, displayName, avatarUrl } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!Object.keys(SCORE_CEILINGS).includes(game)) {
      return res.status(400).json({ error: 'invalid game' });
    }
    const numScore = Number(score);
    if (!Number.isFinite(numScore) || numScore < 0) {
      return res.status(400).json({ error: 'invalid score' });
    }
    const maxScore = SCORE_CEILINGS[game];
    if (numScore > maxScore) {
      return res.status(400).json({ error: `score exceeds maximum possible for ${game}` });
    }
    if (result && !RESULTS.includes(result)) {
      return res.status(400).json({ error: 'invalid result' });
    }

    const doc = await ArcadeScore.findOneAndUpdate(
      { email, game },
      {
        $setOnInsert: { email, game, bestScore: 0, joyAwardedDate: '', joyAwardedToday: 0 },
        $inc: {
          gamesPlayed: 1,
          ...(result === 'win' ? { wins: 1 } : {}),
          ...(result === 'lose' ? { losses: 1 } : {}),
          ...(result === 'draw' ? { draws: 1 } : {}),
        },
        $set: {
          lastScore: numScore,
          lastPlayedAt: new Date(),
          ...(displayName ? { displayName } : {}),
          ...(avatarUrl ? { avatar: avatarUrl } : {}),
        },
      },
      { upsert: true, new: true },
    );

    if (numScore > doc.bestScore) {
      doc.bestScore = numScore;
    }

    let joyDelta = numScore > 0 ? calcJoy(game, numScore) : 0;
    const joyBase = joyDelta;
    const multiplier = getEventMultiplier();
    joyDelta = Math.min(joyDelta * multiplier, ARCADE_DAILY_JOY_CAP);

    const reservation = await reserveDailyArcadeJoy(email, joyDelta);
    const grantedAmount = reservation ? reservation.granted : 0;
    joyDelta = grantedAmount;
    let joyAwarded = false;

    if (grantedAmount > 0) {
      try {
        await awardJoy(
          email, grantedAmount, 'arcade_score',
          `${game} — ${numScore.toLocaleString('vi-VN')} điểm`,
          { refId: game },
        );
        joyAwarded = true;
      } catch (e) {
        console.error('[arcade joy award]', e.message);
        await releaseDailyArcadeJoy(email, grantedAmount);
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
}

// ─── API CON: Cờ caro Eco ───────────────────────────────────────────────────
export async function postEcoCaro(req, res) {
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
}

// ─── API CON: Bảng xếp hạng ────────────────────────────────────────────────
export async function getLeaderboard(req, res) {
  try {
    const { game, limit } = req.query;
    const targetGame = (game && game !== 'all' && Object.keys(SCORE_CEILINGS).includes(game)) ? game : 'all';
    const cap = Math.min(Number(limit) || 30, 100);
    const matchStage = targetGame === 'all' ? {} : { game: targetGame };

    const agg = await ArcadeScore.aggregate([
      { $match: matchStage },
      { $sort: { lastPlayedAt: -1 } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$email' } } },
          email: { $first: '$email' },
          displayName: { $first: '$displayName' },
          avatarUrl: { $first: '$avatar' },
          bestScore: { $max: '$bestScore' },
          gamesPlayed: { $sum: '$gamesPlayed' },
          lastPlayedAt: { $max: '$lastPlayedAt' },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: cap * 2 },
    ]);

    const leaderboardEmails = agg.map((i) => i.email || i._id).filter(Boolean);
    const bios = await Bio.find(
      { $or: [{ email: { $in: leaderboardEmails } }, { contactEmail: { $in: leaderboardEmails } }] },
      'email contactEmail displayName name',
    ).lean();

    const validBioKeys = new Set(
      bios.flatMap((b) => [
        (b.email || '').toLowerCase().trim(),
        (b.contactEmail || '').toLowerCase().trim(),
        (b.displayName || b.name || '').toLowerCase().trim(),
      ]).filter(Boolean),
    );

    const minors = await minorEmailSet(leaderboardEmails);
    const shortName = (name) => {
      const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
      if (parts.length < 2) return parts[0] || 'Thành viên';
      return `${parts.slice(0, -1).join(' ')} ${parts.at(-1)[0]}.`;
    };

    const finalList = agg
      .filter((item) => {
        const normKey = cleanDisplayName(item.displayName || item.email).toLowerCase().trim();
        const normEmail = (item.email || '').toLowerCase().trim();
        return validBioKeys.size === 0 || validBioKeys.has(normEmail) || validBioKeys.has(normKey);
      })
      .map((item) => {
        const email = String(item.email || item._id || '').toLowerCase();
        const minor = minors.has(email);
        const name = cleanDisplayName(item.displayName || item.email);
        return {
          email: minor ? '' : (item.email || item._id),
          displayName: minor ? shortName(name) : name,
          avatarUrl: item.avatarUrl || '',
          bestScore: Number(item.bestScore) || 0,
          gamesPlayed: Number(item.gamesPlayed) || 1,
        };
      })
      .slice(0, cap);

    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    res.json({ leaderboard: finalList });
  } catch (error) {
    console.error('[arcade leaderboard]', error);
    res.json({ leaderboard: [] });
  }
}

// ─── API CON: Hồ sơ điểm số thành viên ─────────────────────────────────────
export async function getProfile(req, res) {
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
        record: doc?.record || zeroRecord(),
      };
    }
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getMyScore(req, res) {
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
}

// ─── API CON: 2048 Mua búa & Mở khóa nhân vật ──────────────────────────────
export async function buy2048Hammer(req, res) {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email is required' });

    try {
      const { balance } = await awardJoy(
        email,
        -HAMMER_COST_JOY,
        'arcade_hammer',
        'Mua 1 lượt búa phá ô game 2048 (-50 JOY)',
        { refId: '2048', rawAmount: true },
      );
      return res.json({ success: true, balance, cost: HAMMER_COST_JOY, hammersAdded: 1 });
    } catch (e) {
      if (e.message === 'INSUFFICIENT_JOY') {
        return res.status(400).json({
          error: 'INSUFFICIENT_JOY',
          message: 'Bạn không đủ 50 JOY để mua lượt búa phá ô.',
        });
      }
      throw e;
    }
  } catch (error) {
    console.error('[2048 buy hammer]', error);
    res.status(500).json({ error: error.message });
  }
}

export async function unlock2048Character(req, res) {
  try {
    const email = req.memberEmail;
    const level = Number(req.body?.level);
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!Number.isInteger(level) || level < 1 || level > 20) {
      return res.status(400).json({ error: 'invalid character level' });
    }

    let doc = await ArcadeScore.findOne({ email, game: '2048' });
    if (!doc) {
      doc = await ArcadeScore.create({
        email,
        game: '2048',
        unlockedCharacters: [1, 2],
      });
    }

    const currentUnlocked = new Set((doc.unlockedCharacters || []).map(Number));
    if (currentUnlocked.has(level)) {
      return res.json({
        success: true,
        isNew: false,
        bonusJoy: 0,
        unlockedCharacters: Array.from(currentUnlocked).sort((a, b) => a - b),
      });
    }

    currentUnlocked.add(level);
    const sortedUnlocked = Array.from(currentUnlocked).sort((a, b) => a - b);
    doc.unlockedCharacters = sortedUnlocked;
    await doc.save();

    const bonusJoy = JELLY_UNLOCK_BONUSES[level] || 10;
    try {
      await awardJoy(
        email,
        bonusJoy,
        'arcade_character_unlock',
        `Mở khóa nhân vật Jelly mới Cấp ${level} trong 2048 (+${bonusJoy} JOY)`,
        { refId: `2048_c_${level}`, rawAmount: true },
      );
    } catch (e) {
      console.error('[2048 unlock joy award error]', e.message);
    }

    return res.json({
      success: true,
      isNew: true,
      bonusJoy,
      level,
      unlockedCharacters: sortedUnlocked,
    });
  } catch (error) {
    console.error('[2048 unlock character]', error);
    res.status(500).json({ error: error.message });
  }
}

export async function get2048Collection(req, res) {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const doc = await ArcadeScore.findOne({ email, game: '2048' }).lean();
    const unlocked = Array.from(new Set(doc?.unlockedCharacters?.length ? doc.unlockedCharacters : [1, 2])).sort((a, b) => a - b);
    res.json({ unlockedCharacters: unlocked, totalCharacters: 20 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function get2048CollectionLeaderboard(req, res) {
  try {
    const docs = await ArcadeScore.find({ game: '2048' })
      .select('displayName avatar unlockedCharacters bestScore')
      .lean();

    const leaderboard = docs
      .map((d) => ({
        displayName: cleanDisplayName(d.displayName || 'Người chơi 2048'),
        avatarUrl: d.avatar || '',
        collectionCount: (d.unlockedCharacters || []).length || 2,
        bestScore: d.bestScore || 0,
      }))
      .sort((a, b) => b.collectionCount - a.collectionCount || b.bestScore - a.bestScore)
      .slice(0, 30);

    res.set('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    res.json({ leaderboard });
  } catch (error) {
    console.error('[2048 collection leaderboard]', error);
    res.json({ leaderboard: [] });
  }
}
