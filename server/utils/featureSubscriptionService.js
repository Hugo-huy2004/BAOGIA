import Bio from '../models/Bio.js';
import { awardJoy } from './joyService.js';

// Canonical feature keys + monthly JOY price — single source of truth so
// routes never hardcode 150/199 independently.
export const FEATURE_PRICES = {
  hugoCoder: 150,
  hugoAura: 150,
  hugoRadio: 150,
  hugoArcade: 199
};

const FEATURE_LABELS = {
  hugoCoder: 'HugoCoder',
  hugoAura: 'HugoAura (Lofi & Cửa hàng giao diện)',
  hugoRadio: 'HugoRadio',
  hugoArcade: 'HugoArcade (Bứt phá & Huyền thoại)'
};

// Same 9% transaction-fee rate already used by the utility store (store_purchase)
// — applied consistently across every new "trao đổi JOY" charge introduced here
// (feature subscriptions, bio theme rental, file compression) so every invoice
// in the app breaks down the same way: lệ phí + thuế giao dịch = tổng cộng.
export const EXCHANGE_TAX_RATE = 0.09;

export function calcExchangeTotal(priceJoy) {
  const tax = Math.floor(priceJoy * EXCHANGE_TAX_RATE);
  return { priceJoy, tax, total: priceJoy + tax };
}

// Always re-derives from expiresAt — never trusts the cosmetic `active` flag
// (see Bio.js featureSubscriptions comment for why). Safe on a lean() object.
export function isFeatureActive(bio, featureKey) {
  const sub = bio?.featureSubscriptions?.[featureKey];
  if (!sub?.expiresAt) return false;
  return new Date(sub.expiresAt).getTime() > Date.now();
}

// Charges JOY and extends/starts a monthly subscription. Mirrors the
// charge-then-mutate-then-single-save shape of companionRoutes.js's
// unlock-feature and joyRoutes.js's rent-theme (stacks remaining time on
// renewal instead of wasting it).
export async function chargeFeatureSubscription(email, featureKey, months = 1) {
  if (!FEATURE_PRICES[featureKey]) throw new Error('Tính năng không hợp lệ.');

  let bio = await Bio.findOne({ email });
  if (!bio) bio = await Bio.findOne({ contactEmail: email });
  if (!bio) throw new Error('Không tìm thấy hồ sơ người dùng.');

  const baseJoy = FEATURE_PRICES[featureKey] * months;
  const { tax, total } = calcExchangeTotal(baseJoy);
  if (bio.joyBalance < total) throw new Error('Số dư JOY không đủ để trao đổi.');

  const { balance } = await awardJoy(
    bio.email,
    -total,
    'feature_subscription',
    `Trao đổi JOY mở khóa ${FEATURE_LABELS[featureKey]} (${months} tháng, gồm ${tax} JOY thuế giao dịch)`,
    { bioDoc: bio, skipSave: true, refId: featureKey }
  );

  const existing = bio.featureSubscriptions?.[featureKey];
  const currentExpiry = existing?.expiresAt ? new Date(existing.expiresAt).getTime() : 0;
  const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
  const monthMs = months * 30 * 24 * 60 * 60 * 1000;

  bio.featureSubscriptions = bio.featureSubscriptions || {};
  bio.featureSubscriptions[featureKey] = {
    expiresAt: new Date(baseTime + monthMs),
    active: true
  };
  bio.markModified('featureSubscriptions');
  await bio.save();

  return { balance, expiresAt: bio.featureSubscriptions[featureKey].expiresAt, priceJoy: baseJoy, tax, total };
}
