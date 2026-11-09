// Mua và đổi bằng JOY: tính năng, theme, gói học — router con của /api/joy (mount trong routes/joyRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { awardJoy } from '../../utils/joyService.js';
import { requireMember } from '../../middleware/authMiddleware.js';
import { FEATURE_PRICES, chargeFeatureSubscription, calcExchangeTotal } from '../../utils/featureSubscriptionService.js';
import UtilityProduct from '../../models/UtilityProduct.js';
import { isAuraThemeFree, isAuraThemeId } from '../../../../packages/shared/auraThemes.js';
import { EXCHANGE_ITEMS } from './joyShared.js';

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


    const { balance, expiresAt } = await chargeFeatureSubscription(email, featureKey, Number(months) || 1);
    res.json({ success: true, balance, expiresAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
