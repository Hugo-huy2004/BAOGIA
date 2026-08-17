import { describe, expect, it } from "vitest";
import {
  JOY_DENOMS, CROSS_DENOM_FEE, DEFAULT_DENOM, denomKey, denomOf,
  toDenom, fromDenom, formatDenom, transferBreakdown, isCrossDenom,
} from "./joyCurrency.js";
import { FEATURE_PRICES } from "./joyPrices.js";
import { SUPPORTED_LANGUAGES } from "../src/i18n/languages.js";

describe("đơn vị theo quốc gia", () => {
  // Ràng buộc thật: thêm ngôn ngữ giao diện mà quên đơn vị JOY thì test này đỏ,
  // và `server/utils/profileRequirements.js` lấy danh sách ngôn ngữ từ JOY_DENOMS
  // nên ngôn ngữ mới cũng không chọn được lúc onboarding.
  it("mọi ngôn ngữ giao diện đều có đơn vị riêng", () => {
    expect(Object.keys(JOY_DENOMS).sort()).toEqual(SUPPORTED_LANGUAGES.map((l) => l.code).sort());
    for (const { code: lang } of SUPPORTED_LANGUAGES) {
      expect(JOY_DENOMS, lang).toHaveProperty(lang);
      expect(JOY_DENOMS[lang].code, lang).toMatch(/^JOY/);
      expect(JOY_DENOMS[lang].factor, lang).toBeGreaterThan(0);
    }
  });

  it("không đơn vị nào mượn ký hiệu hay tên của tiền thật", () => {
    // JOY không phải tiền và không quy đổi ra tiền — mượn ký hiệu $ / € / ¥ hay
    // tên "Đô la Mỹ" vừa sai bản chất vừa mượn nhận diện của nước người ta.
    const banned = /[$€¥₩฿₫]|usd|eur|jpy|krw|cny|thb|vnd|idr|dollar|euro|yen|won|yuan|baht|dong|rupiah/i;
    for (const [key, denom] of Object.entries(JOY_DENOMS)) {
      expect(denom.code, key).not.toMatch(banned);
      expect(denom.name, key).not.toMatch(banned);
    }
  });

  it("mã ngôn ngữ có vùng (vi-VN, en_US) vẫn ra đúng đơn vị", () => {
    expect(denomKey("vi-VN")).toBe("vi");
    expect(denomKey("en_US")).toBe("en");
    expect(denomKey("zh-Hans-CN")).toBe("zh");
  });

  it("ngôn ngữ lạ về đơn vị mặc định chứ không vỡ", () => {
    expect(denomKey("xx")).toBe(DEFAULT_DENOM);
    expect(denomKey(undefined)).toBe(DEFAULT_DENOM);
    expect(denomOf(null).factor).toBeGreaterThan(0);
  });

  it("số hiển thị bằng đúng hệ số của đơn vị đó", () => {
    // Không chốt cứng con số: hệ số là quyết định về sản phẩm và có thể chỉnh.
    // Ràng buộc là phép nhân phải đúng với hệ số đang khai.
    for (const [lang, denom] of Object.entries(JOY_DENOMS)) {
      expect(toDenom(1000, lang).amount, lang).toBe(1000 * denom.factor);
    }
  });

  it("hệ số là số nguyên ≥ 1 nên 1 JOY không bao giờ hiện thành 0", () => {
    // Hệ số nhỏ hơn 1 (kiểu 1 JOY = 0,001) làm mọi số nhỏ thành "0" — người chọn
    // đơn vị đó không đọc được giá nào trong app.
    for (const [lang, denom] of Object.entries(JOY_DENOMS)) {
      expect(Number.isInteger(denom.factor), lang).toBe(true);
      expect(denom.factor, lang).toBeGreaterThanOrEqual(1);
      expect(toDenom(1, lang).amount, lang).toBeGreaterThanOrEqual(1);
    }
  });

  it("đổi qua rồi đổi lại không lệch quá một đơn vị hiển thị", () => {
    for (const lang of Object.keys(JOY_DENOMS)) {
      const joy = 4000;
      const back = fromDenom(toDenom(joy, lang).amount, lang);
      const tolerance = Math.ceil(1 / JOY_DENOMS[lang].factor);
      expect(Math.abs(back - joy), lang).toBeLessThanOrEqual(tolerance);
    }
  });

  it("chuỗi hiển thị viết số theo đúng ngôn ngữ đó", () => {
    expect(formatDenom(1000, "vi", "vi-VN")).toBe("25.000 JOYmi");
    expect(formatDenom(1000, "vi", "en-US")).toBe("25,000 JOYmi");
  });
});

describe("gửi JOY xuyên đơn vị", () => {
  it("cùng đơn vị thì KHÔNG có phí đổi tiền", () => {
    const same = transferBreakdown(1000, "vi", "vi");
    expect(same.crossDenom).toBe(false);
    expect(same.conversionFee).toBe(0);
    expect(same.received).toBe(1000);
  });

  it("khác đơn vị thì CỘNG THÊM 15% vào phần người gửi trả", () => {
    const cross = transferBreakdown(1000, "vi", "ja");
    expect(cross.crossDenom).toBe(true);
    expect(cross.conversionFeeRate).toBe(CROSS_DENOM_FEE);
    expect(cross.conversionFee).toBe(150);
    expect(cross.received).toBe(1000);          // người nhận nhận ĐỦ
    expect(cross.totalDeducted).toBe(1150);     // người gửi trả thêm
  });

  it("cộng cả phí sáng tạo 5% thì tổng trừ vẫn khớp từng đồng", () => {
    const b = transferBreakdown(1000, "vi", "en", 0.05);
    expect(b.creativeFee).toBe(50);
    expect(b.conversionFee).toBe(150);
    expect(b.totalDeducted).toBe(1200);
    expect(b.totalDeducted).toBe(b.sent + b.creativeFee + b.conversionFee);
  });

  it("es và fr dùng CÙNG đơn vị nên không tính là xuyên đơn vị", () => {
    // Hai ngôn ngữ khác nhau nhưng cùng JOYve — thu phí ở đây là thu vô cớ.
    expect(transferBreakdown(1000, "es", "fr").conversionFee).toBe(0);
    expect(isCrossDenom("es", "fr")).toBe(false);
    expect(isCrossDenom("vi", "en")).toBe(true);
  });

  it("phí làm tròn XUỐNG, người gửi không bị thu quá 15%", () => {
    for (const amount of [1, 7, 99, 333, 1001]) {
      const b = transferBreakdown(amount, "vi", "en");
      expect(b.conversionFee).toBeLessThanOrEqual(amount * CROSS_DENOM_FEE);
      expect(b.totalDeducted).toBe(b.sent + b.conversionFee);
    }
  });

  it("số âm hoặc rác không tạo ra JOY", () => {
    expect(transferBreakdown(-500, "vi", "ja").sent).toBe(0);
    expect(transferBreakdown("abc", "vi", "ja").totalDeducted).toBe(0);
  });
});

describe("neo giá vẫn đọc được ở mọi đơn vị", () => {
  it("giá thuê một tháng hiện ra số hợp lý ở mọi nước", () => {
    const monthly = FEATURE_PRICES.hugoAura;   // 400 JOY gốc
    for (const lang of Object.keys(JOY_DENOMS)) {
      const { amount } = toDenom(monthly, lang);
      // Không được ra 0 (mất nghĩa) và không được ra số dài quá 9 chữ số.
      expect(amount, lang).toBeGreaterThan(0);
      expect(String(Math.round(amount)).length, lang).toBeLessThanOrEqual(9);
    }
  });
});
