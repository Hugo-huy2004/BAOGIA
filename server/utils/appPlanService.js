import Bio from '../models/Bio.js';
import { awardJoy } from './joyService.js';
import {
  FEATURE_PRICES,
  calcExchangeTotal,
  isFeatureActive,
  grantFeatureMonths,
} from './featureSubscriptionService.js';

/**
 * Thang bậc sở hữu ứng dụng: Dùng thử → Thuê → Sở hữu.
 *
 * KHÔNG dựng hệ thống giá song song. Giá thuê lấy thẳng từ `FEATURE_PRICES`,
 * giá sở hữu suy ra từ giá thuê, cổng khoá vẫn là `featureSubscriptions` +
 * `isFeatureActive` mà HugoRadio/Arcade/Aura/Coder đang dùng. Ở đây chỉ thêm
 * hai bậc còn thiếu: dùng thử có hạn và sở hữu vĩnh viễn.
 */

/** Sở hữu = trả trước ngần này tháng thuê... */
export const OWN_EQUIV_MONTHS = 12;
/** ...nhưng được giảm ngần này, nên "tiết kiệm %" trên UI là số thật. */
export const OWN_DISCOUNT = 0.3;

export const APP_PLANS = Object.freeze({
  radio: { appId: 'radio', featureKey: 'hugoRadio', label: 'HugoRadio', trialDays: 7 },
  arcade: { appId: 'arcade', featureKey: 'hugoArcade', label: 'HugoArcade', trialDays: 7 },
  aura: { appId: 'aura', featureKey: 'hugoAura', label: 'HugoAura', trialDays: 7 },
  chess: { appId: 'chess', featureKey: 'hugoChess', label: 'HugoChess', trialDays: 7 },
  // HugoCoder đã có cờ sở hữu riêng từ trước — dùng lại chứ không tạo cờ thứ hai.
  ide: { appId: 'ide', featureKey: 'hugoCoder', label: 'Study · Phát triển Web', trialDays: 14, ownFlag: 'hugoCoderAll7Lifetime' },
});

export const PLAN_APP_IDS = Object.freeze(Object.keys(APP_PLANS));

export function isPlanApp(appId) {
  return Object.prototype.hasOwnProperty.call(APP_PLANS, appId);
}

/** Giá sở hữu, làm tròn tới trăm cho dễ đọc trên bảng giá. */
export function ownPriceJoy(appId) {
  const plan = APP_PLANS[appId];
  if (!plan) return 0;
  const monthly = FEATURE_PRICES[plan.featureKey] || 0;
  const full = monthly * OWN_EQUIV_MONTHS;
  return Math.max(monthly, Math.round((full * (1 - OWN_DISCOUNT)) / 100) * 100);
}

/**
 * Ba bậc của một ứng dụng, kèm số tiền tiết kiệm THẬT khi so sở hữu với thuê
 * — không có con số marketing bịa ra.
 */
export function planLadder(appId) {
  const plan = APP_PLANS[appId];
  if (!plan) return null;

  const monthly = FEATURE_PRICES[plan.featureKey] || 0;
  const rent = calcExchangeTotal(monthly);
  const ownBase = ownPriceJoy(appId);
  const own = calcExchangeTotal(ownBase);
  const rentFull = calcExchangeTotal(monthly * OWN_EQUIV_MONTHS).total;

  return {
    appId,
    label: plan.label,
    featureKey: plan.featureKey,
    trial: { tier: 'trial', days: plan.trialDays, priceJoy: 0, tax: 0, total: 0 },
    rent: { tier: 'rent', days: 30, ...rent },
    own: {
      tier: 'own',
      ...own,
      equivMonths: OWN_EQUIV_MONTHS,
      comparedTo: rentFull,
      savePercent: rentFull > 0 ? Math.round((1 - own.total / rentFull) * 100) : 0,
    },
  };
}

/** Khoá `item` để dùng lại đúng hoá đơn /joy/exchange-quote có sẵn. */
export const ownExchangeItemKey = (appId) => `own_${appId}`;

/** Bảng item sở hữu, sinh từ APP_PLANS để khỏi gõ tay 5 dòng trùng nhau. */
export function ownExchangeItems() {
  return Object.fromEntries(
    PLAN_APP_IDS.map(appId => [
      ownExchangeItemKey(appId),
      { label: `${APP_PLANS[appId].label} — sở hữu vĩnh viễn`, priceJoy: ownPriceJoy(appId) },
    ])
  );
}

function trialRecord(bio, appId) {
  const plans = bio?.appPlans;
  if (!plans) return null;
  return typeof plans.get === 'function' ? plans.get(appId) : plans[appId];
}

export function isOwned(bio, appId) {
  const plan = APP_PLANS[appId];
  if (!plan) return false;
  if (plan.ownFlag && bio?.[plan.ownFlag]) return true;
  return Boolean(trialRecord(bio, appId)?.owned);
}

export function isTrialActive(bio, appId) {
  const endsAt = trialRecord(bio, appId)?.trialEndsAt;
  return Boolean(endsAt) && new Date(endsAt).getTime() > Date.now();
}

export function hasUsedTrial(bio, appId) {
  return Boolean(trialRecord(bio, appId)?.trialStartedAt);
}

/**
 * Bậc CAO NHẤT mà người dùng đang có. Sở hữu > thuê > dùng thử > chưa có.
 * Đây là nguồn sự thật duy nhất cho cả UI lẫn cổng khoá.
 */
export function planState(bio, appId) {
  const plan = APP_PLANS[appId];
  if (!plan) return { tier: 'none', unlocked: false };

  if (isOwned(bio, appId)) {
    return { tier: 'own', unlocked: true, expiresAt: null, trialUsed: hasUsedTrial(bio, appId) };
  }
  if (isFeatureActive(bio, plan.featureKey)) {
    return {
      tier: 'rent',
      unlocked: true,
      expiresAt: bio?.featureSubscriptions?.[plan.featureKey]?.expiresAt || null,
      trialUsed: hasUsedTrial(bio, appId),
    };
  }
  if (isTrialActive(bio, appId)) {
    return {
      tier: 'trial',
      unlocked: true,
      expiresAt: trialRecord(bio, appId).trialEndsAt,
      trialUsed: true,
    };
  }
  return { tier: 'none', unlocked: false, expiresAt: null, trialUsed: hasUsedTrial(bio, appId) };
}

function writePlanRecord(bioDoc, appId, patch) {
  const current = trialRecord(bioDoc, appId) || {};
  const next = { ...current, ...patch };
  if (typeof bioDoc.appPlans?.set === 'function') {
    bioDoc.appPlans.set(appId, next);
  } else {
    bioDoc.appPlans = { ...(bioDoc.appPlans || {}), [appId]: next };
  }
  bioDoc.markModified('appPlans');
  return next;
}

/** Ghi quyền sở hữu lên hồ sơ (chỉ mutate, không lưu, không trừ tiền). */
export function grantOwnership(bioDoc, appId, { giftedBy = null } = {}) {
  const plan = APP_PLANS[appId];
  if (!plan) throw new Error('Ứng dụng không hợp lệ.');
  if (plan.ownFlag) bioDoc[plan.ownFlag] = true;
  writePlanRecord(bioDoc, appId, { owned: true, ownedAt: new Date(), giftedBy });
}

/**
 * Mở dùng thử. Miễn phí nên không đi qua hoá đơn — nhưng CHỈ MỘT LẦN mỗi
 * ứng dụng, và không cho dùng thử thứ mình đã có.
 */
export async function startTrial(email, appId) {
  const plan = APP_PLANS[appId];
  if (!plan) throw new Error('Ứng dụng không hợp lệ.');

  let bio = await Bio.findOne({ email });
  if (!bio) bio = await Bio.findOne({ contactEmail: email });
  if (!bio) throw new Error('Không tìm thấy hồ sơ người dùng.');

  if (planState(bio, appId).unlocked) throw new Error('Bạn đang dùng được ứng dụng này rồi.');
  if (hasUsedTrial(bio, appId)) throw new Error('Bạn đã dùng thử ứng dụng này trước đó.');

  const now = new Date();
  const endsAt = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
  writePlanRecord(bio, appId, { trialStartedAt: now, trialEndsAt: endsAt });
  await bio.save();

  return { appId, tier: 'trial', expiresAt: endsAt, days: plan.trialDays };
}

/**
 * Mua một bậc có tính phí.
 *
 * Người trả tiền và người nhận tách rời để dùng chung cho cả mua cho mình lẫn
 * tặng bạn bè. Giá LUÔN tính lại ở server từ `planLadder` — client gửi lên
 * giá gì cũng không được đọc tới.
 */
export async function purchasePlan({ payerEmail, appId, tier, recipientEmail = null, months = 1 }) {
  const plan = APP_PLANS[appId];
  if (!plan) throw new Error('Ứng dụng không hợp lệ.');
  if (tier !== 'rent' && tier !== 'own') throw new Error('Bậc mua không hợp lệ.');

  let payer = await Bio.findOne({ email: payerEmail });
  if (!payer) payer = await Bio.findOne({ contactEmail: payerEmail });
  if (!payer) throw new Error('Không tìm thấy hồ sơ người mua.');

  const isGift = Boolean(recipientEmail) && recipientEmail !== payer.email;
  let recipient = payer;
  if (isGift) {
    recipient = await Bio.findOne({ email: recipientEmail });
    if (!recipient) recipient = await Bio.findOne({ contactEmail: recipientEmail });
    if (!recipient) throw new Error('Không tìm thấy người nhận.');
  }

  if (tier === 'own' && isOwned(recipient, appId)) {
    throw new Error(isGift ? 'Người nhận đã sở hữu ứng dụng này.' : 'Bạn đã sở hữu ứng dụng này.');
  }

  const ladder = planLadder(appId);
  const monthCount = tier === 'rent' ? Math.max(1, Math.min(12, Math.floor(Number(months) || 1))) : 1;
  const baseJoy = tier === 'own' ? ownPriceJoy(appId) : (FEATURE_PRICES[plan.featureKey] || 0) * monthCount;
  const { tax, total } = calcExchangeTotal(baseJoy);

  if (payer.joyBalance < total) throw new Error('Số dư JOY không đủ để trao đổi.');

  const what = tier === 'own'
    ? `${plan.label} — sở hữu vĩnh viễn`
    : `${plan.label} (${monthCount} tháng)`;

  const { balance } = await awardJoy(
    payer.email,
    -total,
    isGift ? 'app_plan_gift' : 'app_plan',
    `Trao đổi JOY ${isGift ? 'tặng' : 'mở'} ${what} (gồm ${tax} JOY phí sáng tạo)`,
    { bioDoc: payer, skipSave: true, refId: `${appId}:${tier}` }
  );

  if (tier === 'own') {
    grantOwnership(recipient, appId, { giftedBy: isGift ? payer.email : null });
  } else {
    grantFeatureMonths(recipient, plan.featureKey, monthCount);
  }

  // Người mua cho chính mình thì payer và recipient là CÙNG một document —
  // lưu hai lần sẽ ghi đè lẫn nhau và nuốt mất một trong hai thay đổi.
  await recipient.save();
  if (isGift) await payer.save();

  return {
    appId,
    tier,
    label: plan.label,
    months: monthCount,
    priceJoy: baseJoy,
    tax,
    total,
    balance,
    isGift,
    recipientEmail: recipient.email,
    expiresAt: tier === 'rent' ? recipient.featureSubscriptions?.[plan.featureKey]?.expiresAt : null,
    savePercent: tier === 'own' ? ladder.own.savePercent : 0,
  };
}
