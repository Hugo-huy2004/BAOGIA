import express from 'express';
import VocabCard from '../models/VocabCard.js';
import VocabProgress from '../models/VocabProgress.js';
import VocabProfile from '../models/VocabProfile.js';
import { requireMember, requireAdmin } from '../middleware/authMiddleware.js';
import { schedule, nextStreak, dayKey } from '../services/vocabSrs.js';

const router = express.Router();

// Hai KHOÁ học độc lập. Số từ mỗi cấp theo đúng bảng Boss cung cấp (lượng từ
// tích luỹ của mỗi kỳ thi). Mỗi khoá có hệ cấp riêng, người học chọn một.
const TRACKS = {
  simplified: {
    label: 'Giản thể · HSK',
    decks: ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'],
    target: { hsk1: 150, hsk2: 300, hsk3: 600, hsk4: 1200, hsk5: 2500, hsk6: 5000 },
  },
  traditional: {
    label: 'Phồn thể · TOCFL',
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
async function deckStats(email, ladder) {
  const [contentRows, masteredRows] = await Promise.all([
    VocabCard.aggregate([{ $match: { status: 'approved', deck: { $in: ladder } } }, { $group: { _id: '$deck', n: { $sum: 1 } } }]),
    VocabProgress.aggregate([{ $match: { email, status: 'mastered', deck: { $in: ladder } } }, { $group: { _id: '$deck', n: { $sum: 1 } } }]),
  ]);
  return {
    total: Object.fromEntries(contentRows.map((r) => [r._id, r.n])),
    mastered: Object.fromEntries(masteredRows.map((r) => [r._id, r.n])),
  };
}

// Bậc NÊN học lúc này. Bắt đầu từ bậc KẾ bậc đã vượt (testedOutThrough) — không
// bắt học lại bậc đã đạt — rồi tìm bậc đầu tiên CÓ nội dung + chưa thuộc hết.
// KHÔNG lùi xuống bậc đã vượt. Chưa có nội dung ở bậc kế → trả null (bậc mới
// "sắp ra mắt", người học đã sẵn sàng, không có gì để cày lại).
async function computeActiveDeck(email, ladder, testedOutThrough) {
  const { total, mastered } = await deckStats(email, ladder);
  const startIdx = ladder.indexOf(testedOutThrough || '') + 1; // '' → 0 = cấp đầu
  for (let i = startIdx; i < ladder.length; i++) {
    const d = ladder[i];
    if ((total[d] || 0) > 0 && (mastered[d] || 0) < total[d]) return d;
  }
  return null;
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

    // Chuỗi ngày: mỗi lượt ôn cập nhật streak + số lượt hôm nay (tính theo mốc
    // ngày UTC). Đây là động lực giữ thói quen — thứ quyết định kết quả dài hạn.
    const profile = await VocabProfile.findOne({ email: req.memberEmail }, 'streak lastStudyDay reviewsToday').lean();
    const today = dayKey();
    const yesterday = dayKey(Date.now() - 86400000);
    const st = nextStreak(profile || {}, today, yesterday);
    const g = Number(grade);
    await VocabProfile.updateOne(
      { email: req.memberEmail },
      { $set: st, $inc: { reviews: 1, easyReviews: g === 3 ? 1 : 0, againReviews: g === 0 ? 1 : 0 }, $setOnInsert: { email: req.memberEmail } },
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
    const [byStatus, goalTotal, goalMastered, dueNow] = await Promise.all([
      VocabProgress.aggregate([{ $match: { email } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
      VocabCard.countDocuments({ deck: { $in: GOAL_DECKS }, status: 'approved' }),
      VocabProgress.countDocuments({ email, deck: { $in: GOAL_DECKS }, status: 'mastered' }),
      VocabProgress.countDocuments({ email, dueAt: { $lte: new Date() } }),
    ]);
    const profile = profile0;
    const counts = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
    const learned = (counts.learning || 0) + (counts.review || 0) + (counts.mastered || 0);
    // Chuỗi chỉ còn giá trị nếu học hôm nay hoặc hôm qua; bỏ cách ngày thì coi như 0.
    const today = dayKey(); const yesterday = dayKey(Date.now() - 86400000);
    const liveStreak = (profile?.lastStudyDay === today || profile?.lastStudyDay === yesterday) ? (profile.streak || 0) : 0;
    const reviewsToday = profile?.lastStudyDay === today ? (profile.reviewsToday || 0) : 0;
    const dailyGoal = profile?.dailyGoal || 20;
    // Bậc đã VƯỢT ở test xếp lớp tính 100% vào tiến độ tới HSK6 (không cày lại).
    const toIdx = GOAL_DECKS.indexOf(profile?.testedOutThrough || '');
    let testedOutCards = 0;
    if (toIdx >= 0) {
      testedOutCards = await VocabCard.countDocuments({ status: 'approved', deck: { $in: GOAL_DECKS.slice(0, toIdx + 1) } });
    }
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
    const ex = await eligibleForExit(email);
    const testedOut = profile.testedOutThrough || '';
    const activeDeck = await computeActiveDeck(email, LADDER, testedOut);
    const { total, mastered } = await deckStats(email, LADDER);
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
    const cards = await VocabCard.find({ deck, status: 'approved', hanViet: { $ne: '' } }, 'hanzi pinyin hanViet meaning').sort({ order: 1 }).limit(400).lean();
    const items = cards.map((c) => {
      const hv = norm(c.hanViet);
      const mn = norm(c.meaning);
      const cognate = hv.length > 1 && (mn === hv || mn.split(/[,;/]| hoặc | và /).map(norm).includes(hv) || mn.includes(hv));
      return { hanzi: c.hanzi, pinyin: c.pinyin, hanViet: c.hanViet, meaning: c.meaning, cognate };
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
    const cards = prog.length ? await VocabCard.find({ _id: { $in: prog.map((p) => p.cardId) } }, 'hanzi pinyin meaning deck hanViet').lean() : [];
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

// GET /api/vocab/essay/prompt — đề bài + cho biết lần thi này có tốn phí không.
router.get('/essay/prompt', requireMember, async (req, res) => {
  try {
    const profile = await VocabProfile.findOne({ email: req.memberEmail }, 'essayAttempts track testedOutThrough').lean();
    const LADDER = trackOf(profile?.track).decks;
    const deck = await computeActiveDeck(req.memberEmail, LADDER, profile?.testedOutThrough) || LADDER[0];
    const willCharge = (profile?.essayAttempts || 0) >= 1;
    res.json({ topic: topicFor(deck), deck, willCharge, cost: ESSAY_RETAKE_COST });
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

    const { generateRaw } = await import('../services/aiGateway.js');
    const raw = await generateRaw({
      systemInstruction: { parts: [{ text:
        'Bạn là giám khảo tiếng Trung bản xứ, nghiêm túc và khích lệ. Chấm bài viết của học viên. '
        + 'Trả về DUY NHẤT một object JSON: {"score": 0-100, "level": "ước lượng trình độ HSK", '
        + '"errors": [{"original":"câu/cụm sai","correction":"sửa lại","explanation":"giải thích NGẮN bằng tiếng Việt"}], '
        + '"suggestions": ["gợi ý bằng tiếng Việt để câu tự nhiên hơn như người bản xứ"], '
        + '"nativeVersion":"viết lại cả bài theo cách bản xứ tự nhiên (tiếng Trung)", "comment":"nhận xét chung bằng tiếng Việt"}.' }] },
      contents: [{ role: 'user', parts: [{ text: `Đề bài: ${topic || '(tự do)'}\n\nBài viết của học viên:\n${text}` }] }],
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
