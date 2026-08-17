import { describe, expect, it } from "vitest";
import {
  DAILY_CASUAL_JOY, FEATURE_PRICES, STUDY_STAGES, STUDY_LIFETIME,
  STUDY_ALL_STAGES_PRICE, HUGOSO_PRICES, HUGOSO_BUNDLE_PRICE,
  BIO_THEME_RENTAL_PRICE, OWN_DISCOUNT, ownFromMonthly, bundleFromParts, daysToAfford,
} from "./joyPrices.js";

describe("neo giá theo thu nhập một ngày", () => {
  it("thuê một tháng không bao giờ quá 2 ngày chơi thường", () => {
    const tooDear = Object.entries(FEATURE_PRICES)
      .filter(([, joy]) => daysToAfford(joy) > 2)
      .map(([key, joy]) => `${key}=${joy} (${daysToAfford(joy).toFixed(1)} ngày)`);
    expect(tooDear).toEqual([]);
  });

  it("mua vĩnh viễn không quá 12 ngày chơi thường", () => {
    const all = [
      ...Object.values(STUDY_LIFETIME),
      ...Object.keys(FEATURE_PRICES).map((k) => ownFromMonthly(FEATURE_PRICES[k])),
    ];
    expect(Math.max(...all.map(daysToAfford))).toBeLessThanOrEqual(12);
  });

  it("món trang trí rẻ hơn một ngày chơi", () => {
    expect(daysToAfford(BIO_THEME_RENTAL_PRICE)).toBeLessThan(1);
  });
});

describe("thang chặng học", () => {
  it("giá mua vĩnh viễn TĂNG DẦN theo chặng", () => {
    const prices = STUDY_STAGES.map((s) => s.lifetime);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
    expect(new Set(prices).size).toBe(prices.length);   // không hai chặng cùng giá
  });

  it("THUÊ một tháng luôn rẻ hơn nhiều so với MUA vĩnh viễn", () => {
    // Lỗi cũ: thuê tháng chặng 2/3 đúng bằng giá mua, chặng 5/6 thuê còn đắt hơn
    // mua — thuê trở thành lựa chọn không bao giờ hợp lý.
    for (const { tier, monthlyKey, lifetime } of STUDY_STAGES) {
      const monthly = FEATURE_PRICES[monthlyKey];
      expect(monthly, `${tier} thiếu giá thuê`).toBeGreaterThan(0);
      expect(lifetime / monthly, `${tier}: mua/thuê`).toBeGreaterThanOrEqual(5);
    }
  });

  it("mọi khoá tính năng mà chặng học trỏ tới đều tồn tại", () => {
    // `hugoCoderBasic` từng bị thiếu ở server nên chặng 1 không mua được.
    for (const { monthlyKey } of STUDY_STAGES) {
      expect(FEATURE_PRICES, monthlyKey).toHaveProperty(monthlyKey);
    }
  });
});

describe("gói trọn bộ (combo)", () => {
  it("trọn khoá rẻ hơn mua lẻ đúng bằng mức giảm chung", () => {
    const parts = STUDY_STAGES.reduce((sum, s) => sum + s.lifetime, 0);
    expect(STUDY_ALL_STAGES_PRICE).toBeLessThan(parts);
    expect(STUDY_ALL_STAGES_PRICE / parts).toBeCloseTo(1 - OWN_DISCOUNT, 1);
  });

  it("trọn bộ HugoSO rẻ hơn mua lẻ 4 công cụ", () => {
    const parts = Object.values(HUGOSO_PRICES);
    expect(HUGOSO_BUNDLE_PRICE).toBeLessThan(parts.reduce((a, b) => a + b, 0));
    expect(HUGOSO_BUNDLE_PRICE).toBe(bundleFromParts(parts));
  });

  it("combo và mua-vĩnh-viễn dùng CÙNG mức giảm, không phải hai ưu đãi khác nhau", () => {
    expect(bundleFromParts([1000, 1000]) / 2000).toBeCloseTo(1 - OWN_DISCOUNT, 2);
    expect(ownFromMonthly(100)).toBe(Math.round(100 * 12 * (1 - OWN_DISCOUNT) / 100) * 100);
  });
});

describe("neo thu nhập", () => {
  it("thu nhập ngày khớp trần thật trong code", () => {
    // 240 (điểm danh ngày thường) + 60 arcade + 45 focus 1 giờ + 70 hai thử thách
    expect(DAILY_CASUAL_JOY).toBeGreaterThan(300);
    expect(DAILY_CASUAL_JOY).toBeLessThan(600);
  });
});
