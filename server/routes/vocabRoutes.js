import express from 'express';
import VocabCard from '../models/VocabCard.js';
import VocabProgress from '../models/VocabProgress.js';
import VocabProfile from '../models/VocabProfile.js';
import { requireMember, requireAdmin } from '../middleware/authMiddleware.js';
import { schedule, nextStreak, dayKey, ewma, bumpHistory, projectDaysToGoal, coachTip } from '../services/vocabSrs.js';
import Friendship from '../models/Friendship.js';
import Bio from '../models/Bio.js';

const router = express.Router();

// Hai KHOÁ học độc lập. Số từ mỗi cấp theo đúng bảng Boss cung cấp (lượng từ
// tích luỹ của mỗi kỳ thi). Mỗi khoá có hệ cấp riêng, người học chọn một.
const TRACKS = {
  simplified: {
    label: '简体字 · HSK',
    decks: ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'],
    target: { hsk1: 150, hsk2: 300, hsk3: 600, hsk4: 1200, hsk5: 2500, hsk6: 5000 },
  },
  traditional: {
    label: '繁體字 · TOCFL',
    decks: ['tocfl1', 'tocfl2', 'tocfl3', 'tocfl4', 'tocfl5', 'tocfl6'],
    target: { tocfl1: 500, tocfl2: 1000, tocfl3: 2500, tocfl4: 5000, tocfl5: 8000, tocfl6: 8000 },
  },
};
const trackOf = (t) => TRACKS[t] || TRACKS.simplified;
const DECKS = [...TRACKS.simplified.decks, ...TRACKS.traditional.decks];


// Bậc NÊN học lúc này — học theo trình độ, và KHÔNG bao giờ trỏ vào bậc rỗng.
// Bắt đầu từ trình độ đã xếp lớp, tìm bậc đầu tiên CÓ nội dung và CHƯA thuộc
// hết. Nếu từ bậc đó lên không có nội dung (bậc cao chưa soạn), lùi về bậc thấp
// nhất còn nội dung chưa thuộc — người học luôn có cái để học, không kẹt.
// Số thẻ đã duyệt mỗi cấp là DÙNG CHUNG cho mọi người và ít đổi — cache 5 phút
// để khỏi quét cả kho (10k thẻ) mỗi lần mở app. Nạp thêm nội dung thì hết TTL
// là tự cập nhật.
let _contentCache = { at: 0, data: null };
async function contentTotals() {
  if (_contentCache.data && Date.now() - _contentCache.at < 5 * 60 * 1000) return _contentCache.data;
  const rows = await VocabCard.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$deck', n: { $sum: 1 } } }]);
  _contentCache = { at: Date.now(), data: Object.fromEntries(rows.map((r) => [r._id, r.n])) };
  return _contentCache.data;
}
async function deckStats(email) {
  const [total, masteredRows] = await Promise.all([
    contentTotals(),
    VocabProgress.aggregate([{ $match: { email, status: 'mastered' } }, { $group: { _id: '$deck', n: { $sum: 1 } } }]),
  ]);
  return { total, mastered: Object.fromEntries(masteredRows.map((r) => [r._id, r.n])) };
}
// Chọn bậc đang học từ số liệu CÓ SẴN (thuần, không truy vấn) — để /status khỏi
// tính deckStats hai lần.
function pickActiveDeck(total, mastered, ladder, testedOutThrough) {
  const startIdx = ladder.indexOf(testedOutThrough || '') + 1;
  for (let i = startIdx; i < ladder.length; i++) {
    const d = ladder[i];
    if ((total[d] || 0) > 0 && (mastered[d] || 0) < total[d]) return d;
  }
  return null;
}

// Bậc NÊN học lúc này. Bắt đầu từ bậc KẾ bậc đã vượt (testedOutThrough) — không
// bắt học lại bậc đã đạt — rồi tìm bậc đầu tiên CÓ nội dung + chưa thuộc hết.
// KHÔNG lùi xuống bậc đã vượt. Chưa có nội dung ở bậc kế → trả null (bậc mới
// "sắp ra mắt", người học đã sẵn sàng, không có gì để cày lại).
async function computeActiveDeck(email, ladder, testedOutThrough) {
  const { total, mastered } = await deckStats(email);
  return pickActiveDeck(total, mastered, ladder, testedOutThrough);
}

// GET /api/vocab/decks — danh sách bộ + số thẻ đã duyệt + tiến độ của người dùng.
router.get('/decks', requireMember, async (req, res) => {
  try {
    const [cardCounts, myCounts] = await Promise.all([
      VocabCard.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$deck', total: { $sum: 1 } } }]),
      VocabProgress.aggregate([{ $match: { email: req.memberEmail } }, { $group: { _id: '$deck', learned: { $sum: 1 }, mastered: { $sum: { $cond: [{ $eq: ['$status', 'mastered'] }, 1, 0] } } } }]),
    ]);
    const totalBy = Object.fromEntries(cardCounts.map((c) => [c._id, c.total]));
    const mineBy = Object.fromEntries(myCounts.map((c) => [c._id, c]));
    const decks = DECKS.filter((d) => totalBy[d]).map((d) => ({
      deck: d,
      total: totalBy[d] || 0,
      learned: mineBy[d]?.learned || 0,
      mastered: mineBy[d]?.mastered || 0,
    }));
    res.json({ decks });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/due?deck=hsk1 — thẻ CẦN ôn bây giờ + thẻ mới trong hạn mức ngày.
// Trả về cả thẻ để client dựng phiên học ngay, không phải gọi thêm.
router.get('/due', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const profile = await VocabProfile.findOne({ email }, 'track testedOutThrough').lean();
    const ladder = trackOf(profile?.track).decks;
    let deck = req.query.deck;
    if (!ladder.includes(deck)) deck = await computeActiveDeck(email, ladder, profile?.testedOutThrough) || ladder[0];

    // Thẻ đến hạn ôn (đã học trước đó).
    const dueProg = await VocabProgress.find({ email, deck, dueAt: { $lte: new Date() } })
      .sort({ dueAt: 1 }).limit(60).lean();
    const dueIds = dueProg.map((p) => p.cardId);
    const dueCards = dueIds.length ? await VocabCard.find({ _id: { $in: dueIds } }).lean() : [];
    const cardById = Object.fromEntries(dueCards.map((c) => [String(c._id), c]));

    // KHÔNG giới hạn số từ/ngày — người học nhanh nhớ cả trăm từ/ngày cứ để họ
    // học. Chỉ trả một MẺ (SESSION_NEW) mỗi lần cho nhẹ; học hết mẻ, client gọi
    // lại /due là có mẻ mới → không có trần.
    const SESSION_NEW = 40;
    const seenIds = await VocabProgress.find({ email, deck }).distinct('cardId');
    const freshCards = await VocabCard.find({ deck, status: 'approved', _id: { $nin: seenIds } })
      .sort({ order: 1 }).limit(SESSION_NEW).lean();

    let queue = [
      ...dueProg.map((p) => ({ ...cardById[String(p.cardId)], progress: p, kind: 'review' })).filter((x) => x._id),
      ...freshCards.map((c) => ({ ...c, progress: null, kind: 'new' })),
    ];

    // LUÔN CÓ THẺ ĐỂ HỌC: hết thẻ mới + chưa tới hạn ôn thì cho "ôn sớm" những
    // thẻ có hạn gần nhất. Người muốn học nữa không bao giờ gặp màn trống.
    if (queue.length === 0) {
      const ahead = await VocabProgress.find({ email, deck, status: { $ne: 'mastered' } })
        .sort({ dueAt: 1 }).limit(20).lean();
      const aheadCards = ahead.length ? await VocabCard.find({ _id: { $in: ahead.map((a) => a.cardId) } }).lean() : [];
      const byId = Object.fromEntries(aheadCards.map((c) => [String(c._id), c]));
      queue = ahead.map((a) => ({ ...byId[String(a.cardId)], progress: a, kind: 'ahead' })).filter((x) => x._id);
    }
    res.json({ deck, dueCount: dueProg.length, newCount: freshCards.length, ahead: queue.length > 0 && dueProg.length === 0 && freshCards.length === 0, queue });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/review { cardId, grade } — chấm một thẻ, cập nhật lịch ôn.
router.post('/review', requireMember, async (req, res) => {
  try {
    const { cardId, grade } = req.body || {};
    if (!cardId || ![0, 1, 2, 3].includes(Number(grade))) {
      return res.status(400).json({ error: 'Thiếu cardId hoặc grade (0-3).' });
    }
    const card = await VocabCard.findOne({ _id: cardId, status: 'approved' }).lean();
    if (!card) return res.status(404).json({ error: 'Không tìm thấy thẻ.' });

    const prior = await VocabProgress.findOne({ email: req.memberEmail, cardId }).lean();
    const next = schedule(prior || {}, Number(grade));
    const saved = await VocabProgress.findOneAndUpdate(
      { email: req.memberEmail, cardId },
      { $set: { ...next, deck: card.deck }, $setOnInsert: { email: req.memberEmail, cardId } },
      { upsert: true, new: true },
    ).lean();

    // Chuỗi ngày + BỘ THEO DÕI THÍCH ỨNG: mỗi lượt ôn cập nhật streak, độ chính
    // xác/tốc độ (EWMA) và nhật ký ngày cho biểu đồ tiến độ.
    const profile = await VocabProfile.findOne({ email: req.memberEmail }, 'streak lastStudyDay reviewsToday accuracy avgMs history').lean();
    const today = dayKey();
    const yesterday = dayKey(Date.now() - 86400000);
    const st = nextStreak(profile || {}, today, yesterday);
    const g = Number(grade);
    const correct = g >= 2 ? 1 : 0;
    const isNew = !prior;                         // lần đầu gặp thẻ này = học từ mới
    const ms = Number(req.body?.ms);
    const set = {
      ...st,
      accuracy: ewma(profile?.accuracy, correct),
      history: bumpHistory(profile?.history, today, { r: 1, c: correct, n: isNew ? 1 : 0 }),
    };
    if (Number.isFinite(ms) && ms > 200 && ms < 60000) set.avgMs = ewma(profile?.avgMs, ms);
    await VocabProfile.updateOne(
      { email: req.memberEmail },
      { $set: set, $inc: { reviews: 1, easyReviews: g === 3 ? 1 : 0, againReviews: g === 0 ? 1 : 0 }, $setOnInsert: { email: req.memberEmail } },
      { upsert: true },
    );

    res.json({ success: true, progress: saved, streak: st.streak, reviewsToday: st.reviewsToday, known: saved.status === 'mastered' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/progress — số liệu tổng cho trang chủ app + % tới HSK3.
router.get('/progress', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const profile0 = await VocabProfile.findOne({ email }, 'streak lastStudyDay reviewsToday dailyGoal testedOutThrough track').lean();
    const track = trackOf(profile0?.track);
    const GOAL_DECKS = track.decks;
    // Số liệu kho lấy từ CACHE (không quét thẻ). Tiến độ người dùng: gộp còn 2 truy vấn.
    const [content, byStatus, byDeckMastered, dueNow] = await Promise.all([
      contentTotals(),
      VocabProgress.aggregate([{ $match: { email } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
      VocabProgress.aggregate([{ $match: { email, status: 'mastered' } }, { $group: { _id: '$deck', n: { $sum: 1 } } }]),
      VocabProgress.countDocuments({ email, dueAt: { $lte: new Date() } }),
    ]);
    const profile = profile0;
    const goalTotal = GOAL_DECKS.reduce((a, d) => a + (content[d] || 0), 0);
    const masteredByDeck = Object.fromEntries(byDeckMastered.map((r) => [r._id, r.n]));
    const goalMastered = GOAL_DECKS.reduce((a, d) => a + (masteredByDeck[d] || 0), 0);
    const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
    const learned = (counts.learning || 0) + (counts.review || 0) + (counts.mastered || 0);
    // Chuỗi chỉ còn giá trị nếu học hôm nay hoặc hôm qua; bỏ cách ngày thì coi như 0.
    const today = dayKey(); const yesterday = dayKey(Date.now() - 86400000);
    const liveStreak = (profile?.lastStudyDay === today || profile?.lastStudyDay === yesterday) ? (profile.streak || 0) : 0;
    const reviewsToday = profile?.lastStudyDay === today ? (profile.reviewsToday || 0) : 0;
    const dailyGoal = profile?.dailyGoal || 20;
    // Bậc đã VƯỢT ở test xếp lớp tính 100% vào tiến độ (không cày lại).
    const toIdx = GOAL_DECKS.indexOf(profile?.testedOutThrough || '');
    const testedOutCards = toIdx >= 0 ? GOAL_DECKS.slice(0, toIdx + 1).reduce((a, d) => a + (content[d] || 0), 0) : 0;
    const effectiveMastered = Math.min(goalTotal, goalMastered + testedOutCards);
    res.json({
      learned,
      mastered: counts.mastered || 0,
      learning: (counts.learning || 0) + (counts.review || 0),
      dueNow,
      track: profile?.track || null,
      goalDeck: GOAL_DECKS[GOAL_DECKS.length - 1],
      goalTotal,
      goalMastered: effectiveMastered,
      goalPercent: goalTotal ? Math.round((effectiveMastered / goalTotal) * 100) : 0,
      streak: liveStreak,
      reviewsToday,
      dailyGoal,
      goalMet: reviewsToday >= dailyGoal,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/insights — CỐ VẤN THÔNG MINH: tiến độ khoa học + định hướng
// "hôm nay học gì" + từ hay quên + dự phóng ngày đạt mục tiêu.
router.get('/insights', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const profile = await VocabProfile.findOne({ email }).lean();
    if (!profile?.track) return res.json({ needsTrack: true });
    const track = trackOf(profile.track);
    const ladder = track.decks;
    const now = new Date();
    const in7 = new Date(Date.now() + 7 * 86400000);

    const [content, byStatus, byDeckMastered, overdue, dueSoon, weakProg] = await Promise.all([
      contentTotals(),
      VocabProgress.aggregate([{ $match: { email } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
      VocabProgress.aggregate([{ $match: { email, status: 'mastered' } }, { $group: { _id: '$deck', n: { $sum: 1 } } }]),
      VocabProgress.countDocuments({ email, dueAt: { $lte: now } }),
      VocabProgress.aggregate([
        { $match: { email, dueAt: { $gt: now, $lte: in7 } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$dueAt' } }, n: { $sum: 1 } } },
      ]),
      VocabProgress.find({ email, lapses: { $gte: 2 }, status: { $ne: 'mastered' } }).sort({ lapses: -1, dueAt: 1 }).limit(8).lean(),
    ]);

    const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
    const statusCounts = { new: counts.new || 0, learning: counts.learning || 0, review: counts.review || 0, mastered: counts.mastered || 0 };
    // Mục tiêu = tổng từ khoá; đã thuộc + bậc đã vượt tính 100% (như /progress).
    const goalTotal = ladder.reduce((a, d) => a + (content[d] || 0), 0);
    const masteredByDeck = Object.fromEntries(byDeckMastered.map((r) => [r._id, r.n]));
    const goalMasteredRaw = ladder.reduce((a, d) => a + (masteredByDeck[d] || 0), 0);
    const toIdx = ladder.indexOf(profile.testedOutThrough || '');
    const testedOutCards = toIdx >= 0 ? ladder.slice(0, toIdx + 1).reduce((a, d) => a + (content[d] || 0), 0) : 0;
    const mastered = Math.min(goalTotal, goalMasteredRaw + testedOutCards);
    const remaining = Math.max(0, goalTotal - mastered);

    // Nhịp học gần đây từ nhật ký → dự phóng ngày đạt mục tiêu (thận trọng).
    const hist = Array.isArray(profile.history) ? profile.history.slice(-7) : [];
    const activeDays = hist.filter((h) => (h.r || 0) > 0).length || 1;
    const newPerDay = hist.reduce((a, h) => a + (h.n || 0), 0) / activeDays;
    const elapsedDays = profile.startedAt ? Math.max(1, (Date.now() - new Date(profile.startedAt).getTime()) / 86400000) : 1;
    const masteredPerDay = Math.max(newPerDay * 0.7, mastered / elapsedDays);
    const daysToGoal = projectDaysToGoal(remaining, masteredPerDay);
    const etaDate = Number.isFinite(daysToGoal) ? new Date(Date.now() + daysToGoal * 86400000).toISOString().slice(0, 10) : null;

    // Dự báo 7 ngày (kể cả 0) để vẽ cột.
    const dueMap = Object.fromEntries(dueSoon.map((r) => [r._id, r.n]));
    const forecast = [];
    for (let i = 1; i <= 7; i++) { const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10); forecast.push({ d, n: dueMap[d] || 0 }); }

    // Từ hay quên → luyện lại.
    const weakCards = weakProg.length ? await VocabCard.find({ _id: { $in: weakProg.map((w) => w.cardId) } }).lean() : [];
    const byId = Object.fromEntries(weakCards.map((c) => [String(c._id), c]));
    const weak = weakProg.map((w) => { const c = byId[String(w.cardId)]; return c && { _id: c._id, hanzi: c.hanzi, pinyin: c.pinyin, meaning: c.meaning, meaningEn: c.meaningEn, hanViet: c.hanViet, lapses: w.lapses }; }).filter(Boolean);

    const today = dayKey(); const yesterday = dayKey(Date.now() - 86400000);
    const streakAlive = profile.lastStudyDay === today || profile.lastStudyDay === yesterday;
    const studiedToday = profile.lastStudyDay === today;
    const dailyGoal = profile.dailyGoal || 20;
    const reviewsToday = studiedToday ? (profile.reviewsToday || 0) : 0;
    // "Hôm nay học gì": ôn hết đến hạn + học mới bù cho đủ mục tiêu ngày.
    const reviewRec = overdue;
    const newRec = Math.max(0, Math.min(20, dailyGoal - reviewsToday - Math.min(overdue, dailyGoal)));
    const tip = coachTip({ streakAlive, studiedToday, dueNow: overdue, overdue, weakCount: weak.length, accuracy: profile.accuracy, remaining, newRec, reviewRec });

    res.json({
      track: profile.track, trackLabel: track.label,
      goalDeck: ladder[ladder.length - 1], goalTotal, mastered, remaining,
      percent: goalTotal ? Math.round((mastered / goalTotal) * 100) : 0,
      statusCounts,
      accuracy: profile.accuracy ? Math.round(profile.accuracy * 100) : null,
      avgSec: profile.avgMs ? Math.round(profile.avgMs / 100) / 10 : null,
      streak: streakAlive ? (profile.streak || 0) : 0, studiedToday,
      dailyGoal, reviewsToday, goalMet: reviewsToday >= dailyGoal,
      dueNow: overdue, forecast, weak,
      plan: { review: reviewRec, learn: newRec },
      etaDays: Number.isFinite(daysToGoal) ? daysToGoal : null, etaDate,
      history: (profile.history || []).slice(-14),
      tip,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/board — bảng "Bạn học": tiến độ của bạn + bạn bè để cùng cố gắng.
router.get('/board', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const links = await Friendship.find({ members: email, status: 'accepted' }).select('members').lean();
    const emails = [...new Set([email, ...links.flatMap((l) => l.members)])];
    const [profiles, masteredRows, bios] = await Promise.all([
      VocabProfile.find({ email: { $in: emails }, track: { $ne: null } }).select('email track streak lastStudyDay history').lean(),
      VocabProgress.aggregate([{ $match: { email: { $in: emails }, status: 'mastered' } }, { $group: { _id: '$email', n: { $sum: 1 } } }]),
      Bio.find({ email: { $in: emails } }).select('email displayName slug avatarUrl').lean(),
    ]);
    const masteredBy = Object.fromEntries(masteredRows.map((r) => [r._id, r.n]));
    const bioBy = Object.fromEntries(bios.map((b) => [b.email, b]));
    const today = dayKey(); const yesterday = dayKey(Date.now() - 86400000);
    const rows = profiles.map((p) => {
      const alive = p.lastStudyDay === today || p.lastStudyDay === yesterday;
      const weekly = (p.history || []).slice(-7).reduce((a, h) => a + (h.r || 0), 0);
      const b = bioBy[p.email] || {};
      return {
        me: p.email === email,
        email: p.email === email ? p.email : undefined, // chỉ lộ email của chính mình
        name: b.displayName || (p.email === email ? 'Bạn' : p.email.split('@')[0]),
        avatar: b.avatarUrl || '', slug: b.slug || '',
        track: p.track, mastered: masteredBy[p.email] || 0,
        streak: alive ? (p.streak || 0) : 0, weekly,
      };
    }).sort((a, b) => b.mastered - a.mastered || b.streak - a.streak || b.weekly - a.weekly);
    res.json({ rows, friendCount: Math.max(0, emails.length - 1) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/friends — danh sách bạn bè (để chọn khi gửi từ). Chỉ bạn đã kết.
router.get('/friends', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const links = await Friendship.find({ members: email, status: 'accepted' }).select('members').lean();
    const others = [...new Set(links.flatMap((l) => l.members).filter((m) => m !== email))];
    if (!others.length) return res.json({ friends: [] });
    const bios = await Bio.find({ email: { $in: others } }).select('email displayName avatarUrl').lean();
    const bioBy = Object.fromEntries(bios.map((b) => [b.email, b]));
    const online = global.wsClients || {};
    res.json({ friends: others.map((e) => ({ email: e, name: bioBy[e]?.displayName || e.split('@')[0], avatar: bioBy[e]?.avatarUrl || '', online: Boolean(online[e]?.size) })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/toss-friend { to, card } — tung một thẻ sang BẠN đang online.
router.post('/toss-friend', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const to = String(req.body?.to || '').toLowerCase().trim();
    const card = req.body?.card;
    if (!to || !card?.hanzi) return res.status(400).json({ error: 'Thiếu người nhận hoặc thẻ.' });
    const friend = await Friendship.findOne({ members: { $all: [email, to] }, status: 'accepted' }).lean();
    if (!friend) return res.status(403).json({ error: 'Chỉ tung được cho bạn bè.' });
    const me = await Bio.findOne({ email }).select('displayName').lean();
    const s = (v) => (v == null ? undefined : String(v).slice(0, 160));
    const payload = JSON.stringify({ type: 'vocab:toss', from: me?.displayName || 'Một người bạn', card: {
      hanzi: s(card.hanzi), pinyin: s(card.pinyin), meaning: s(card.meaning), meaningEn: s(card.meaningEn),
      hanViet: s(card.hanViet), example: s(card.example), examplePinyin: s(card.examplePinyin), exampleMeaning: s(card.exampleMeaning),
    } });
    let delivered = 0;
    const sockets = global.wsClients?.[to];
    if (sockets) for (const ws of sockets) { if (ws.readyState === 1) { ws.send(payload); delivered += 1; } }
    res.json({ success: true, delivered });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/lookup { words: [...] } — tra pinyin/nghĩa cho các từ Hán xuất
// hiện trong bài Today (chế độ tiếng Trung). Chỉ trả từ CÓ trong giáo trình để
// mỗi từ gạch chân đều bấm ra được cách đọc + nghĩa + "học".
router.post('/lookup', requireMember, async (req, res) => {
  try {
    const words = Array.isArray(req.body?.words)
      ? [...new Set(req.body.words.filter((w) => typeof w === 'string' && w))].slice(0, 300)
      : [];
    if (!words.length) return res.json({ found: {} });
    const cards = await VocabCard.find({ hanzi: { $in: words }, status: 'approved' })
      .select('hanzi pinyin meaning meaningEn hanViet deck').lean();
    const found = {};
    for (const c of cards) if (!found[c.hanzi]) {
      found[c.hanzi] = { cardId: c._id, hanzi: c.hanzi, pinyin: c.pinyin, meaning: c.meaning, meaningEn: c.meaningEn, hanViet: c.hanViet, deck: c.deck };
    }
    res.json({ found });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/queue-card { cardId } — thêm một từ (gặp khi đọc báo) vào hàng ôn.
router.post('/queue-card', requireMember, async (req, res) => {
  try {
    const cardId = req.body?.cardId;
    const card = cardId && await VocabCard.findOne({ _id: cardId, status: 'approved' }).select('deck').lean();
    if (!card) return res.status(404).json({ error: 'Không tìm thấy thẻ.' });
    await VocabProgress.updateOne(
      { email: req.memberEmail, cardId },
      { $setOnInsert: { email: req.memberEmail, cardId, deck: card.deck, status: 'new', dueAt: new Date() } },
      { upsert: true },
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── TEST XẾP LỚP (đầu vào) & TEST HOÀN TẤT (đầu ra) ──────────────────────────
// "Chưa test thì chưa cho học": /due & /review vẫn chạy, nhưng client khoá màn
// học cho tới khi có hồ sơ placed=true (kiểm qua /status). Chấm điểm ở SERVER,
// so đáp án người chọn với nghĩa thật của thẻ — client không thể gian lận.
const PASS_MARK = 0.8;                 // đạt test đầu ra = đúng ≥ 80%
const EXIT_MIN_MASTERED = 60;          // đã thuộc tối thiểu bao nhiêu từ mới được thi
const EXIT_MIN_DAYS = 14;              // và học tối thiểu bao nhiêu ngày (thời gian cho phép)

const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

async function buildQuiz(decks, n) {
  const cards = await VocabCard.aggregate([
    { $match: { deck: { $in: decks }, status: 'approved' } },
    { $sample: { size: n } },
  ]);
  // (deck đi kèm mỗi câu để chấm xếp lớp theo từng bậc)
  const pool = await VocabCard.aggregate([
    { $match: { deck: { $in: decks }, status: 'approved' } },
    { $sample: { size: n * 4 } },
    { $project: { meaning: 1 } },
  ]);
  const meanings = [...new Set(pool.map((c) => c.meaning))];
  return cards.map((c) => {
    const distractors = shuffle(meanings.filter((m) => m !== c.meaning)).slice(0, 3);
    return { cardId: c._id, deck: c.deck, hanzi: c.hanzi, pinyin: c.pinyin, options: shuffle([c.meaning, ...distractors]) };
  });
}

async function eligibleForExit(email) {
  const profile = await VocabProfile.findOne({ email }).lean();
  if (!profile?.placed || profile.completed) return { eligible: false, profile };
  const mastered = await VocabProgress.countDocuments({ email, status: 'mastered' });
  const days = profile.startedAt ? (Date.now() - new Date(profile.startedAt).getTime()) / 86400000 : 0;
  return { eligible: mastered >= EXIT_MIN_MASTERED && days >= EXIT_MIN_DAYS, profile, mastered, days: Math.floor(days) };
}

// POST /api/vocab/track { track } — chọn khoá học (Giản thể/HSK · Phồn thể/TOCFL).
// Chọn một lần khi mới vào; đổi khoá làm lại test xếp lớp cho khoá mới.
router.post('/track', requireMember, async (req, res) => {
  try {
    const track = req.body?.track;
    if (!TRACKS[track]) return res.status(400).json({ error: 'Khoá không hợp lệ.' });
    const prev = await VocabProfile.findOne({ email: req.memberEmail }, 'track').lean();
    const changed = prev?.track && prev.track !== track;
    await VocabProfile.findOneAndUpdate(
      { email: req.memberEmail },
      // Đổi khoá → reset xếp lớp (hệ cấp khác nhau, phải test lại cho đúng).
      { $set: changed
        ? { track, placed: false, testedOutThrough: '', level: '' }
        : { track }, $setOnInsert: { email: req.memberEmail } },
      { upsert: true },
    );
    res.json({ success: true, track, label: TRACKS[track].label });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/reset-placement — thi lại test đầu vào (xoá xếp lớp, giữ tiến độ học).
router.post('/reset-placement', requireMember, async (req, res) => {
  await VocabProfile.updateOne({ email: req.memberEmail }, { $set: { placed: false, testedOutThrough: '', level: '' } }, { upsert: true });
  res.json({ success: true });
});

// POST /api/vocab/prefs { langPair?, pushEnabled? } — cài đặt.
router.post('/prefs', requireMember, async (req, res) => {
  const set = {};
  if (['vi_zh', 'en_zh'].includes(req.body?.langPair)) set.langPair = req.body.langPair;
  if (typeof req.body?.pushEnabled === 'boolean') set.pushEnabled = req.body.pushEnabled;
  if (!Object.keys(set).length) return res.status(400).json({ error: 'Không có cài đặt hợp lệ.' });
  await VocabProfile.updateOne({ email: req.memberEmail }, { $set: set, $setOnInsert: { email: req.memberEmail } }, { upsert: true });
  res.json({ success: true, ...set });
});

// GET /api/vocab/status — cổng của app: đã test đầu vào chưa, trình độ, đã đủ
// điều kiện thi đầu ra chưa, đã hoàn tất chưa.
router.get('/status', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let profile = await VocabProfile.findOne({ email }).lean();
    if (!profile) profile = (await VocabProfile.create({ email })).toObject();
    // CHƯA CHỌN KHOÁ → client hiện màn chọn Giản thể/Phồn thể trước khi test.
    if (!profile.track) {
      return res.json({ needsTrack: true, tracks: Object.entries(TRACKS).map(([id, t]) => ({ id, label: t.label })) });
    }
    const track = trackOf(profile.track);
    const LADDER = track.decks;
    const testedOut = profile.testedOutThrough || '';
    // MỘT lần deckStats cho tất cả: chọn bậc đang học, dựng ladder, xét thi đầu ra.
    const { total, mastered } = await deckStats(email);
    const activeDeck = pickActiveDeck(total, mastered, LADDER, testedOut);
    const masteredTotal = Object.values(mastered).reduce((a, b) => a + b, 0);
    const days = profile.startedAt ? (Date.now() - new Date(profile.startedAt).getTime()) / 86400000 : 0;
    const ex = { eligible: profile.placed && !profile.completed && masteredTotal >= EXIT_MIN_MASTERED && days >= EXIT_MIN_DAYS, mastered: masteredTotal };
    const toIdx = LADDER.indexOf(testedOut); // -1 nếu chưa vượt bậc nào
    // Bậc ≤ testedOut = ĐÃ ĐẠT (100%) dù chưa cày từng thẻ — người dùng đã test qua.
    const ladder = LADDER.map((d, i) => {
      const passed = i <= toIdx;
      const t = total[d] || 0;
      return {
        deck: d,
        total: t,
        target: track.target[d] || 0,   // số từ chuẩn của cấp (theo bảng)
        mastered: passed ? (t || 1) : (mastered[d] || 0),
        percent: passed ? 100 : (t ? Math.round(((mastered[d] || 0) / t) * 100) : 0),
        hasContent: t > 0,
        passed,
      };
    });
    const nextLevel = LADDER[toIdx + 1] || null;

    // BỘ THEO DÕI TỐC ĐỘ → mời VƯỢT CẤP khi học nhanh. Tín hiệu: đã thuộc kha
    // khá ở cấp đang học, độ chính xác cao (ít "quên"), tỷ lệ "dễ" cao.
    const reviews = profile.reviews || 0;
    const accuracy = reviews >= 10 ? 1 - (profile.againReviews || 0) / reviews : 0;
    const easyRate = reviews >= 10 ? (profile.easyReviews || 0) / reviews : 0;
    const masteredActive = activeDeck ? (mastered[activeDeck] || 0) : 0;
    const canSkipLevel = Boolean(activeDeck) && masteredActive >= 12 && reviews >= 20 && accuracy >= 0.85 && easyRate >= 0.35;
    const tracker = { reviews, accuracy: Math.round(accuracy * 100), easyRate: Math.round(easyRate * 100), canSkipLevel };

    // MỤC TIÊU 30 NGÀY — cho người học một đích rõ ràng để cố gắng. Đích = hoàn
    // thành cấp đang học trong goalDays ngày; hạn mức mỗi ngày suy ra từ số từ
    // còn lại chia số ngày còn lại. "1 tháng có kết quả đáng kể".
    let goal = null;
    if (activeDeck) {
      const goalDays = profile.goalDays || 30;
      const start = profile.startedAt ? new Date(profile.startedAt).getTime() : Date.now();
      const daysLeft = Math.max(1, Math.ceil((start + goalDays * 86400000 - Date.now()) / 86400000));
      const totalInActive = total[activeDeck] || 0;
      const masteredInActive = mastered[activeDeck] || 0;
      const remaining = Math.max(0, totalInActive - masteredInActive);
      goal = {
        deck: activeDeck,
        days: goalDays,
        daysLeft,
        target: totalInActive,
        mastered: masteredInActive,
        remaining,
        dailyTarget: Math.ceil(remaining / daysLeft),
        onTrack: (masteredInActive / Math.max(1, totalInActive)) >= (1 - daysLeft / goalDays),
      };
    }
    res.json({
      needsTrack: false,
      goal,
      tracker,
      langPair: profile.langPair || 'vi_zh',
      pushEnabled: profile.pushEnabled !== false,
      canSkipLevel: tracker.canSkipLevel,
      track: profile.track,
      trackLabel: track.label,
      placed: profile.placed,
      level: profile.level,
      testedOutThrough: testedOut,
      activeDeck,
      noContentYet: !activeDeck,   // đã vượt hết bậc có nội dung → bậc kế "sắp ra mắt"
      nextLevel,
      ladder,
      completed: profile.completed,
      startedAt: profile.startedAt,
      eligibleForExit: ex.eligible,
      mastered: ex.mastered || 0,
      exitNeed: { mastered: EXIT_MIN_MASTERED, days: EXIT_MIN_DAYS },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/test?type=placement|exit — lấy bộ câu hỏi trắc nghiệm.
router.get('/test', requireMember, async (req, res) => {
  try {
    const type = ['exit', 'skip'].includes(req.query.type) ? req.query.type : 'placement';
    const profile = await VocabProfile.findOne({ email: req.memberEmail }, 'track testedOutThrough').lean();
    const LADDER = trackOf(profile?.track).decks;
    if (type === 'skip') {
      const deck = await computeActiveDeck(req.memberEmail, LADDER, profile?.testedOutThrough);
      if (!deck) return res.status(400).json({ error: 'Không có cấp để vượt.' });
      return res.json({ type, deck, questions: await buildQuiz([deck], 15) });
    }
    if (type === 'exit') {
      const ex = await eligibleForExit(req.memberEmail);
      if (!ex.eligible) return res.status(403).json({ error: 'Chưa đủ điều kiện thi đầu ra.', code: 'NOT_ELIGIBLE' });
      return res.json({ type, questions: await buildQuiz(LADDER, 20) });
    }
    // Đầu vào: trải đều các cấp của khoá để đo đúng trình độ.
    res.json({ type, questions: await buildQuiz(LADDER, 12) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/test/submit { type, answers:[{cardId, choice}] }
router.post('/test/submit', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const type = ['exit', 'skip'].includes(req.body?.type) ? req.body.type : 'placement';
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
    if (!answers.length) return res.status(400).json({ error: 'Thiếu câu trả lời.' });

    const ids = answers.map((a) => a.cardId);
    const cards = await VocabCard.find({ _id: { $in: ids } }, 'meaning deck').lean();
    const truth = Object.fromEntries(cards.map((c) => [String(c._id), c.meaning]));
    let correct = 0;
    for (const a of answers) if (truth[String(a.cardId)] && a.choice === truth[String(a.cardId)]) correct += 1;
    const score = answers.length ? correct / answers.length : 0;

    if (type === 'placement') {
      // Chấm theo TỪNG bậc: đúng ≥80% câu của một bậc = VƯỢT bậc đó. testedOutThrough
      // là bậc cao nhất vượt được LIÊN TỤC từ HSK1 — không nhảy cóc qua lỗ hổng.
      const perDeck = {};
      for (const a of answers) {
        const c = cards.find((x) => String(x._id) === String(a.cardId));
        if (!c) continue;
        perDeck[c.deck] = perDeck[c.deck] || { correct: 0, total: 0 };
        perDeck[c.deck].total += 1;
        if (a.choice === c.meaning) perDeck[c.deck].correct += 1;
      }
      const profileT = await VocabProfile.findOne({ email }, 'track').lean();
      const LADDER = trackOf(profileT?.track).decks;
      let testedOutThrough = '';
      for (const d of LADDER) {
        const s2 = perDeck[d];
        if (s2 && s2.total > 0 && s2.correct / s2.total >= 0.8) testedOutThrough = d;
        else break; // dừng ở bậc đầu tiên chưa vững — không vượt tiếp
      }
      // Trình độ ghi nhận = bậc đã vượt (để computeActiveDeck bắt đầu từ bậc kế).
      const level = testedOutThrough || LADDER[0];
      await VocabProfile.findOneAndUpdate(
        { email },
        { $set: { placed: true, level, testedOutThrough, placementScore: score, placementAt: new Date(), startedAt: new Date() }, $setOnInsert: { email } },
        { upsert: true },
      );
      const startDeck = await computeActiveDeck(email, LADDER, testedOutThrough);
      return res.json({ type, score: Math.round(score * 100), testedOutThrough, startDeck, placed: true });
    }

    if (type === 'skip') {
      // Vượt cấp đang học: đúng ≥85% thì tính cấp đó ĐÃ ĐẠT, nhảy sang cấp kế.
      const passed = score >= 0.85;
      const deck = cards[0]?.deck;
      if (passed && deck) {
        const profileS = await VocabProfile.findOne({ email }, 'track testedOutThrough').lean();
        const LADDER = trackOf(profileS?.track).decks;
        // Chỉ nâng testedOutThrough nếu cấp vừa vượt ĐỨNG SAU mốc hiện tại.
        const curIdx = LADDER.indexOf(profileS?.testedOutThrough || '');
        if (LADDER.indexOf(deck) === curIdx + 1) {
          await VocabProfile.updateOne({ email }, { $set: { testedOutThrough: deck, level: deck } });
        }
      }
      return res.json({ type, score: Math.round(score * 100), passed, passMark: 85, deck });
    }

    // Đầu ra: đạt ngưỡng thì đánh dấu HOÀN TẤT.
    const passed = score >= PASS_MARK;
    if (passed) {
      await VocabProfile.updateOne({ email }, { $set: { completed: true, exitScore: score, completedAt: new Date() } });
    }
    res.json({ type, score: Math.round(score * 100), passed, passMark: Math.round(PASS_MARK * 100) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/hanviet?deck= — "Từ giống tiếng Việt": từ kèm ÂM HÁN-VIỆT.
// Đánh dấu cognate mạnh khi âm Hán-Việt trùng/khớp nghĩa (注意 → chú ý = chú ý)
// — những từ này người Việt học là nhớ ngay.
router.get('/hanviet', requireMember, async (req, res) => {
  try {
    const profile = await VocabProfile.findOne({ email: req.memberEmail }, 'track testedOutThrough').lean();
    const LADDER = trackOf(profile?.track).decks;
    let deck = req.query.deck;
    if (!LADDER.includes(deck)) deck = await computeActiveDeck(req.memberEmail, LADDER, profile?.testedOutThrough) || LADDER[0];
    const norm = (x) => String(x || '').toLowerCase().replace(/[^a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ ]/gi, '').trim();
    const cards = await VocabCard.find({ deck, status: 'approved', hanViet: { $ne: '' } }, 'hanzi pinyin hanViet meaning meaningEn').sort({ order: 1 }).limit(400).lean();
    const items = cards.map((c) => {
      const hv = norm(c.hanViet);
      const mn = norm(c.meaning);
      const cognate = hv.length > 1 && (mn === hv || mn.split(/[,;/]| hoặc | và /).map(norm).includes(hv) || mn.includes(hv));
      return { hanzi: c.hanzi, pinyin: c.pinyin, hanViet: c.hanViet, meaning: c.meaning, meaningEn: c.meaningEn, cognate };
    });
    res.json({ deck, items, cognateCount: items.filter((i) => i.cognate).length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vocab/history — "Lịch sử của tôi": các từ ĐÃ THUỘC (không học lại).
router.get('/history', requireMember, async (req, res) => {
  try {
    const limit = Math.min(500, Number(req.query.limit) || 200);
    const prog = await VocabProgress.find({ email: req.memberEmail, status: 'mastered' })
      .sort({ lastReviewedAt: -1 }).limit(limit).lean();
    const cards = prog.length ? await VocabCard.find({ _id: { $in: prog.map((p) => p.cardId) } }, 'hanzi pinyin meaning deck hanViet meaningEn').lean() : [];
    const byId = Object.fromEntries(cards.map((c) => [String(c._id), c]));
    const items = prog.map((p) => ({ ...byId[String(p.cardId)], learnedAt: p.lastReviewedAt })).filter((x) => x.hanzi);
    res.json({ total: await VocabProgress.countDocuments({ email: req.memberEmail, status: 'mastered' }), items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── THI VIẾT LUẬN (100% tiếng Trung) — AI CHẤM ───────────────────────────────
// Bài thi cuối chặng: viết một đoạn tiếng Trung, AI chấm điểm + chỉ ra lỗi trong
// câu + gợi ý cho tự nhiên như bản xứ. Lần thi ĐẦU miễn phí; mỗi lần THI LẠI tốn
// 1000 JOY (trừ theo JOY gốc, hiển thị tự quy đổi sang đơn vị của người dùng).
const ESSAY_RETAKE_COST = 1000; // JOY gốc
const ESSAY_TOPICS = {
  hsk1: ['介绍你自己（名字、国家、爱好）。', '说说你的一天。'],
  hsk2: ['介绍你的家人。', '你喜欢的食物和为什么。'],
  hsk3: ['说说你上个周末做了什么。', '介绍你的城市。'],
  hsk4: ['谈谈你的学习或工作计划。', '描述一次难忘的旅行。'],
  hsk5: ['谈谈科技对生活的影响。', '你认为怎样才能学好一门外语？'],
  hsk6: ['论述环境保护的重要性。', '谈谈你对成功的看法。'],
};
const topicFor = (deck) => {
  const list = ESSAY_TOPICS[deck] || ESSAY_TOPICS.hsk3;
  return list[Math.floor(Math.random() * list.length)];
};

// Mục tiêu số chữ Hán theo cấp — bài dài dần theo trình độ.
const ESSAY_MIN_CHARS = { hsk1: 20, hsk2: 30, hsk3: 50, hsk4: 80, hsk5: 120, hsk6: 150, tocfl1: 20, tocfl2: 30, tocfl3: 50, tocfl4: 80, tocfl5: 120, tocfl6: 150 };

// GET /api/vocab/essay/prompt — đề bài + gợi ý từ đã học để dùng + mục tiêu chữ.
router.get('/essay/prompt', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const profile = await VocabProfile.findOne({ email }, 'essayAttempts track testedOutThrough').lean();
    const LADDER = trackOf(profile?.track).decks;
    const deck = await computeActiveDeck(email, LADDER, profile?.testedOutThrough) || LADDER[0];
    const willCharge = (profile?.essayAttempts || 0) >= 1;
    // Gợi ý vài từ ĐÃ HỌC của bậc này để khuyến khích dùng lại khi viết → ôn qua
    // sản sinh (viết) là cách nhớ sâu nhất.
    const prog = await VocabProgress.find({ email, deck, status: { $in: ['learning', 'review', 'mastered'] } })
      .sort({ lastReviewedAt: -1 }).limit(40).lean();
    let words = [];
    if (prog.length) {
      const cards = await VocabCard.find({ _id: { $in: prog.map((p) => p.cardId) } }, 'hanzi pinyin meaning meaningEn').lean();
      words = shuffle(cards).slice(0, 5).map((c) => ({ hanzi: c.hanzi, pinyin: c.pinyin, meaning: c.meaning, meaningEn: c.meaningEn }));
    }
    res.json({ topic: topicFor(deck), deck, willCharge, cost: ESSAY_RETAKE_COST, words, minChars: ESSAY_MIN_CHARS[deck] || 40 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/essay/grade { topic, text }
router.post('/essay/grade', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const topic = String(req.body?.topic || '').slice(0, 300);
    const text = String(req.body?.text || '').trim();
    // Đủ chữ Hán mới chấm (chống gửi rỗng để né phí / spam AI).
    const hanziCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    if (hanziCount < 20) return res.status(400).json({ error: 'Bài viết cần ít nhất 20 chữ Hán.' });
    if (text.length > 4000) return res.status(413).json({ error: 'Bài viết quá dài.' });

    const profile = await VocabProfile.findOne({ email }, 'essayAttempts').lean();
    const attempts = profile?.essayAttempts || 0;
    const willCharge = attempts >= 1;

    // Thu phí THI LẠI trước khi chấm (atomic, đủ số dư mới trừ).
    if (willCharge) {
      const { awardJoy } = await import('../utils/joyService.js');
      try {
        await awardJoy(email, -ESSAY_RETAKE_COST, 'vocab_essay_retake', 'Phí thi lại bài viết luận tiếng Trung', { pushNotify: false });
      } catch {
        return res.status(402).json({ error: 'Số dư JOY không đủ để thi lại (cần 1000 JOY).', code: 'INSUFFICIENT_JOY' });
      }
    }

    // Các từ được KHUYẾN KHÍCH dùng (client gửi lại từ /essay/prompt) — AI kiểm
    // từ nào đã dùng đúng để thưởng điểm "vận dụng từ đã học".
    const suggested = Array.isArray(req.body?.words)
      ? req.body.words.filter((w) => typeof w === 'string' && w).slice(0, 10)
      : [];

    const { generateRaw } = await import('../services/aiGateway.js');
    const raw = await generateRaw({
      systemInstruction: { parts: [{ text:
        'Bạn là giám khảo tiếng Trung bản xứ, nghiêm túc và khích lệ. Chấm bài viết của học viên. '
        + 'Trả về DUY NHẤT một object JSON: {"score": 0-100, "level": "ước lượng trình độ HSK", '
        + '"dimensions": {"grammar": 0-100, "vocabulary": 0-100, "coherence": 0-100}, '
        + '"usedWords": ["từ trong danh sách khuyến khích mà học viên ĐÃ dùng ĐÚNG"], '
        + '"strengths": ["điểm làm tốt, bằng tiếng Việt, ngắn"], '
        + '"errors": [{"original":"câu/cụm sai","correction":"sửa lại","explanation":"giải thích NGẮN bằng tiếng Việt"}], '
        + '"suggestions": ["gợi ý bằng tiếng Việt để câu tự nhiên hơn như người bản xứ"], '
        + '"nativeVersion":"viết lại cả bài theo cách bản xứ tự nhiên (tiếng Trung)", "comment":"nhận xét chung bằng tiếng Việt"}.' }] },
      contents: [{ role: 'user', parts: [{ text:
        `Đề bài: ${topic || '(tự do)'}\n`
        + (suggested.length ? `Từ khuyến khích dùng: ${suggested.join('、')}\n` : '')
        + `\nBài viết của học viên:\n${text}` }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    });

    let feedback = null;
    try { feedback = JSON.parse(String(raw || '').replace(/^```(?:json)?|```$/g, '').trim()); } catch { /* để null */ }
    if (!feedback) {
      // AI hỏng SAU khi đã thu phí → hoàn lại phí, không để mất tiền oan.
      if (willCharge) {
        const { awardJoy } = await import('../utils/joyService.js');
        await awardJoy(email, ESSAY_RETAKE_COST, 'vocab_essay_retake', 'Hoàn phí thi viết (AI không chấm được)', { pushNotify: false }).catch(() => {});
      }
      return res.status(502).json({ error: 'AI chưa chấm được, vui lòng thử lại (không trừ phí).' });
    }

    await VocabProfile.updateOne({ email }, { $inc: { essayAttempts: 1 } });
    res.json({ feedback, charged: willCharge ? ESSAY_RETAKE_COST : 0, attempt: attempts + 1 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DẠY ĐẶT CÂU (造句) ────────────────────────────────────────────────────────
// GET /api/vocab/sentence/task — một TỪ (ưu tiên đã học) để tập đặt câu.
router.get('/sentence/task', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const profile = await VocabProfile.findOne({ email }, 'track testedOutThrough').lean();
    const LADDER = trackOf(profile?.track).decks;
    const deck = await computeActiveDeck(email, LADDER, profile?.testedOutThrough) || LADDER[0];
    const prog = await VocabProgress.find({ email, deck, status: { $in: ['learning', 'review', 'mastered'] } }).limit(80).lean();
    let card = null;
    if (prog.length) {
      const pick = prog[Math.floor(Math.random() * prog.length)];
      card = await VocabCard.findOne({ _id: pick.cardId }, 'hanzi pinyin meaning meaningEn example examplePinyin exampleMeaning').lean();
    }
    if (!card) {
      const arr = await VocabCard.aggregate([{ $match: { deck, status: 'approved' } }, { $sample: { size: 1 } }]);
      card = arr[0] || null;
    }
    if (!card) return res.json({ word: null });
    res.json({ word: {
      hanzi: card.hanzi, pinyin: card.pinyin, meaning: card.meaning, meaningEn: card.meaningEn,
      example: card.example, examplePinyin: card.examplePinyin, exampleMeaning: card.exampleMeaning,
    } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vocab/sentence/check { word?, pattern?, text } — AI kiểm câu học viên đặt.
router.post('/sentence/check', requireMember, async (req, res) => {
  try {
    const word = String(req.body?.word || '').slice(0, 20);
    const pattern = String(req.body?.pattern || '').slice(0, 40);
    const text = String(req.body?.text || '').trim().slice(0, 300);
    const hanzi = (text.match(/[一-鿿]/g) || []).length;
    if (hanzi < 2) return res.status(400).json({ error: 'Câu quá ngắn.' });
    const usesWord = word ? text.includes(word) : true;

    let result = null;
    try {
      const { generateRaw } = await import('../services/aiGateway.js');
      const raw = await generateRaw({
        systemInstruction: { parts: [{ text:
          'Bạn là giáo viên tiếng Trung tận tâm. Kiểm tra CÂU học viên đặt. Trả về DUY NHẤT JSON: '
          + '{"ok": true/false (đúng ngữ pháp, tự nhiên, và đúng yêu cầu), "score":0-100, '
          + '"correction":"câu sửa lại bằng chữ Hán nếu có lỗi, để rỗng nếu đã đúng", '
          + '"pinyin":"pinyin có dấu thanh của câu đúng", "comment":"nhận xét NGẮN bằng tiếng Việt", '
          + '"nativeExample":"một câu mẫu bản xứ khác dùng cùng từ/mẫu (chữ Hán)"}.' }] },
        contents: [{ role: 'user', parts: [{ text:
          `Yêu cầu: đặt câu${word ? ` có dùng từ 「${word}」` : ''}${pattern ? ` theo mẫu 「${pattern}」` : ''}.\nCâu của học viên: ${text}` }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      });
      result = JSON.parse(String(raw || '').replace(/^```(?:json)?|```$/g, '').trim());
    } catch { result = null; }

    if (!result) {
      // AI bận → kiểm sơ (có dùng từ + đủ dài), báo rõ là chấm tạm.
      const ended = /[。！？.!?]$/.test(text);
      return res.json({
        ok: usesWord && hanzi >= 3,
        score: usesWord ? 70 : 40,
        correction: '', pinyin: '', nativeExample: '', fallback: true,
        comment: !usesWord ? `Câu chưa dùng từ 「${word}」.`
          : ended ? 'AI đang bận — câu có dùng đúng từ, tạm ổn. Thử lại sau để chấm kỹ hơn.'
            : 'AI đang bận. Nhớ kết thúc câu bằng 。 rồi thử lại.',
      });
    }
    if (word && !usesWord) { result.ok = false; result.comment = `Câu chưa dùng từ 「${word}」. ${result.comment || ''}`.trim(); }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Nội dung (admin): sinh bằng AI vào hàng chờ duyệt, rồi duyệt ─────────────
// Không bao giờ nạp thẳng thẻ AI cho người học — mọi thẻ 'ai' vào 'pending'.
router.post('/admin/generate', requireAdmin, async (req, res) => {
  try {
    const { deck, count = 20 } = req.body || {};
    if (!DECKS.includes(deck)) return res.status(400).json({ error: 'deck không hợp lệ.' });
    const { generateRaw } = await import('../services/aiGateway.js');
    const have = await VocabCard.find({ deck }).distinct('hanzi');
    const raw = await generateRaw({
      systemInstruction: { parts: [{ text: 'Bạn là chuyên gia dạy tiếng Trung. Trả về DUY NHẤT một mảng JSON các từ vựng, không giải thích.' }] },
      contents: [{ role: 'user', parts: [{ text: `Cho ${Math.min(50, Number(count) || 20)} từ vựng thuộc CHUẨN NEW HSK 3.0 (HSK 3.0, Hán Ban 2021) cấp ${deck.toUpperCase().replace('HSK', 'HSK ').replace('_', '-')} tiếng Trung phổ thông, KHÔNG trùng các từ sau: ${have.join(' ') || '(chưa có)'}. Mỗi phần tử: {"hanzi","pinyin" (có dấu thanh),"meaning" (nghĩa tiếng Việt ngắn),"example" (câu ví dụ chữ Hán),"examplePinyin","exampleMeaning" (nghĩa tiếng Việt)}.` }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    });
    let items = [];
    try { items = JSON.parse(String(raw || '[]').replace(/^```(?:json)?|```$/g, '').trim()); } catch { /* để rỗng */ }
    if (!Array.isArray(items) || !items.length) return res.status(502).json({ error: 'AI chưa trả về được danh sách hợp lệ.' });

    let inserted = 0;
    for (const [i, it] of items.entries()) {
      if (!it?.hanzi || !it?.pinyin || !it?.meaning) continue;
      try {
        await VocabCard.create({
          deck, hanzi: String(it.hanzi).trim(), pinyin: String(it.pinyin).trim(), meaning: String(it.meaning).trim(),
          example: String(it.example || ''), examplePinyin: String(it.examplePinyin || ''), exampleMeaning: String(it.exampleMeaning || ''),
          order: 1000 + i, status: 'pending', source: 'ai',
        });
        inserted += 1;
      } catch { /* trùng hanzi trong deck → bỏ qua */ }
    }
    res.json({ success: true, inserted, message: `Đã tạo ${inserted} thẻ chờ duyệt cho ${deck}.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/admin/pending', requireAdmin, async (req, res) => {
  const cards = await VocabCard.find({ status: 'pending' }).sort({ deck: 1, order: 1 }).limit(200).lean();
  res.json({ cards });
});

router.post('/admin/review/:id', requireAdmin, async (req, res) => {
  const status = req.body?.approve ? 'approved' : 'rejected';
  const card = await VocabCard.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
  if (!card) return res.status(404).json({ error: 'Không tìm thấy thẻ.' });
  res.json({ success: true, card });
});

export default router;
