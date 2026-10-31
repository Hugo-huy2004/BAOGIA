// Mua và đổi bằng JOY: tính năng, theme, gói học — router con của /api/joy (mount trong routes/joyRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { awardJoy } from '../../utils/joyService.js';
import rateLimit from 'express-rate-limit';
import { accountOrIpKey } from '../../config/limiter.js';
import { invalidateMemberGate, requireMember, requireMemberSession } from '../../middleware/authMiddleware.js';
import { eduSnapshot, saveEduPrefs } from '../../services/eduLearner.js';
import { accessDeadline, extendAccess } from '../../utils/accountAccess.js';
import { ACCOUNT_EXTENSION } from '../../../../packages/shared/joyPrices.js';
import { FEATURE_PRICES, chargeFeatureSubscription, calcExchangeTotal } from '../../utils/featureSubscriptionService.js';
import UtilityProduct from '../../models/UtilityProduct.js';
import { isAuraThemeFree, isAuraThemeId } from '../../../../packages/shared/auraThemes.js';
import { BIO_THEME_RENTAL_PRICE, EXCHANGE_ITEMS } from './joyShared.js';

const router = express.Router();

// Bấm đúp nút gia hạn không được trừ JOY hai lần ngoài ý muốn.
const extendLimiter = rateLimit({ keyGenerator: accountOrIpKey, windowMs: 10_000, max: 2, standardHeaders: true, legacyHeaders: false });

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

// POST /api/joy/rent-theme
router.post('/rent-theme', requireMember, async (req, res) => {
  try {
    const { themeId, duration = 'day' } = req.body;
    const email = req.memberEmail;
    if (!email || !themeId) {
      return res.status(400).json({ error: 'Email and themeId are required' });
    }
    if (!isAuraThemeId(themeId)) {
      return res.status(400).json({ code: 'INVALID_PORTAL_THEME', error: 'Giao diện không hợp lệ.' });
    }
    if (isAuraThemeFree(themeId)) {
      return res.status(400).json({ code: 'PORTAL_THEME_IS_FREE', error: 'Giao diện này miễn phí và không cần thuê.' });
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
    const result = await awardJoy(bio.email, -price, 'portal_theme_rent', `Thuê giao diện cá nhân: ${themeId} + 9% Phí sáng tạo (${durationLabel})`);
    
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
    result.bio.activePortalTheme = themeId;
    // Mirror the legacy field during the transition so older app builds and
    // newly deployed builds display the same choice.
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
    if (!isAuraThemeId(themeId)) {
      return res.status(400).json({ code: 'INVALID_PORTAL_THEME', error: 'Giao diện không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (!isAuraThemeFree(themeId)) {
      const existingTheme = (bio.rentedThemes || []).find(t => t.themeId === themeId);
      if (!existingTheme || new Date(existingTheme.expiresAt).getTime() <= Date.now()) {
        return res.status(400).json({ code: 'PORTAL_THEME_NOT_OWNED', error: 'Giao diện chưa được thuê hoặc đã hết hạn sử dụng.' });
      }
    }

    bio.activePortalTheme = themeId;
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

    // Khoá Coding miễn phí từ 31/10/2026 (Education Hugo): không còn gì để thu.
    if (featureKey.startsWith('hugoCoder')) {
      return res.status(400).json({ error: 'Khoá Coding đã miễn phí, không cần mở khoá.' });
    }

    const { balance, expiresAt } = await chargeFeatureSubscription(email, featureKey, Number(months) || 1);
    res.json({ success: true, balance, expiresAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/joy/coder-access — tiến độ khoá Coding + trạng thái tài khoản của
// người đang đăng nhập, cho Education Hugo và Hugo Team. Chỉ cần phiên (không
// đòi hồ sơ đầy đủ): người chỉ đến để học vẫn đọc được tiến độ, số JOY và hạn
// duy trì tài khoản của mình.
router.get('/coder-access', requireMemberSession, async (req, res) => {
  try {
    const email = req.memberEmail;
    const fields = 'email displayName avatarUrl completedLessons hugoCoderExamScores hugoCoderProjectStatus joyBalance isEduVerified trialExpiresAt expiresAt';
    let bio = await Bio.findOne({ email }).select(fields).lean();
    if (!bio) bio = await Bio.findOne({ contactEmail: email }).select(fields).lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Cài đặt Edu + mục tiêu hôm nay đi cùng một lượt gọi (ít request cho Render free).
    const edu = await eduSnapshot(email).catch(() => null);
    return res.json({
      edu,
      bio: {
        email: bio.email,
        displayName: bio.displayName || '',
        avatarUrl: bio.avatarUrl || '',
        completedLessons: bio.completedLessons || [],
        hugoCoderExamScores: bio.hugoCoderExamScores || {},
        hugoCoderProjectStatus: bio.hugoCoderProjectStatus || null,
        joyBalance: Number(bio.joyBalance) || 0,
        isEduVerified: Boolean(bio.isEduVerified),
        accessExpiresAt: accessDeadline(bio) || null,
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/joy/edu-settings — cài đặt cá nhân Education Hugo (đồng bộ mọi máy).
// cleanEduPrefs bỏ mọi khoá lạ/giá trị ngoài danh sách.
router.put('/edu-settings', requireMemberSession, async (req, res) => {
  try {
    const prefs = await saveEduPrefs(req.memberEmail, req.body?.prefs);
    return res.json({ success: true, prefs });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/extend-account — "Duy trì tài khoản" trong store của Education
// Hugo: ACCOUNT_EXTENSION.priceJoy (+ phí sáng tạo chung) đổi lấy
// ACCOUNT_EXTENSION.days ngày. Cùng mốc với sản phẩm system_validity của Store
// Hugo Studio. requireMemberSession: người học chưa điền đủ hồ sơ vẫn tự gia hạn
// được — chặn họ ở đây là để tài khoản bị xoá chỉ vì thiếu số điện thoại.
router.post('/extend-account', requireMemberSession, extendLimiter, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    if (bio.isEduVerified) {
      return res.status(400).json({ code: 'EDU_VERIFIED', error: 'Tài khoản đã xác minh giáo dục, đang được duy trì miễn phí.' });
    }

    const { days, priceJoy } = ACCOUNT_EXTENSION;
    const { tax, total } = calcExchangeTotal(priceJoy);
    // Trừ JOY nguyên tử TRƯỚC (awardJoy chặn số dư âm), rồi mới dời hạn: hết
    // tiền thì không có gì thay đổi; dời hạn hỏng sau khi trừ thì hoàn lại.
    const { balance } = await awardJoy(email, -total, 'store_purchase',
      `Duy trì tài khoản +${days} ngày (giá ${priceJoy} JOY + ${tax} JOY phí sáng tạo)`,
      { notify: false, bioDoc: bio, skipSave: true });
    try {
      extendAccess(bio, days);
      await bio.save();
    } catch (error) {
      await awardJoy(email, total, 'admin_adjustment', `Hoàn JOY: chưa gia hạn được tài khoản (${error.message})`, { rawAmount: true, notify: false });
      throw error;
    }
    invalidateMemberGate(bio.email);
    return res.json({ success: true, balance, days, total, accessExpiresAt: accessDeadline(bio) });
  } catch (error) {
    if (String(error.message).startsWith('INSUFFICIENT_JOY')) {
      return res.status(400).json({ code: 'INSUFFICIENT_JOY', error: 'Số dư JOY chưa đủ để gia hạn.' });
    }
    return res.status(400).json({ error: error.message });
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
