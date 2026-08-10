import express from 'express';
import Bio from '../models/Bio.js';
import JoyLedger from '../models/JoyLedger.js';
import { awardJoy, getJoyHistory, getJoySummary } from '../utils/joyService.js';
import { ensureReferralCode } from '../utils/referralService.js';
import { requireAdmin, requireMember } from '../middleware/authMiddleware.js';
import { bioAge, isMinorAge } from '../utils/memberAge.js';
import { FEATURE_PRICES, chargeFeatureSubscription, calcExchangeTotal } from '../utils/featureSubscriptionService.js';
import { ownExchangeItems } from '../utils/appPlanService.js';
import UtilityProduct from '../models/UtilityProduct.js';
import { startExam, submitExam, consumeExamPass, isQuizLesson } from '../utils/coderExamService.js';
import { signQrToken, verifyQrToken, JOY_QR_BUCKET_MS } from '../utils/joyQrToken.js';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import NodeCache from 'node-cache';

const idempotencyCache = new NodeCache({ stdTTL: 300 });

const BIO_THEME_RENTAL_PRICE = 150;
const COMPRESS_CHARGE = 50;
const CODER_LESSON_IDS = Array.from({ length: 100 }, (_, index) => `lesson${index + 1}`);
const CODER_MIN_STUDY_MS = 10 * 60 * 1000;
const CODER_QUIZ_LESSONS = new Set(['lesson6', 'lesson25', 'lesson50', 'lesson57', 'lesson58']);
const CODER_SCREENSHOT_LESSONS = new Set(['lesson10']);
const HUGOSO_COURSES = Object.freeze({
  calendar: { label: 'Google Calendar chuẩn công việc', priceJoy: 320 },
  docs: { label: 'Google Docs & báo cáo Harvard', priceJoy: 450 },
  sheets: { label: 'Google Sheets chuẩn vận hành', priceJoy: 520 },
  gemini: { label: 'Google Gemini cho học tập & công việc', priceJoy: 390 }
});
const HUGOSO_BUNDLE_PRICE = 1290;
const HUGOSO_COURSE_IDS = Object.freeze(Object.keys(HUGOSO_COURSES));
const CODER_STAGE_DEFINITIONS = {
  basic: {
    key: 'hugoCoderBasicLifetime',
    label: 'Chặng 1: Phản Xạ Cơ Bản',
    priceJoy: 1500
  },
  intermediate: {
    key: 'hugoCoderIntermediateLifetime',
    label: 'Chặng 2: Tư Duy Kiến Trúc',
    priceJoy: 2600,
    previousTier: 'basic',
    requiredLesson: 'lesson10'
  },
  advanced: {
    key: 'hugoCoderAdvancedLifetime',
    label: 'Chặng 3: CTDL, Giải Thuật & Mật Mã',
    priceJoy: 2600,
    previousTier: 'intermediate',
    requiredLesson: 'lesson25'
  },
  security: {
    key: 'hugoCoderSecurityLifetime',
    label: 'Chặng 4: Kỹ Sư Bảo Mật & Tiền Đề AI',
    priceJoy: 2600,
    previousTier: 'advanced',
    requiredLesson: 'lesson50'
  },
  project: {
    key: 'hugoCoderUltimateLifetime',
    label: 'Chặng 5: Siêu Đồ Án Full-Stack & AI',
    priceJoy: 3500,
    previousTier: 'security',
    requiredLesson: 'lesson70'
  },
  devops: {
    key: 'hugoCoderDevopsLifetime',
    label: 'Chặng 6: Kỹ Sư DevOps & Phát Hành',
    priceJoy: 1500,
    previousTier: 'project',
    requiredLesson: 'lesson90'
  }
};

function getCoderOwnedStages(bio) {
  return {
    basic: Boolean(bio.hugoCoderBasicLifetime),
    intermediate: Boolean(bio.hugoCoderIntermediateLifetime),
    advanced: Boolean(bio.hugoCoderAdvancedLifetime),
    security: Boolean(
      bio.hugoCoderSecurityLifetime
      || bio.hugoCoderExamLifetime
      || bio.hugoCoderOptimizeLifetime
    ),
    project: Boolean(bio.hugoCoderUltimateLifetime),
    devops: Boolean(bio.hugoCoderDevopsLifetime || bio.hugoCoderUltimateLifetime)
  };
}

function getCoderStageQuote(bio, tier) {
  const definition = CODER_STAGE_DEFINITIONS[tier];
  if (!definition) {
    return { eligible: false, code: 'INVALID_TIER', error: 'Cấp độ mở khóa không hợp lệ.' };
  }

  const owned = getCoderOwnedStages(bio);
  const { tax, total } = calcExchangeTotal(definition.priceJoy);
  const base = {
    tier,
    label: definition.label,
    priceJoy: definition.priceJoy,
    tax,
    total,
    balance: Number(bio.joyBalance) || 0,
    alreadyOwned: owned[tier]
  };

  if (owned[tier]) {
    return {
      ...base,
      eligible: false,
      code: 'ALREADY_OWNED',
      error: 'Bạn đã mở khóa vĩnh viễn chặng này rồi.'
    };
  }

  if (definition.previousTier && !owned[definition.previousTier]) {
    const previous = CODER_STAGE_DEFINITIONS[definition.previousTier];
    return {
      ...base,
      eligible: false,
      code: 'PREVIOUS_STAGE_REQUIRED',
      error: `Bạn cần mở khóa ${previous.label} trước.`
    };
  }

  if (
    definition.requiredLesson
    && !(bio.completedLessons || []).includes(definition.requiredLesson)
  ) {
    const previous = CODER_STAGE_DEFINITIONS[definition.previousTier];
    return {
      ...base,
      eligible: false,
      code: 'PREVIOUS_STAGE_INCOMPLETE',
      error: `Bạn cần hoàn thành ${previous.label} trước khi mở khóa chặng tiếp theo.`
    };
  }

  if (base.balance < total) {
    return {
      ...base,
      eligible: false,
      code: 'INSUFFICIENT_JOY',
      error: `Số dư JOY không đủ. Cần ${total} JOY (gồm ${tax} JOY phí sáng tạo) để mua.`
    };
  }

  return { ...base, eligible: true };
}

// Item labels shown on the invoice modal, keyed the same way the frontend
// calls /exchange-quote — kept here (not duplicated client-side) so price
// changes only ever need updating in one place.
const EXCHANGE_ITEMS = {
  hugoCoder: { label: 'HugoCoder Cơ Bản (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoder },
  hugoCoderIntermediate: { label: 'HugoCoder Trung Cấp (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderIntermediate },
  hugoCoderAdvanced: { label: 'HugoCoder Cao Cấp (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderAdvanced },
  hugoCoderSecurity: { label: 'HugoCoder Bảo Mật (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderSecurity },
  hugoCoderExam: { label: 'HugoCoder Kiểm Tra (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderExam },
  hugoCoderOptimize: { label: 'HugoCoder Tối Ưu & AI (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderOptimize },
  hugoCoderUltimate: { label: 'HugoCoder Lập Trình Web Nâng Cao (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoderUltimate },
  hugoAura: { label: 'HugoAura — Lofi & Cửa hàng giao diện (1 tháng)', priceJoy: FEATURE_PRICES.hugoAura },
  hugoRadio: { label: 'HugoRadio (1 tháng)', priceJoy: FEATURE_PRICES.hugoRadio },
  hugoArcade: { label: 'HugoArcade — Bứt phá & Huyền thoại (1 tháng)', priceJoy: FEATURE_PRICES.hugoArcade },
  hugoChess: { label: 'HugoChess — Cờ vua đỉnh cao (1 tháng)', priceJoy: FEATURE_PRICES.hugoChess },
  bioThemeBrutalism: { label: 'Giao diện Bio: Brutalism (1 tháng)', priceJoy: BIO_THEME_RENTAL_PRICE },
  bioThemeFlat: { label: 'Giao diện Bio: Flat (1 tháng)', priceJoy: BIO_THEME_RENTAL_PRICE },
  fileCompression: { label: 'Nén file HugoTractare', priceJoy: COMPRESS_CHARGE },
  // Bậc "sở hữu vĩnh viễn" của Hugo Store, sinh từ APP_PLANS nên bảng giá chỉ
  // có một chỗ để sửa (server/utils/appPlanService.js).
  ...ownExchangeItems()
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
const FOCUS_DAILY_JOY_CAP = 150;

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

    // Vật phẩm cửa hàng (UtilityProduct) có giá nằm trong DB nên không thể liệt
    // kê tĩnh; giải bằng khoá `product_<id>` để vẫn dùng chung đúng hoá đơn này.
    let def = EXCHANGE_ITEMS[item];
    if (!def && String(item).startsWith('product_')) {
      const product = await UtilityProduct
        .findById(String(item).slice('product_'.length))
        .lean()
        .catch(() => null);
      if (product?.active) def = { label: product.name, priceJoy: product.priceJoy };
    }
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
    if (!bio) return res.json({ balance: 0, referralCode: "" });

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

function hugoSOPricing(bio) {
  const owned = new Set(bio?.hugoSOCourses || []);
  const remaining = HUGOSO_COURSE_IDS.filter((courseId) => !owned.has(courseId));
  const remainingListPrice = remaining.reduce(
    (sum, courseId) => sum + HUGOSO_COURSES[courseId].priceJoy,
    0
  );
  // Members who already bought individual courses never pay for them twice.
  // The 18% bundle rate is applied only to the remaining curriculum.
  const bundlePrice = remaining.length === HUGOSO_COURSE_IDS.length
    ? HUGOSO_BUNDLE_PRICE
    : Math.round(remainingListPrice * 0.82);
  const pricing = Object.fromEntries(
    HUGOSO_COURSE_IDS.map((courseId) => [
      courseId,
      calcExchangeTotal(HUGOSO_COURSES[courseId].priceJoy)
    ])
  );
  pricing.bundle = calcExchangeTotal(bundlePrice);
  return { pricing, remaining };
}

// HugoSO access is intentionally separate from monthly app subscriptions:
// courses are owned for life and never renew automatically.
router.get('/hugoso-access', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const { pricing } = hugoSOPricing(bio);
    return res.json({
      ownedCourses: bio.hugoSOCourses || [],
      pricing,
      balance: Number(bio.joyBalance) || 0
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/buy-hugoso-course', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const courseId = String(req.body?.courseId || '');
    if (courseId !== 'bundle' && !HUGOSO_COURSES[courseId]) {
      return res.status(400).json({ error: 'Khóa học HugoSO không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const owned = new Set(bio.hugoSOCourses || []);
    const { pricing, remaining } = hugoSOPricing(bio);
    if (courseId === 'bundle' && remaining.length === 0) {
      return res.status(400).json({ error: 'Bạn đã sở hữu toàn bộ khóa học HugoSO.' });
    }
    if (courseId !== 'bundle' && owned.has(courseId)) {
      return res.status(400).json({ error: 'Bạn đã sở hữu khóa học này.' });
    }

    const targetIds = courseId === 'bundle' ? remaining : [courseId];
    const quote = pricing[courseId];
    if (bio.joyBalance < quote.total) {
      return res.status(400).json({
        error: `Số dư JOY không đủ. Bạn cần ${quote.total} JOY để mở khóa.`
      });
    }

    const label = courseId === 'bundle'
      ? `Office Ready Bundle (${targetIds.length} khóa còn lại)`
      : HUGOSO_COURSES[courseId].label;
    const result = await awardJoy(
      bio.email,
      -quote.total,
      'hugoso_course',
      `Mở khóa trọn đời ${label} (gồm ${quote.tax} JOY phí sáng tạo)`,
      {
        bioDoc: bio,
        skipSave: true,
        refId: `hugoso_${courseId}`,
        actionUrl: '/member/utilities/hugoso',
        notificationMessage: `Bạn đã sở hữu trọn đời ${label}.`
      }
    );

    bio.hugoSOCourses = [...new Set([...(bio.hugoSOCourses || []), ...targetIds])];
    bio.markModified('hugoSOCourses');
    await bio.save();

    return res.json({
      success: true,
      balance: result.balance,
      ownedCourses: bio.hugoSOCourses,
      unlockedCourses: targetIds
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// GET /api/joy/history?limit=50&days=30
// Trả kèm tổng kết N ngày để ví chỉ cần một lượt gọi. `days=0` bỏ phần tổng kết.
router.get('/history', requireMember, async (req, res) => {
  try {
    const { limit, days } = req.query;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    const wantSummary = days === undefined || Number(days) > 0;
    const [transactions, summary] = await Promise.all([
      getJoyHistory(email, limit),
      wantSummary ? getJoySummary(email, days) : Promise.resolve(null)
    ]);
    res.json({ transactions, summary });
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

const CODER_EXAM_RETAKE_FEE = 250; // Lượt thi đầu nằm trong gói; từ lượt 2: 250 JOY/lần

// POST /api/joy/coder-exam/start — máy chủ ra đề (không gửi đáp án xuống client)
router.post('/coder-exam/start', requireMember, async (req, res) => {
  try {
    const { lessonId, confirmRetake } = req.body;
    const email = req.memberEmail;
    if (!email || !lessonId) return res.status(400).json({ error: 'lessonId là bắt buộc.' });
    if (!CODER_QUIZ_LESSONS.has(lessonId) || !isQuizLesson(lessonId)) {
      return res.status(400).json({ error: 'Bài học này không phải bài thi trắc nghiệm.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const attemptsUsed = Number(bio.hugoCoderExamAttempts?.[lessonId] || 0);
    const alreadyCompleted = (bio.completedLessons || []).includes(lessonId);
    const needsFee = !alreadyCompleted && attemptsUsed >= 1; // đã hoàn thành thì ôn tập miễn phí

    let charged = 0;
    if (needsFee) {
      if (!confirmRetake) {
        // Client phải xác nhận trước khi bị trừ JOY — không trừ tiền âm thầm
        return res.status(402).json({
          error: `Lượt thi trong gói đã dùng. Thi lại tốn ${CODER_EXAM_RETAKE_FEE} JOY/lần.`,
          requiresFee: CODER_EXAM_RETAKE_FEE,
          attemptsUsed
        });
      }
      try {
        await awardJoy(
          email,
          -CODER_EXAM_RETAKE_FEE,
          'coder_exam_retake',
          `Phí thi lại HugoCoder ${lessonId} (lượt ${attemptsUsed + 1})`,
          { bioDoc: bio, refId: `${lessonId}_retake_${attemptsUsed + 1}` }
        );
        charged = CODER_EXAM_RETAKE_FEE;
      } catch (e) {
        if (e.message === 'INSUFFICIENT_JOY') {
          return res.status(400).json({ error: `Số dư JOY không đủ — cần ${CODER_EXAM_RETAKE_FEE} JOY để thi lại.` });
        }
        throw e;
      }
    }

    const exam = startExam(email, lessonId);
    res.json({ ...exam, attemptsUsed, charged, retakeFee: CODER_EXAM_RETAKE_FEE, balance: bio.joyBalance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/coder-exam/submit — máy chủ chấm, đậu thì cấp vé ngắn hạn cho award-learning
router.post('/coder-exam/submit', requireMember, async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const email = req.memberEmail;
    if (!email || !examId) return res.status(400).json({ error: 'examId là bắt buộc.' });

    const result = submitExam(email, examId, answers);

    // Mỗi lần NỘP tiêu một lượt thi (chỉ đếm khi bài chưa hoàn thành)
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (bio && !(bio.completedLessons || []).includes(result.lessonId)) {
      const attempts = { ...(bio.hugoCoderExamAttempts || {}) };
      attempts[result.lessonId] = Number(attempts[result.lessonId] || 0) + 1;
      bio.hugoCoderExamAttempts = attempts;
      bio.markModified('hugoCoderExamAttempts');
      await bio.save();
    }

    res.json(result);
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



    if (CODER_QUIZ_LESSONS.has(lessonId)) {
      // Điểm bài thi do MÁY CHỦ chấm (coder-exam/start + submit) — không tin điểm client khai
      const serverScore = consumeExamPass(email, lessonId);
      if (serverScore === null) {
        return res.status(400).json({ error: 'Bài thi phải được chấm tại máy chủ. Hãy làm bài trong phần Thực hành tương tác và đạt tối thiểu 60%.' });
      }
    } else if (CODER_SCREENSHOT_LESSONS.has(lessonId)) {
      const score = Number(evidence.score);
      if (!Number.isFinite(score) || score < 60) {
        return res.status(400).json({ error: 'Bài nộp cần đạt tối thiểu 60% để nhận thưởng JOY.' });
      }
    }



    bio.completedLessons.push(lessonId);
    bio.markModified('completedLessons');
    await bio.save();

    res.json({ success: true, balance: bio.joyBalance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// POST /api/joy/submit-graduation-project
router.post('/submit-graduation-project', requireMember, async (req, res) => {
  try {
    const { projectUrl, projectNote } = req.body;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!projectUrl) return res.status(400).json({ error: 'Vui lòng cung cấp link dự án của bạn.' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    bio.hugoCoderProjectUrl = projectUrl;
    bio.hugoCoderProjectNote = projectNote || '';
    bio.hugoCoderProjectStatus = 'pending';
    bio.hugoCoderProjectSubmittedAt = new Date();

    await bio.save();
    res.json({ success: true, bio });
  } catch (error) {
    console.error('Error submitting graduation project:', error);
    res.status(500).json({ error: error.message });
  }
});


// POST /api/joy/claim-milestone-reward
router.post('/claim-milestone-reward', requireMember, async (req, res) => {
  try {
    const { phase } = req.body; // number 3, 4, 5, or 6
    const email = req.memberEmail;
    if (!email || !phase) return res.status(400).json({ error: 'email and phase are required' });

    const phaseNum = Number(phase);
    if (![3, 4, 5].includes(phaseNum)) {
      return res.status(400).json({ error: 'Chặng nhận thưởng không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Chặng 4 mới gộp các mốc cũ 4/5/6 — ai đã nhận mốc cũ nào cũng coi như đã nhận.
    // Chặng 5 mới (bài 90) dùng khoá RewardClaimed7 còn trống của hệ cũ.
    const claimKeysByPhase = {
      3: ['hugoCoderRewardClaimed3'],
      4: ['hugoCoderRewardClaimed4', 'hugoCoderRewardClaimed5', 'hugoCoderRewardClaimed6'],
      5: ['hugoCoderRewardClaimed7']
    };
    const claimKey = claimKeysByPhase[phaseNum][0];
    if (claimKeysByPhase[phaseNum].some((k) => bio[k])) {
      return res.status(400).json({ error: `Bạn đã nhận phần thưởng cho Chặng ${phaseNum} rồi.` });
    }

    // Check completion
    const completed = bio.completedLessons || [];
    let requiredLesson = '';
    if (phaseNum === 3) requiredLesson = 'lesson50';
    else if (phaseNum === 4) requiredLesson = 'lesson70';
    else if (phaseNum === 5) requiredLesson = 'lesson90';

    if (!completed.includes(requiredLesson)) {
      return res.status(400).json({ error: `Bạn cần hoàn thành Chặng ${phaseNum} (đến bài ${requiredLesson.replace('lesson', 'Bài ')}) để nhận thưởng.` });
    }

    const rewardAmount = 800;
    const result = await awardJoy(
      email,
      rewardAmount,
      `ide_phase_${phaseNum}_completion`,
      `Nhận thưởng hoàn thành Chặng ${phaseNum} HugoCoder (+800 JOY)`,
      { bioDoc: bio, refId: `${requiredLesson}_phase_completion` }
    );

    bio[claimKey] = true;
    await bio.save();

    res.json({ success: true, balance: result.balance, bio });
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

    const claimed = await Bio.findOneAndUpdate(
      { _id: bio._id, infoBonusClaimed: { $ne: true } },
      { $set: { infoBonusClaimed: true } },
      { new: true },
    );
    if (!claimed) return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });

    const result = await awardJoy(email, 20, 'info_bonus', 'Khám phá Info & Version (+20 JOY)');

    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/claim-info-read-bonus — one-time bonus for reading the 2.0
// release notes to the end. The client only unlocks the button after the last
// section is on screen; the server still enforces the one-time rule, which is
// the part that actually protects the balance.
router.post('/claim-info-read-bonus', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.infoReadBonusClaimed) {
      return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });
    }

    const claimed = await Bio.findOneAndUpdate(
      { _id: bio._id, infoReadBonusClaimed: { $ne: true } },
      { $set: { infoReadBonusClaimed: true } },
      { new: true },
    );
    if (!claimed) return res.json({ success: true, alreadyClaimed: true, balance: bio.joyBalance });

    const result = await awardJoy(email, 50, 'info_read_bonus', 'Đọc hết bản nâng cấp 2.0 (+50 JOY)');

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
    const numMinutes = Number(minutes);
    if (!email || !Number.isFinite(numMinutes) || !Number.isInteger(numMinutes) || numMinutes < 1 || numMinutes > 1440) {
      return res.status(400).json({ error: 'Số phút tập trung không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Base rewards x3.
    let joyAmount = 0;
    if (numMinutes >= 180) joyAmount = 150;
    else if (numMinutes >= 60) joyAmount = 45;
    else if (numMinutes >= 25) joyAmount = 15;

    if (joyAmount <= 0) {
      return res.status(400).json({ error: 'Thời gian tập trung chưa đủ để nhận thưởng JOY.' });
    }

    const today = todayStr();
    await Bio.updateOne(
      { _id: bio._id, focusJoyDate: { $ne: today } },
      { $set: { focusJoyDate: today, focusJoyToday: 0 } },
    );
    const reserved = await Bio.findOneAndUpdate(
      { _id: bio._id, focusJoyDate: today, focusJoyToday: { $lte: FOCUS_DAILY_JOY_CAP - joyAmount } },
      { $inc: { focusJoyToday: joyAmount } },
      { new: true, projection: { focusJoyToday: 1 } },
    );
    if (!reserved) {
      return res.status(429).json({ error: `Đã đạt giới hạn ${FOCUS_DAILY_JOY_CAP} JOY tập trung trong ngày.` });
    }

    let result;
    try {
      result = await awardJoy(email, joyAmount, 'focus_session', `Tập trung sâu HugoAura: ${numMinutes} phút`);
    } catch (error) {
      await Bio.updateOne(
        { _id: bio._id, focusJoyDate: today, focusJoyToday: { $gte: joyAmount } },
        { $inc: { focusJoyToday: -joyAmount } },
      );
      throw error;
    }

    res.json({ success: true, balance: result.balance, awarded: joyAmount, dailyAwarded: reserved.focusJoyToday });
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

    // Block stage-specific monthly subscriptions, only allow hugoCoder (maintenance fee)
    if (featureKey.startsWith('hugoCoder') && featureKey !== 'hugoCoder') {
      return res.status(400).json({ error: 'Cấp độ này chỉ có thể mở khóa vĩnh viễn, không hỗ trợ thuê tháng.' });
    }

    const { balance, expiresAt } = await chargeFeatureSubscription(email, featureKey, Number(months) || 1);
    res.json({ success: true, balance, expiresAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/joy/lifetime-unlock-quote?tier=
 * Validate ownership, learning prerequisites and balance before opening the
 * confirmation sheet. Business denials intentionally return 200 so expected
 * eligibility checks do not appear as failed network requests in DevTools.
 */
router.get('/lifetime-unlock-quote', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    const { tier } = req.query;
    if (!CODER_STAGE_DEFINITIONS[tier]) {
      return res.status(400).json({ error: 'Cấp độ mở khóa không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    return res.json(getCoderStageQuote(bio, tier));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/coder-access — small authoritative snapshot used when opening
// HugoCoder so an old portal/bootstrap cache can never repaint a purchased
// stage as locked.
router.get('/coder-access', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    return res.json({
      bio: {
        hugoCoderAll7Lifetime: Boolean(bio.hugoCoderAll7Lifetime),
        hugoCoderBasicLifetime: Boolean(bio.hugoCoderBasicLifetime),
        hugoCoderIntermediateLifetime: Boolean(bio.hugoCoderIntermediateLifetime),
        hugoCoderAdvancedLifetime: Boolean(bio.hugoCoderAdvancedLifetime),
        hugoCoderSecurityLifetime: Boolean(bio.hugoCoderSecurityLifetime),
        hugoCoderExamLifetime: Boolean(bio.hugoCoderExamLifetime),
        hugoCoderOptimizeLifetime: Boolean(bio.hugoCoderOptimizeLifetime),
        hugoCoderUltimateLifetime: Boolean(bio.hugoCoderUltimateLifetime),
        hugoCoderDevopsLifetime: Boolean(bio.hugoCoderDevopsLifetime),
        featureSubscriptions: bio.featureSubscriptions || {},
        completedLessons: bio.completedLessons || [],
        joyBalance: Number(bio.joyBalance) || 0
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/joy/buy-lifetime-unlock
 * Deduct stage price to grant lifetime unlock access to Coder phase.
 */
router.post('/buy-lifetime-unlock', requireMember, async (req, res) => {
  try {
    const { tier } = req.body; // 6 chặng: 'basic', 'intermediate', 'advanced', 'security' (51-70), 'project' (71-90), 'devops' (91-100)
    const email = req.memberEmail;
    if (!email || !CODER_STAGE_DEFINITIONS[tier]) {
      return res.status(400).json({ error: 'Cấp độ mở khóa không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const quote = getCoderStageQuote(bio, tier);
    if (quote.alreadyOwned) {
      return res.json({
        success: true,
        alreadyOwned: true,
        balance: quote.balance,
        bio
      });
    }
    if (!quote.eligible) {
      return res.status(409).json({ error: quote.error, code: quote.code });
    }

    const result = await awardJoy(
      bio.email,
      -quote.total,
      'lifetime_unlock',
      `Trao đổi JOY mở khóa vĩnh viễn HugoCoder ${quote.label} (gồm ${quote.tax} JOY phí sáng tạo)`,
      { bioDoc: bio, skipSave: true, refId: CODER_STAGE_DEFINITIONS[tier].key }
    );

    bio[CODER_STAGE_DEFINITIONS[tier].key] = true;
    await bio.save();

    res.json({ success: true, balance: result.balance, bio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/joy/buy-all-stages-bundle
 * Deduct 16,000 JOY (+ 10% tax = 17,600 total) to grant lifetime unlock access to all 7 phases and waive maintenance.
 */
router.post('/buy-all-stages-bundle', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (bio.hugoCoderAll7Lifetime) {
      return res.json({
        success: true,
        alreadyOwned: true,
        balance: Number(bio.joyBalance) || 0,
        bio
      });
    }

    const priceJoy = 16000;
    const { tax, total } = calcExchangeTotal(priceJoy);
    if (bio.joyBalance < total) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${total} JOY (gồm ${tax} JOY phí sáng tạo) để mua trọn gói.` });
    }

    const result = await awardJoy(
      bio.email,
      -total,
      'lifetime_unlock_all',
      `Trao đổi JOY trọn gói vĩnh viễn 6 chặng HugoCoder (Miễn phí bảo trì trọn đời, gồm ${tax} JOY phí sáng tạo)`,
      { bioDoc: bio, skipSave: true, refId: 'hugoCoderAll7Lifetime' }
    );

    bio.hugoCoderAll7Lifetime = true;
    bio.hugoCoderBasicLifetime = true;
    bio.hugoCoderIntermediateLifetime = true;
    bio.hugoCoderAdvancedLifetime = true;
    bio.hugoCoderSecurityLifetime = true;
    bio.hugoCoderDevopsLifetime = true;
    bio.hugoCoderExamLifetime = true;
    bio.hugoCoderOptimizeLifetime = true;
    bio.hugoCoderUltimateLifetime = true;

    await bio.save();
    res.json({ success: true, balance: result.balance, bio });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// ─── Vòng quay tháng sinh nhật ───────────────────────────────────────────────
// Mỗi thành viên một lượt mỗi năm, chỉ trong tháng sinh của mình. Phần thưởng
// do server bốc, client chỉ nhận kết quả rồi quay hình cho khớp — nếu để client
// tự bốc thì sửa vài dòng trong DevTools là ra 10.000 JOY.
const BIRTHDAY_PRIZES = [10, 50, 100, 500, 1000, 5000, 10000];

// GET /api/joy/birthday-spin — còn lượt quay không, và danh sách ô để vẽ vòng.
router.get('/birthday-spin', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail }, 'birthMonth birthdaySpinYear birthdaySpinPrize displayName').lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    const now = new Date();
    const isBirthMonth = Number(bio.birthMonth) === now.getMonth() + 1;
    const spunThisYear = Number(bio.birthdaySpinYear) === now.getFullYear();
    res.json({
      prizes: BIRTHDAY_PRIZES,
      isBirthMonth,
      available: isBirthMonth && !spunThisYear,
      spunThisYear,
      lastPrize: spunThisYear ? Number(bio.birthdaySpinPrize) || 0 : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/birthday-spin — bốc thưởng và cộng JOY.
router.post('/birthday-spin', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

    const now = new Date();
    if (Number(bio.birthMonth) !== now.getMonth() + 1) {
      return res.status(403).json({ error: 'Vòng quay chỉ mở trong tháng sinh nhật của bạn.' });
    }

    // Chốt lượt TRƯỚC khi cộng JOY: hai request bấm cùng lúc thì chỉ một cái
    // đổi được birthdaySpinYear, cái còn lại không khớp điều kiện nên trượt.
    const claimed = await Bio.findOneAndUpdate(
      { _id: bio._id, birthdaySpinYear: { $ne: now.getFullYear() } },
      { $set: { birthdaySpinYear: now.getFullYear() } },
      { new: true },
    );
    if (!claimed) {
      return res.status(409).json({ error: 'Bạn đã dùng lượt quay của năm nay rồi.' });
    }

    // randomInt của crypto: phân phối đều thật sự, không lệch như Math.random()
    // nhân rồi làm tròn. Bảy ô cùng xác suất — không ô nào bị "gài".
    const index = randomInt(BIRTHDAY_PRIZES.length);
    const prize = BIRTHDAY_PRIZES[index];

    try {
      await awardJoy(req.memberEmail, prize, 'birthday_spin', `Quà tháng sinh nhật ${now.getMonth() + 1}/${now.getFullYear()}`);
    } catch (awardError) {
      // Cộng JOY hỏng thì trả lại lượt quay, đừng để mất trắng.
      await Bio.updateOne({ _id: bio._id }, { $set: { birthdaySpinYear: Number(bio.birthdaySpinYear) || 0 } });
      throw awardError;
    }
    await Bio.updateOne({ _id: bio._id }, { $set: { birthdaySpinPrize: prize } });

    res.json({ success: true, prize, index, prizes: BIRTHDAY_PRIZES });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/resolve-phone?phone= — lookup before sending, MoMo-style confirm.
// Never returns email (privacy) — only what's needed to show "Gửi tới: <name>".
// Tra người nhận bằng số điện thoại. Phải đăng nhập (trước đây mở cho cả
// người lạ), và tài khoản dưới 18 không xuất hiện: bạn bè muốn tặng JOY thì
// quét QR/NFC trực tiếp, không dò được bằng số điện thoại.
router.get('/resolve-phone', requireMember, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Số điện thoại là bắt buộc.' });

    const bio = await Bio.findOne({ phone: String(phone).trim() });
    if (!bio || isMinorAge(bioAge(bio))) return res.status(404).json({ error: 'Không tìm thấy người dùng với số điện thoại này.' });

    res.json({ displayName: bio.displayName || 'Người dùng Hugo Studio', avatar: bio.avatarUrl || '', slug: bio.slug || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/search-user?q=&email= — MoMo-style smart search by any field.
// Returns limited public info only (no email exposed).
router.get('/search-user', requireMember, async (req, res) => {
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
      .select('displayName avatarUrl referralCode phone slug birthYear birthMonth')
      .limit(12)
      .lean();

    res.json(results.filter(b => !isMinorAge(bioAge(b))).slice(0, 6).map(b => ({
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

// GET /api/joy/resolve-nfc?code= — resolve a plain referral code read from an
// NFC tag. Unlike /resolve-qr, the code is NOT a time-bound HMAC token — it's
// the static referral code written to a physical NFC tag.
router.get('/resolve-nfc', async (req, res) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    if (!code || code.length > 8 || !/^[A-Z0-9]+$/.test(code)) {
      return res.status(400).json({ success: false, error: 'Mã NFC không hợp lệ.' });
    }
    const bio = await Bio.findOne({ referralCode: code }).select('displayName avatarUrl referralCode slug');
    if (!bio) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng này.' });
    res.json({ success: true, displayName: bio.displayName || 'Hugo Member', avatarUrl: bio.avatarUrl || '', referralCode: bio.referralCode, slug: bio.slug || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/joy/has-pin
router.get('/has-pin', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    res.json({ hasPin: !!bio.transactionPin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/joy/set-pin
router.post('/set-pin', requireMember, async (req, res) => {
  try {
    const { pin } = req.body;
    const email = req.memberEmail;
    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({ error: 'Mã PIN phải có đúng 6 chữ số.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const hashedPin = await bcrypt.hash(String(pin), 12);
    bio.transactionPin = hashedPin;
    await bio.save();

    res.json({ success: true, message: 'Đã thiết lập mã PIN giao dịch thành công.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/joy/verify-pin
router.post('/verify-pin', requireMember, async (req, res) => {
  try {
    const { pin } = req.body;
    const email = req.memberEmail;
    if (!pin) return res.status(400).json({ error: 'Thiếu mã PIN cần xác thực.' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (!bio.transactionPin) {
      return res.status(400).json({ error: 'Người dùng chưa thiết lập mã PIN.' });
    }

    const isValid = await bcrypt.compare(String(pin), bio.transactionPin);
    res.json({ success: isValid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/joy/transfer  { fromEmail, toReferralCode|toEmail|toPhone, amount, message, pin, idempotencyKey }
router.post('/transfer', requireMember, async (req, res) => {
  try {
    const { toPhone, toReferralCode, toEmail, amount, message, pin, idempotencyKey } = req.body;
    const fromEmail = req.memberEmail;
    if (!fromEmail || (!toPhone && !toReferralCode && !toEmail)) {
      return res.status(400).json({ error: 'Thiếu thông tin người gửi hoặc người nhận.' });
    }

    // 1. Chống gửi lặp request (Idempotency)
    if (idempotencyKey) {
      const cacheKey = `idempotency:${fromEmail}:${idempotencyKey}`;
      if (idempotencyCache.has(cacheKey)) {
        return res.status(409).json({ error: 'Giao dịch đang được xử lý hoặc đã gửi trước đó.' });
      }
      idempotencyCache.set(cacheKey, true);
    }

    const rejectRequest = (status, errorMsg) => {
      if (idempotencyKey) {
        const cacheKey = `idempotency:${fromEmail}:${idempotencyKey}`;
        idempotencyCache.del(cacheKey);
      }
      return res.status(status).json({ error: errorMsg });
    };

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || !Number.isInteger(numAmount) || numAmount < TRANSFER_MIN || numAmount > TRANSFER_MAX) {
      return rejectRequest(400, `Số JOY gửi phải từ ${TRANSFER_MIN} đến ${TRANSFER_MAX}.`);
    }

    const sender = await Bio.findOne({ email: fromEmail });
    if (!sender) return rejectRequest(404, 'Không tìm thấy hồ sơ người gửi.');

    // 2. Xác thực PIN giao dịch (nếu đã cài đặt)
    if (sender.transactionPin) {
      if (!pin) {
        return rejectRequest(400, 'Vui lòng cung cấp mã PIN để thực hiện giao dịch.');
      }
      const isPinValid = await bcrypt.compare(String(pin), sender.transactionPin);
      if (!isPinValid) {
        return rejectRequest(400, 'Mã PIN giao dịch không chính xác.');
      }
    }

    if (sender.joyBalance < 20) {
      return rejectRequest(400, 'Số dư của bạn phải có ít nhất 20 JOY mới được phép chuyển.');
    }

    const accountAgeMs = Date.now() - new Date(sender.createdAt).getTime();
    if (accountAgeMs < TRANSFER_MIN_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return rejectRequest(400, `Tài khoản cần đủ ${TRANSFER_MIN_ACCOUNT_AGE_DAYS} ngày tuổi mới được gửi JOY.`);
    }

    let recipient;
    if (toReferralCode) {
      recipient = await Bio.findOne({ referralCode: String(toReferralCode).trim().toUpperCase() });
    } else if (toEmail) {
      recipient = await Bio.findOne({ $or: [{ email: toEmail }, { contactEmail: toEmail }] });
    } else {
      recipient = await Bio.findOne({ phone: String(toPhone).trim() });
    }
    if (!recipient) return rejectRequest(404, 'Không tìm thấy người nhận.');
    if (recipient.email === sender.email) {
      return rejectRequest(400, 'Không thể tự gửi JOY cho chính mình.');
    }

    const today = todayStr();
    const sentTodaySoFar = sender.joySentDate === today ? (sender.joySentToday || 0) : 0;
    if (sentTodaySoFar + numAmount > TRANSFER_DAILY_CAP) {
      return rejectRequest(400, `Vượt giới hạn gửi ${TRANSFER_DAILY_CAP} JOY/ngày. Cậu đã gửi ${sentTodaySoFar} JOY hôm nay.`);
    }

    const feeAmount = Math.floor(numAmount * TRANSFER_FEE_RATE);
    const totalDeducted = numAmount + feeAmount;

    if (sender.joyBalance < totalDeducted) {
      return rejectRequest(400, `Số dư JOY không đủ. Bạn cần ${totalDeducted} JOY (bao gồm ${feeAmount} JOY phí sáng tạo).`);
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
    // Câu mô tả chỉ nói việc gì đã xảy ra. Số tiền, mã GD và số dư nay là field
    // riêng trên notification (amount/refCode/balanceAfter) — đừng nhét lại vào
    // câu, client sẽ hiện hai lần.
    const [senderResult] = await Promise.all([
      awardJoy(
        sender.email, -totalDeducted, 'joy_gift_sent',
        `Gửi ${numAmount} JOY cho ${recipientName}, phí sáng tạo ${feeAmount} JOY.${customMsg}`,
        {
          refId: txCode,
          bioDoc: sender,
          counterparty: recipientName,
          notificationTitle: `Đã gửi JOY cho ${recipientName}`
        }
      ),
      awardJoy(
        recipient.email, numAmount, 'joy_gift_received',
        `${senderName} đã chuyển JOY cho bạn.${customMsg}`,
        {
          refId: txCode,
          bioDoc: recipient,
          counterparty: senderName,
          notificationTitle: `${senderName} đã gửi JOY cho bạn`,
          pushNotify: true,
          pushTitle: 'Bạn vừa nhận được JOY',
          pushBody: `${senderName} đã chuyển ${numAmount} JOY cho bạn.${customMsg}`,
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
    if (req.body && req.body.idempotencyKey) {
      const fromEmail = req.memberEmail;
      const cacheKey = `idempotency:${fromEmail}:${req.body.idempotencyKey}`;
      idempotencyCache.del(cacheKey);
    }
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
