// Mua và đổi bằng JOY: tính năng, theme, gói học — router con của /api/joy (mount trong routes/joyRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { awardJoy } from '../../utils/joyService.js';
import { requireMember } from '../../middleware/authMiddleware.js';
import { FEATURE_PRICES, chargeFeatureSubscription, calcExchangeTotal } from '../../utils/featureSubscriptionService.js';
import UtilityProduct from '../../models/UtilityProduct.js';
import { isAuraThemeFree, isAuraThemeId } from '../../../../packages/shared/auraThemes.js';
import { BIO_THEME_RENTAL_PRICE, CODER_STAGE_DEFINITIONS, getCoderStageQuote, EXCHANGE_ITEMS } from './joyShared.js';

const router = express.Router();

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
      `Trao đổi JOY mở khóa vĩnh viễn Study with Hugo · ${quote.label} (gồm ${quote.tax} JOY phí sáng tạo)`,
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
      `Trao đổi JOY trọn bộ vĩnh viễn 6 phần Phát triển Web (miễn phí bảo trì trọn đời, gồm ${tax} JOY phí sáng tạo)`,
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
