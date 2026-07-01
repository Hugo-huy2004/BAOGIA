import express from 'express';
import Bio from '../models/Bio.js';
import { awardJoy, getJoyHistory } from '../utils/joyService.js';
import { ensureReferralCode } from '../utils/referralService.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { FEATURE_PRICES, chargeFeatureSubscription, calcExchangeTotal } from '../utils/featureSubscriptionService.js';

const BIO_THEME_RENTAL_PRICE = 150;
const COMPRESS_CHARGE = 50;

// Item labels shown on the invoice modal, keyed the same way the frontend
// calls /exchange-quote — kept here (not duplicated client-side) so price
// changes only ever need updating in one place.
const EXCHANGE_ITEMS = {
  hugoCoder: { label: 'HugoCoder (1 tháng)', priceJoy: FEATURE_PRICES.hugoCoder },
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
router.get('/exchange-quote', async (req, res) => {
  try {
    const { email, item } = req.query;
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
router.get('/balance', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const referralCode = await ensureReferralCode(bio);
    res.json({ balance: bio.joyBalance, referralCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/history?email=&limit=20
router.get('/history', async (req, res) => {
  try {
    const { email, limit } = req.query;
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
router.post('/award-learning', async (req, res) => {
  try {
    const { email, lessonId } = req.body;
    if (!email || !lessonId) return res.status(400).json({ error: 'Email and lessonId are required' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (!bio.completedLessons) {
      bio.completedLessons = [];
    }

    if (bio.completedLessons.includes(lessonId)) {
      return res.json({ success: true, alreadyCompleted: true, balance: bio.joyBalance });
    }

    const result = await awardJoy(email, 30, 'ide_learning', `Hoàn thành bài học IDE: ${lessonId}`); // base x3
    bio.completedLessons.push(lessonId);
    bio.markModified('completedLessons');
    await bio.save();

    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/claim-info-bonus — one-time bonus for opening Info & Version
router.post('/claim-info-bonus', async (req, res) => {
  try {
    const { email } = req.body;
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
router.post('/award-focus', async (req, res) => {
  try {
    const { email, minutes } = req.body;
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
router.post('/rent-theme', async (req, res) => {
  try {
    const { email, themeId } = req.body;
    if (!email || !themeId) {
      return res.status(400).json({ error: 'Email and themeId are required' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const price = 50;
    if (bio.joyBalance < price) {
      return res.status(400).json({ error: `Bạn cần ít nhất ${price} JOY để thuê giao diện này.` });
    }

    // Deduct 50 JOY and create ledger record
    const result = await awardJoy(bio.email, -price, 'aura_theme_rent', `Thuê giao diện Aura: ${themeId} (1 ngày)`);
    
    // Extends or creates theme expiration in rentedThemes
    const extensionMs = 24 * 60 * 60 * 1000; // 1 day
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
router.post('/set-theme', async (req, res) => {
  try {
    const { email, themeId } = req.body;
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
router.post('/subscribe-feature', async (req, res) => {
  try {
    const { email, featureKey, months } = req.body;
    if (!email || !featureKey) return res.status(400).json({ error: 'email and featureKey are required' });
    if (!FEATURE_PRICES[featureKey]) return res.status(400).json({ error: 'Tính năng không hợp lệ.' });

    const { balance, expiresAt } = await chargeFeatureSubscription(email, featureKey, Number(months) || 1);
    res.json({ success: true, balance, expiresAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/subscribe-bio-theme  { email, template: 'brutalism'|'flat' }
// 'default' is always free and goes through the normal bio PUT — not this route.
router.post('/subscribe-bio-theme', async (req, res) => {
  try {
    const { email, template } = req.body;
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
        return res.status(400).json({ error: `Số dư JOY không đủ. Cần ${total} JOY (gồm ${tax} JOY thuế) để đổi giao diện này.` });
      }

      const { balance } = await awardJoy(
        bio.email,
        -total,
        'bio_theme_rental',
        `Trao đổi JOY diện giao diện Bio: ${template} (1 tháng, gồm ${tax} JOY thuế giao dịch)`,
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

    res.json({ displayName: bio.displayName || 'Người dùng Hugo Studio', avatar: bio.avatarUrl || '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/transfer  { fromEmail, toPhone, amount, message }
router.post('/transfer', async (req, res) => {
  try {
    const { fromEmail, toPhone, amount, message } = req.body;
    if (!fromEmail || !toPhone) {
      return res.status(400).json({ error: 'Thiếu thông tin người gửi hoặc số điện thoại người nhận.' });
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

    const recipient = await Bio.findOne({ phone: String(toPhone).trim() });
    if (!recipient) return res.status(404).json({ error: 'Không tìm thấy người nhận với số điện thoại này.' });
    if (recipient.email === sender.email) {
      return res.status(400).json({ error: 'Không thể tự gửi JOY cho chính mình.' });
    }

    const today = todayStr();
    const sentTodaySoFar = sender.joySentDate === today ? sender.joySentToday : 0;
    if (sentTodaySoFar + numAmount > TRANSFER_DAILY_CAP) {
      return res.status(400).json({ error: `Vượt giới hạn gửi ${TRANSFER_DAILY_CAP} JOY/ngày. Cậu đã gửi ${sentTodaySoFar} JOY hôm nay.` });
    }

    const feeAmount = Math.floor(numAmount * TRANSFER_FEE_RATE);
    const totalDeducted = numAmount + feeAmount;

    if (sender.joyBalance < totalDeducted) {
      return res.status(400).json({ error: `Số dư JOY không đủ. Bạn cần ${totalDeducted} JOY (bao gồm ${feeAmount} JOY phí giao dịch).` });
    }

    const customMsg = message ? ` Lời nhắn: "${message}"` : '';
    const recipientName = recipient.displayName || 'bạn bè';
    const senderName = sender.displayName || 'Một người bạn';

    // Short, human-readable transaction code shared by both ledger rows —
    // lets the receipt/notification on either side reference the same transfer.
    const txCode = `JOY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const senderResult = await awardJoy(
      sender.email, -totalDeducted, 'joy_gift_sent',
      `Gửi JOY cho ${recipientName} (-${numAmount} JOY, phí -${feeAmount} JOY). Mã GD: ${txCode}.${customMsg}`,
      { refId: txCode }
    );
    await awardJoy(
      recipient.email, numAmount, 'joy_gift_received',
      `${senderName} đã chuyển ${numAmount} JOY đến bạn. Mã GD: ${txCode}.${customMsg}`,
      {
        refId: txCode,
        notificationTitle: 'Bạn vừa nhận được JOY',
        notificationMessage: `${senderName} đã chuyển ${numAmount} JOY đến bạn. Mã GD: ${txCode}.${customMsg} Số dư: ${Math.max(0, recipient.joyBalance + numAmount)} JOY.`,
        pushNotify: true,
        pushTitle: 'Bạn vừa nhận được JOY',
        pushBody: `${senderName} đã chuyển ${numAmount} JOY đến bạn.${customMsg}`,
        actionUrl: '/member/joy'
      }
    );

    // Atomic increment — avoids overwriting the balance awardJoy() just wrote
    // by saving a stale in-memory `sender` document.
    await Bio.updateOne(
      { email: sender.email },
      sender.joySentDate !== today
        ? { $set: { joySentDate: today, joySentToday: numAmount } }
        : { $set: { joySentDate: today }, $inc: { joySentToday: numAmount } }
    );

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
router.post('/exchange-chat-tokens', async (req, res) => {
  try {
    const { email, tokenAmount } = req.body;
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
