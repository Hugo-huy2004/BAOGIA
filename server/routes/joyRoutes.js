import express from 'express';
import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import { awardJoy, getJoyHistory } from '../utils/joyService.js';
import { ensureReferralCode } from '../utils/referralService.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import { FEATURE_PRICES, chargeFeatureSubscription, calcExchangeTotal } from '../utils/featureSubscriptionService.js';
import { signQrToken, verifyQrToken, JOY_QR_BUCKET_MS } from '../utils/joyQrToken.js';

const BIO_THEME_RENTAL_PRICE = 150;
const COMPRESS_CHARGE = 50;
const CODER_LESSON_IDS = Array.from({ length: 50 }, (_, index) => `lesson${index + 1}`);
const CODER_MIN_STUDY_MS = 10 * 60 * 1000;
const CODER_QUIZ_LESSONS = new Set(['lesson4', 'lesson25', 'lesson50']);
const CODER_SCREENSHOT_LESSONS = new Set(['lesson8', 'lesson9']);

// Item labels shown on the invoice modal, keyed the same way the frontend
// calls /exchange-quote — kept here (not duplicated client-side) so price
// changes only ever need updating in one place.
const EXCHANGE_ITEMS = {
  hugoCoder: { label: 'HugoCoder Cơ Bản (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoder },
  hugoCoderIntermediate: { label: 'HugoCoder Trung Cấp (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderIntermediate },
  hugoCoderAdvanced: { label: 'HugoCoder Cao Cấp (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderAdvanced },
  hugoAura: { label: 'HugoAura — Lofi & Cửa hàng giao diện (1 tháng)', priceJoy: FEATURE_PRICES.hugoAura },
  hugoRadio: { label: 'HugoRadio (1 tháng)', priceJoy: FEATURE_PRICES.hugoRadio },
  hugoArcade: { label: 'HugoArcade — Bứt phá & Huyền thoại (1 tháng)', priceJoy: FEATURE_PRICES.hugoArcade },
  hugoChess: { label: 'HugoChess — Cờ vua đỉnh cao (1 tháng)', priceJoy: FEATURE_PRICES.hugoChess },
  bioThemeBrutalism: { label: 'Giao diện Bio: Brutalism (1 tháng)', priceJoy: BIO_THEME_RENTAL_PRICE },
  bioThemeFlat: { label: 'Giao diện Bio: Flat (1 tháng)', priceJoy: BIO_THEME_RENTAL_PRICE },
  fileCompression: { label: 'Nén file HugoTractare', priceJoy: COMPRESS_CHARGE }
};

const router = express.Router();

// Phone-based P2P JOY transfer — "send JOY by phone like MoMo" without real
// SMS/OTP infra (none exists in this codebase): Bio.phone is enforced unique
// at the DB level (see Bio.js's partial index), so "verified" here means
// guaranteed-single-owner, not SMS-verified. A 5% friction fee discourages
// spammy transfers without acting as a platform revenue cut ("phi lợi nhuận").
const TRANSFER_MIN = 10;
const TRANSFER_MAX = 1000;
const TRANSFER_DAILY_CAP = 1000;
const TRANSFER_FEE_RATE = 0.05;
const TRANSFER_MIN_ACCOUNT_AGE_DAYS = 3;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/joy/exchange-quote?email=&item=  — invoice preview for the
// confirmation modal shown before any "Trao đổi JOY" action. Returns the
// same price/tax/total math the actual charge endpoints enforce, plus the
// member's current balance and display info, so the UI never has to
// duplicate (and risk drifting from) the server's pricing.
router.get('/exchange-quote', requireMember, async (req, res) => {
  try {
    const { item } = req.query;
    const email = req.memberEmail;
    if (!email || !item) return res.status(400).json({ error: 'email and item are required' });

    const def = EXCHANGE_ITEMS[item];
    if (!def) return res.status(400).json({ error: 'Mục trao đổi không hợp lệ.' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const { tax, total } = calcExchangeTotal(def.priceJoy);
    res.json({
      label: def.label,
      priceJoy: def.priceJoy,
      tax,
      total,
      balance: bio.joyBalance,
      trader: { displayName: bio.displayName || '', email: bio.email, avatarUrl: bio.avatarUrl || '' }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/balance?email=
router.get('/balance', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    // Fast path: a lean, projected read of just the two fields we return.
    // Avoids hydrating the whole Bio doc (history/projects/comments arrays) which
    // made this hot endpoint slow. Only the rare "no referral code yet" case
    // falls back to loading a full mongoose doc to generate + save one.
    let bio = await Bio.findOne({ email }, 'joyBalance referralCode').lean();
    if (!bio) bio = await Bio.findOne({ contactEmail: email }, 'joyBalance referralCode').lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.referralCode) {
      return res.json({ balance: bio.joyBalance || 0, referralCode: bio.referralCode });
    }

    // First-time only: generate & persist a referral code.
    let full = await Bio.findOne({ email });
    if (!full) full = await Bio.findOne({ contactEmail: email });
    const referralCode = await ensureReferralCode(full);
    res.json({ balance: full.joyBalance || 0, referralCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/history?email=&limit=20
router.get('/history', requireMember, async (req, res) => {
  try {
    const { limit } = req.query;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    const transactions = await getJoyHistory(email, limit);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/adjust (admin-only manual correction tool)
router.post('/adjust', requireAdmin, async (req, res) => {
  try {
    const { email, amount, description } = req.body;
    if (!email || !amount) return res.status(400).json({ error: 'email and amount are required' });

    const result = await awardJoy(email, Number(amount), 'admin_adjustment', description || 'Điều chỉnh JOY bởi quản trị viên');
    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/reset-to-zero  { email }  (admin-only — supreme override, e.g.
// for confirmed JOY-trading abuse; see PrivacyPolicyPage Chương XIII điểm d).
// Computes the exact negating delta server-side so Admin never has to know/
// guess the user's current balance — eliminates off-by-one risk of using
// /adjust with a manually typed negative amount.
router.post('/reset-to-zero', requireAdmin, async (req, res) => {
  try {
    const { email, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const bio = await Bio.findOne({ email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

    const currentBalance = bio.joyBalance || 0;
    if (currentBalance <= 0) {
      return res.json({ success: true, balance: 0, message: 'Số dư JOY đã là 0.' });
    }

    const result = await awardJoy(
      email,
      -currentBalance,
      'admin_adjustment',
      `Admin thu hồi toàn bộ JOY về 0${reason ? ` — Lý do: ${reason}` : ''}`,
      { bioDoc: bio }
    );
    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/award-learning
router.post('/award-learning', requireMember, async (req, res) => {
  try {
    const { lessonId, evidence = {} } = req.body;
    const email = req.memberEmail;
    if (!email || !lessonId) return res.status(400).json({ error: 'Email and lessonId are required' });

    const lessonIndex = CODER_LESSON_IDS.indexOf(lessonId);
    if (lessonIndex === -1) {
      return res.status(400).json({ error: 'Bài học HugoCoder không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (!bio.completedLessons) {
      bio.completedLessons = [];
    }

    if (bio.completedLessons.includes(lessonId)) {
      return res.json({ success: true, alreadyCompleted: true, balance: bio.joyBalance });
    }

    if (lessonIndex > 0) {
      const requiredPreviousLesson = CODER_LESSON_IDS[lessonIndex - 1];
      if (!bio.completedLessons.includes(requiredPreviousLesson)) {
        return res.status(400).json({
          error: `Bạn cần hoàn thành ${requiredPreviousLesson} trước khi nhận thưởng bài này.`,
          requiredPreviousLesson
        });
      }
    }



    const score = Number(evidence.score);
    if ((CODER_QUIZ_LESSONS.has(lessonId) || CODER_SCREENSHOT_LESSONS.has(lessonId)) && (!Number.isFinite(score) || score < 60)) {
      return res.status(400).json({ error: 'Bài nộp cần đạt tối thiểu 60% để nhận thưởng JOY.' });
    }

    // Daily cap validation: max 2 lessons completed per calendar day in ICT (GMT+7)
    const now = new Date();
    const ictOffset = 7 * 60 * 60 * 1000;
    const ictNow = new Date(now.getTime() + ictOffset);
    const ictTodayStart = new Date(ictNow.getUTCFullYear(), ictNow.getUTCMonth(), ictNow.getUTCDate());
    const utcTodayStart = new Date(ictTodayStart.getTime() - ictOffset);

    const count = await JoyLedger.countDocuments({
      email: bio.email,
      source: 'ide_learning',
      createdAt: { $gte: utcTodayStart }
    });

    if (count >= 2) {
      return res.status(400).json({ error: 'Mỗi ngày chỉ được hoàn thành tối đa 2 bài học.' });
    }

    const awardAmount = lessonId === 'lesson10' ? 450 : 100;
    const result = await awardJoy(
      email,
      awardAmount,
      'ide_learning',
      `Hoàn thành bài học HugoCoder: ${lessonId}${Number.isFinite(score) ? ` (${score}%)` : ''}`,
      { bioDoc: bio, refId: lessonId }
    );
    bio.completedLessons.push(lessonId);
    bio.markModified('completedLessons');
    await bio.save();

    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/claim-info-bonus — one-time bonus for opening Info & Version
router.post('/claim-info-bonus', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.infoBonusClaimed) {
      return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });
    }

    const result = await awardJoy(email, 20, 'info_bonus', 'Khám phá Info & Version (+20 JOY)');
    bio.infoBonusClaimed = true;
    await bio.save();

    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/award-focus
router.post('/award-focus', requireMember, async (req, res) => {
  try {
    const { minutes } = req.body;
    const email = req.memberEmail;
    if (!email || !minutes) return res.status(400).json({ error: 'Email and minutes are required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Base rewards x3.
    let joyAmount = 0;
    if (minutes >= 180) joyAmount = 150;
    else if (minutes >= 60) joyAmount = 45;
    else if (minutes >= 25) joyAmount = 15;

    if (joyAmount <= 0) {
      return res.status(400).json({ error: 'Thời gian tập trung chưa đủ để nhận thưởng JOY.' });
    }

    const result = await awardJoy(email, joyAmount, 'focus_session', `Tập trung sâu HugoAura: ${minutes} phút`);

    res.json({ success: true, balance: result.balance, awarded: joyAmount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/rent-theme
router.post('/rent-theme', requireMember, async (req, res) => {
  try {
    const { themeId, duration = 'day' } = req.body;
    const email = req.memberEmail;
    if (!email || !themeId) {
      return res.status(400).json({ error: 'Email and themeId are required' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const basePrice = duration === 'month' ? 1200 : 50;
    const creativeFee = basePrice * 0.09;
    const price = basePrice + creativeFee;

    if (bio.joyBalance < price) {
      return res.status(400).json({ error: `Bạn cần ít nhất ${price} JOY để thuê giao diện này.` });
    }

    const durationLabel = duration === 'month' ? '30 ngày' : '1 ngày';
    // Deduct JOY and create ledger record
    const result = await awardJoy(bio.email, -price, 'aura_theme_rent', `Thuê giao diện Aura: ${themeId} + 10% Phí sáng tạo (${durationLabel})`);
    
    // Extends or creates theme expiration in rentedThemes
    const extensionMs = duration === 'month' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const existingTheme = result.bio.rentedThemes.find(t => t.themeId === themeId);

    if (existingTheme) {
      // If it exists and is still active, extend. If it's expired, start fresh.
      const currentExpiry = new Date(existingTheme.expiresAt).getTime();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      existingTheme.expiresAt = new Date(baseTime + extensionMs);
    } else {
      result.bio.rentedThemes.push({
        themeId,
        expiresAt: new Date(Date.now() + extensionMs)
      });
    }

    // Automatically set it as active
    result.bio.activeAuraTheme = themeId;
    result.bio.markModified('rentedThemes');
    await result.bio.save();

    res.json({ success: true, balance: result.bio.joyBalance, bio: result.bio });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/set-theme
router.post('/set-theme', requireMember, async (req, res) => {
  try {
    const { themeId } = req.body;
    const email = req.memberEmail;
    if (!email || !themeId) {
      return res.status(400).json({ error: 'Email and themeId are required' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (themeId !== 'default') {
      const existingTheme = bio.rentedThemes.find(t => t.themeId === themeId);
      if (!existingTheme || new Date(existingTheme.expiresAt).getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Giao diện chưa được thuê hoặc đã hết hạn sử dụng.' });
      }
    }

    bio.activeAuraTheme = themeId;
    await bio.save();

    res.json({ success: true, bio });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/subscribe-feature  { email, featureKey, months? }
// Monthly JOY subscription gating HugoCoder / HugoAura (Lofi+Shop only) /
// HugoRadio / HugoArcade (Bứt phá+Huyền thoại tiers). See featureSubscriptionService.js.
router.post('/subscribe-feature', requireMember, async (req, res) => {
  try {
    const { featureKey, months } = req.body;
    const email = req.memberEmail;
    if (!email || !featureKey) return res.status(400).json({ error: 'email and featureKey are required' });
    if (!FEATURE_PRICES[featureKey]) return res.status(400).json({ error: 'Tính năng không hợp lệ.' });

    const { balance, expiresAt } = await chargeFeatureSubscription(email, featureKey, Number(months) || 1);
    res.json({ success: true, balance, expiresAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/joy/buy-lifetime-unlock
 * Deduct 50 JOY (+ 10% tax = 55 total) to grant lifetime unlock access to Coder Intermediate or Advanced phase.
 */
router.post('/buy-lifetime-unlock', requireMember, async (req, res) => {
  try {
    const { tier } = req.body; // 'intermediate' or 'advanced'
    const email = req.memberEmail;
    if (!email || !['intermediate', 'advanced'].includes(tier)) {
      return res.status(400).json({ error: 'Cấp độ mở khóa không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const key = tier === 'intermediate' ? 'hugoCoderIntermediateLifetime' : 'hugoCoderAdvancedLifetime';
    if (bio[key]) {
      return res.status(400).json({ error: 'Bạn đã mở khóa vĩnh viễn cấp độ này rồi.' });
    }

    // Verify completion requirements:
    // Intermediate requires all lessons from 11 to 25 to be completed.
    // Advanced requires all lessons from 26 to 50 to be completed.
    const completed = bio.completedLessons || [];
    let requiredLessons = [];
    if (tier === 'intermediate') {
      requiredLessons = Array.from({ length: 15 }, (_, i) => `lesson${i + 11}`);
    } else {
      requiredLessons = Array.from({ length: 25 }, (_, i) => `lesson${i + 26}`);
    }

    const missing = requiredLessons.filter(id => !completed.includes(id));
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: `Bạn cần hoàn thành tất cả các bài học trong phần này trước khi mở khóa vĩnh viễn. Các bài chưa xong: ${missing.map(m => m.replace('lesson', 'Bài ')).join(', ')}` 
      });
    }

    // Cost: 50 JOY + 10% tax = 55 JOY
    const priceJoy = 50;
    const { tax, total } = calcExchangeTotal(priceJoy);
    if (bio.joyBalance < total) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${total} JOY (gồm ${tax} JOY phí sáng tạo) để mua.` });
    }

    const result = await awardJoy(
      bio.email,
      -total,
      'lifetime_unlock',
      `Trao đổi JOY mở khóa vĩnh viễn HugoCoder ${tier === 'intermediate' ? 'Trung Cấp' : 'Cao Cấp'} (gồm ${tax} JOY phí sáng tạo)`,
      { bioDoc: bio, skipSave: true, refId: key }
    );

    bio[key] = true;
    await bio.save();

    res.json({ success: true, balance: result.balance, bio });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/subscribe-bio-theme  { email, template: 'brutalism'|'flat' }
// 'default' is always free and goes through the normal bio PUT — not this route.
router.post('/subscribe-bio-theme', requireMember, async (req, res) => {
  try {
    const { template } = req.body;
    const email = req.memberEmail;
    if (!email || !['brutalism', 'flat'].includes(template)) {
      return res.status(400).json({ error: 'Giao diện không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const currentExpiry = bio.bioThemeRental?.expiresAt ? new Date(bio.bioThemeRental.expiresAt).getTime() : 0;
    const alreadyPaidForThisTemplate = bio.bioThemeRental?.template === template && currentExpiry > Date.now();

    // Re-selecting a template already paid-for this period (e.g. switched to
    // Classic and back) is free — no double charge within the same rental window.
    if (!alreadyPaidForThisTemplate) {
      const { tax, total } = calcExchangeTotal(BIO_THEME_RENTAL_PRICE);
      if (bio.joyBalance < total) {
        return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${total} JOY (gồm ${tax} JOY phí sáng tạo) để đổi giao diện này.` });
      }

      const { balance } = await awardJoy(
        bio.email,
        -total,
        'bio_theme_rental',
        `Trao đổi JOY diện giao diện Bio: ${template} (1 tháng, gồm ${tax} JOY phí sáng tạo)`,
        { bioDoc: bio, skipSave: true }
      );
      bio.bioThemeRental = { template, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) };
      bio.theme = bio.theme || {};
      bio.theme.template = template;
      bio.markModified('theme');
      await bio.save();
      return res.json({ success: true, balance, expiresAt: bio.bioThemeRental.expiresAt, bio });
    }

    bio.theme = bio.theme || {};
    bio.theme.template = template;
    bio.markModified('theme');
    await bio.save();

    res.json({ success: true, balance: bio.joyBalance, expiresAt: bio.bioThemeRental.expiresAt, bio });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/joy/resolve-phone?phone= — lookup before sending, MoMo-style confirm.
// Never returns email (privacy) — only what's needed to show "Gửi tới: <name>".
router.get('/resolve-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Số điện thoại là bắt buộc.' });

    const bio = await Bio.findOne({ phone: String(phone).trim() });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng với số điện thoại này.' });

    res.json({ displayName: bio.displayName || 'Người dùng Hugo Studio', avatar: bio.avatarUrl || '', slug: bio.slug || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/search-user?q=&email= — MoMo-style smart search by any field.
// Returns limited public info only (no email exposed).
router.get('/search-user', async (req, res) => {
  try {
    const { q, email } = req.query;
    if (!q || !q.trim()) return res.json([]);
    const term = q.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results = await Bio.find({
      ...(email ? { email: { $ne: email } } : {}),
      $or: [
        { displayName: regex },
        { phone: term },
        { referralCode: term.toUpperCase() },
        { contactEmail: regex }
      ]
    })
      .select('displayName avatarUrl referralCode phone slug')
      .limit(6)
      .lean();

    res.json(results.map(b => ({
      displayName: b.displayName || 'Người dùng',
      avatarUrl: b.avatarUrl || '',
      referralCode: b.referralCode || '',
      slug: b.slug || '',
      maskedPhone: b.phone ? b.phone.slice(0, -3).replace(/\d/g, '*') + b.phone.slice(-3) : ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/joy/qr-payload?email= — generate user's JOY QR payload.
router.get('/qr-payload', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Thiếu email.' });
    const bio = await Bio.findOne({ email }).select('displayName avatarUrl referralCode joyBalance');
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });
    if (!bio.referralCode) {
      const { ensureReferralCode } = await import('../utils/referralService.js');
      await ensureReferralCode(bio);
    }
    res.json({
      // Signed, time-bound token (rotates ~every 2 min). Only this server can
      // mint one; only this server accepts it back at /resolve-qr.
      payload: signQrToken(bio.referralCode),
      refreshMs: JOY_QR_BUCKET_MS, // hint: client should refetch before this elapses
      displayName: bio.displayName || 'Hugo Member',
      avatarUrl: bio.avatarUrl || '',
      balance: bio.joyBalance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const isBase64UrlJoyPayload = (payload) => typeof payload === 'string' && /^[A-Za-z0-9_-]{14}$/.test(payload);

// GET /api/joy/resolve-qr?payload= — decode scanned QR to public info.
router.get('/resolve-qr', async (req, res) => {
  try {
    const payload = String(req.query.payload || '').trim();
    if (!isBase64UrlJoyPayload(payload)) {
      return res.status(400).json({ success: false, error: 'Mã JOY không hợp lệ hoặc đã hết hạn.' });
    }
    // Reject anything not signed by us (forged codes, expired codes, plain
    // referral strings). Only a token this server minted verifies.
    const referralCode = verifyQrToken(payload);
    if (!referralCode) {
      return res.status(400).json({ success: false, error: 'Mã JOY không hợp lệ hoặc đã hết hạn.' });
    }
    const bio = await Bio.findOne({ referralCode }).select('displayName avatarUrl referralCode slug');
    if (!bio) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng này.' });
    res.json({ success: true, displayName: bio.displayName || 'Hugo Member', avatarUrl: bio.avatarUrl || '', referralCode: bio.referralCode, slug: bio.slug || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/joy/transfer  { fromEmail, toReferralCode|toEmail|toPhone, amount, message }
router.post('/transfer', requireMember, async (req, res) => {
  try {
    const { toPhone, toReferralCode, toEmail, amount, message } = req.body;
    // Sender identity comes from the verified session token — never the body.
    const fromEmail = req.memberEmail;
    if (!fromEmail || (!toPhone && !toReferralCode && !toEmail)) {
      return res.status(400).json({ error: 'Thiếu thông tin người gửi hoặc người nhận.' });
    }

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || !Number.isInteger(numAmount) || numAmount < TRANSFER_MIN || numAmount > TRANSFER_MAX) {
      return res.status(400).json({ error: `Số JOY gửi phải từ ${TRANSFER_MIN} đến ${TRANSFER_MAX}.` });
    }

    const sender = await Bio.findOne({ email: fromEmail });
    if (!sender) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người gửi.' });

    if (sender.joyBalance < 20) {
      return res.status(400).json({ error: 'Số dư của bạn phải có ít nhất 20 JOY mới được phép chuyển.' });
    }

    const accountAgeMs = Date.now() - new Date(sender.createdAt).getTime();
    if (accountAgeMs < TRANSFER_MIN_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: `Tài khoản cần đủ ${TRANSFER_MIN_ACCOUNT_AGE_DAYS} ngày tuổi mới được gửi JOY.` });
    }

    let recipient;
    if (toReferralCode) {
      recipient = await Bio.findOne({ referralCode: String(toReferralCode).trim().toUpperCase() });
    } else if (toEmail) {
      recipient = await Bio.findOne({ $or: [{ email: toEmail }, { contactEmail: toEmail }] });
    } else {
      recipient = await Bio.findOne({ phone: String(toPhone).trim() });
    }
    if (!recipient) return res.status(404).json({ error: 'Không tìm thấy người nhận.' });
    if (recipient.email === sender.email) {
      return res.status(400).json({ error: 'Không thể tự gửi JOY cho chính mình.' });
    }

    const today = todayStr();
    const sentTodaySoFar = sender.joySentDate === today ? (sender.joySentToday || 0) : 0;
    if (sentTodaySoFar + numAmount > TRANSFER_DAILY_CAP) {
      return res.status(400).json({ error: `Vượt giới hạn gửi ${TRANSFER_DAILY_CAP} JOY/ngày. Cậu đã gửi ${sentTodaySoFar} JOY hôm nay.` });
    }

    const feeAmount = Math.floor(numAmount * TRANSFER_FEE_RATE);
    const totalDeducted = numAmount + feeAmount;

    if (sender.joyBalance < totalDeducted) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Bạn cần ${totalDeducted} JOY (bao gồm ${feeAmount} JOY phí sáng tạo).` });
    }

    sender.joySentDate = today;
    sender.joySentToday = sentTodaySoFar + numAmount;

    const customMsg = message ? ` Lời nhắn: "${message}"` : '';
    const recipientName = recipient.displayName || 'bạn bè';
    const senderName = sender.displayName || 'Một người bạn';

    // Short, human-readable transaction code shared by both ledger rows —
    // lets the receipt/notification on either side reference the same transfer.
    const txCode = `JOY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    // Execute concurrently for instant real-time websocket delivery.
    // Pass bioDoc to skip redundant DB reads inside awardJoy.
    const [senderResult] = await Promise.all([
      awardJoy(
        sender.email, -totalDeducted, 'joy_gift_sent',
        `Gửi JOY cho ${recipientName} (-${numAmount} JOY, phí -${feeAmount} JOY). Mã GD: ${txCode}.${customMsg}`,
        { refId: txCode, bioDoc: sender }
      ),
      awardJoy(
        recipient.email, numAmount, 'joy_gift_received',
        `${senderName} đã chuyển ${numAmount} JOY đến bạn. Mã GD: ${txCode}.${customMsg}`,
        {
          refId: txCode,
          bioDoc: recipient,
          notificationTitle: 'Bạn vừa nhận được JOY',
          notificationMessage: `${senderName} đã chuyển ${numAmount} JOY đến bạn. Mã GD: ${txCode}.${customMsg} Số dư: ${Math.max(0, recipient.joyBalance + numAmount)} JOY.`,
          pushNotify: true,
          pushTitle: 'Bạn vừa nhận được JOY',
          pushBody: `${senderName} đã chuyển ${numAmount} JOY đến bạn.${customMsg}`,
          actionUrl: '/member/joy'
        }
      )
    ]);

    res.json({
      success: true,
      balance: senderResult.balance,
      sentAmount: numAmount,
      netAmount: numAmount,
      feeAmount,
      recipientName: recipient.displayName || '',
      senderName,
      message: message || '',
      txCode,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/exchange-chat-tokens
router.post('/exchange-chat-tokens', requireMember, async (req, res) => {
  try {
    const { tokenAmount } = req.body;
    const email = req.memberEmail;
    if (!email || !tokenAmount) return res.status(400).json({ error: 'Thiếu thông tin người dùng hoặc số token.' });

    const tokens = Number(tokenAmount);
    if (!Number.isFinite(tokens) || !Number.isInteger(tokens) || tokens < 5 || tokens > 50) {
      return res.status(400).json({ error: 'Số lượng Token quy đổi phải từ 5 đến 50.' });
    }

    const cost = tokens * 25;

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.joyBalance < cost) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Bạn cần ${cost} JOY để đổi ${tokens} Token.` });
    }

    // Award/deduct JOY
    const result = await awardJoy(
      bio.email,
      -cost,
      'chat_tokens_exchange',
      `Đổi ${cost} JOY lấy ${tokens} Token AI`,
      { bioDoc: bio, skipSave: true }
    );

    // Add bonusChatTokens
    bio.bonusChatTokens = (bio.bonusChatTokens || 0) + tokens;
    await bio.save();

    res.json({ success: true, balance: result.balance, bonusChatTokens: bio.bonusChatTokens });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
