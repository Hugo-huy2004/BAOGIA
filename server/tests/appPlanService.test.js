import { describe, it, expect } from 'vitest';
import {
  APP_PLANS,
  PLAN_APP_IDS,
  OWN_EQUIV_MONTHS,
  planLadder,
  planState,
  ownPriceJoy,
  ownExchangeItems,
  ownExchangeItemKey,
  grantOwnership,
  isOwned,
  hasUsedTrial,
} from '../utils/appPlanService.js';
import {
  FEATURE_PRICES,
  calcExchangeTotal,
  grantFeatureMonths,
} from '../utils/featureSubscriptionService.js';

const DAY = 24 * 60 * 60 * 1000;

/** Hồ sơ giả tối thiểu — đủ dùng cho các hàm thuần, không cần MongoDB. */
const makeBio = (over = {}) => ({
  email: 'a@test.vn',
  joyBalance: 100000,
  featureSubscriptions: {},
  appPlans: {},
  markModified() {},
  ...over,
});

describe('appPlanService — bảng giá thang bậc', () => {
  it('giá thuê lấy thẳng từ FEATURE_PRICES, không có bảng giá thứ hai', () => {
    for (const appId of PLAN_APP_IDS) {
      const ladder = planLadder(appId);
      const monthly = FEATURE_PRICES[APP_PLANS[appId].featureKey];
      expect(ladder.rent.priceJoy).toBe(monthly);
      expect(ladder.rent.total).toBe(calcExchangeTotal(monthly).total);
    }
  });

  it('sở hữu luôn rẻ hơn thuê đủ 12 tháng, và % tiết kiệm là số thật', () => {
    for (const appId of PLAN_APP_IDS) {
      const ladder = planLadder(appId);
      expect(ladder.own.total).toBeLessThan(ladder.own.comparedTo);
      const actual = Math.round((1 - ladder.own.total / ladder.own.comparedTo) * 100);
      expect(ladder.own.savePercent).toBe(actual);
      expect(ladder.own.savePercent).toBeGreaterThan(0);
    }
  });

  it('sở hữu không bao giờ rẻ hơn một tháng thuê', () => {
    for (const appId of PLAN_APP_IDS) {
      expect(ownPriceJoy(appId)).toBeGreaterThanOrEqual(FEATURE_PRICES[APP_PLANS[appId].featureKey]);
    }
  });

  it('dùng thử miễn phí và có số ngày rõ ràng', () => {
    for (const appId of PLAN_APP_IDS) {
      const { trial } = planLadder(appId);
      expect(trial.total).toBe(0);
      expect(trial.days).toBeGreaterThan(0);
    }
  });

  it('mọi ứng dụng đều có item hoá đơn sở hữu để cắm vào /joy/exchange-quote', () => {
    const items = ownExchangeItems();
    for (const appId of PLAN_APP_IDS) {
      const entry = items[ownExchangeItemKey(appId)];
      expect(entry.priceJoy).toBe(ownPriceJoy(appId));
      expect(entry.label).toContain(APP_PLANS[appId].label);
    }
  });

  it('app không thuộc thang bậc thì không có bảng giá', () => {
    expect(planLadder('bio')).toBeNull();
    expect(ownPriceJoy('bio')).toBe(0);
  });
});

describe('appPlanService — bậc đang có', () => {
  it('chưa gì thì khoá', () => {
    expect(planState(makeBio(), 'radio')).toMatchObject({ tier: 'none', unlocked: false });
  });

  it('dùng thử còn hạn thì mở, hết hạn thì khoá lại', () => {
    const live = makeBio({ appPlans: { radio: { trialStartedAt: new Date(), trialEndsAt: new Date(Date.now() + 3 * DAY) } } });
    expect(planState(live, 'radio')).toMatchObject({ tier: 'trial', unlocked: true });

    const dead = makeBio({ appPlans: { radio: { trialStartedAt: new Date(), trialEndsAt: new Date(Date.now() - DAY) } } });
    expect(planState(dead, 'radio')).toMatchObject({ tier: 'none', unlocked: false, trialUsed: true });
  });

  it('sở hữu thắng thuê, thuê thắng dùng thử', () => {
    const renting = makeBio({
      featureSubscriptions: { hugoRadio: { expiresAt: new Date(Date.now() + 10 * DAY) } },
      appPlans: { radio: { trialEndsAt: new Date(Date.now() + 3 * DAY) } },
    });
    expect(planState(renting, 'radio').tier).toBe('rent');

    const owner = makeBio({
      featureSubscriptions: { hugoRadio: { expiresAt: new Date(Date.now() + 10 * DAY) } },
      appPlans: { radio: { owned: true } },
    });
    expect(planState(owner, 'radio').tier).toBe('own');
  });

  it('HugoCoder dùng lại cờ sở hữu cũ, không tạo cờ thứ hai', () => {
    const bio = makeBio({ hugoCoderAll7Lifetime: true });
    expect(isOwned(bio, 'ide')).toBe(true);
    expect(planState(bio, 'ide').tier).toBe('own');
  });

  it('ghi sở hữu bật đúng cờ và nhớ ai tặng', () => {
    const bio = makeBio();
    grantOwnership(bio, 'radio', { giftedBy: 'ban@test.vn' });
    expect(isOwned(bio, 'radio')).toBe(true);
    expect(bio.appPlans.radio.giftedBy).toBe('ban@test.vn');

    const coder = makeBio();
    grantOwnership(coder, 'ide');
    expect(coder.hugoCoderAll7Lifetime).toBe(true);
  });

  it('đã dùng thử thì nhớ mãi, kể cả sau khi hết hạn', () => {
    const bio = makeBio({ appPlans: { radio: { trialStartedAt: new Date(Date.now() - 30 * DAY), trialEndsAt: new Date(Date.now() - 23 * DAY) } } });
    expect(hasUsedTrial(bio, 'radio')).toBe(true);
  });
});

describe('grantFeatureMonths — quy tắc cộng dồn dùng chung', () => {
  it('còn hạn thì nối tiếp, không nuốt mất thời gian còn lại', () => {
    const bio = makeBio({ featureSubscriptions: { hugoRadio: { expiresAt: new Date(Date.now() + 10 * DAY) } } });
    const next = grantFeatureMonths(bio, 'hugoRadio', 1);
    const daysLeft = (next.getTime() - Date.now()) / DAY;
    expect(daysLeft).toBeGreaterThan(39); // 10 ngày cũ + 30 ngày mới
  });

  it('hết hạn thì tính lại từ bây giờ, không cộng lùi về quá khứ', () => {
    const bio = makeBio({ featureSubscriptions: { hugoRadio: { expiresAt: new Date(Date.now() - 100 * DAY) } } });
    const next = grantFeatureMonths(bio, 'hugoRadio', 1);
    const daysLeft = (next.getTime() - Date.now()) / DAY;
    expect(daysLeft).toBeGreaterThan(29);
    expect(daysLeft).toBeLessThan(31);
  });

  it('mua nhiều tháng thì cộng đúng số tháng', () => {
    const bio = makeBio();
    const next = grantFeatureMonths(bio, 'hugoRadio', 3);
    const daysLeft = (next.getTime() - Date.now()) / DAY;
    expect(daysLeft).toBeGreaterThan(89);
  });
});

describe('appPlanService — hằng số marketing phải khớp giá', () => {
  it('sở hữu quy đổi đúng 12 tháng', () => {
    expect(OWN_EQUIV_MONTHS).toBe(12);
    const ladder = planLadder('radio');
    expect(ladder.own.comparedTo).toBe(calcExchangeTotal(FEATURE_PRICES.hugoRadio * 12).total);
  });
});
