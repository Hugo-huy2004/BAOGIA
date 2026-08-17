import { describe, expect, it } from "vitest";
import {
  JOYLATER, median, creditLimit, loanTotal, expectedDays, repaymentFor, eligibility,
} from "./joyLater.js";
import { DAILY_CASUAL_JOY, FEATURE_PRICES, ownFromMonthly } from "./joyPrices.js";

describe("hạn mức co theo thu nhập", () => {
  it("người chơi thường vay được ~5 ngày thu nhập", () => {
    expect(creditLimit(DAILY_CASUAL_JOY)).toBe(2050);   // 415 × 5 = 2075 → mốc 50
  });

  it("người cày nhiều vay nhiều hơn nhưng vẫn có trần cứng", () => {
    expect(creditLimit(1185)).toBeGreaterThan(creditLimit(415));
    expect(creditLimit(100000)).toBe(JOYLATER.hardCap);
  });

  it("chưa kiếm được gì thì không vay được", () => {
    expect(creditLimit(0)).toBe(0);
    expect(creditLimit(-500)).toBe(0);
  });

  it("THỜI GIAN TRẢ gần như bằng nhau ở mọi mức thu nhập — đó là điểm của thiết kế", () => {
    for (const income of [200, 415, 800, 1185]) {
      const { total } = loanTotal(creditLimit(income));
      expect(expectedDays(total, income), `${income}/ngày`).toBeLessThanOrEqual(15);
    }
  });
});

describe("phí một lần, không lãi kép", () => {
  it("phí đúng 10% số gốc, làm tròn xuống", () => {
    // toMatchObject, không toEqual: `loanTotal` còn trả kỳ hạn/lịch trả nữa —
    // ràng buộc ở đây là SỐ TIỀN, không phải hình dạng object.
    expect(loanTotal(2000)).toMatchObject({ principal: 2000, fee: 200, total: 2200 });
    expect(loanTotal(999)).toMatchObject({ principal: 999, fee: 99, total: 1098 });
  });

  it("vay lâu hơn KHÔNG làm nợ tăng lên", () => {
    // Không có hàm nào cộng thêm theo thời gian: tổng chỉ phụ thuộc số gốc.
    const first = loanTotal(1500);
    const later = loanTotal(1500);
    expect(later.total).toBe(first.total);
  });
});

describe("trừ nợ từ thu nhập", () => {
  it("trừ 40% mỗi lần nhận JOY", () => {
    expect(repaymentFor(100, 5000)).toBe(40);
    expect(repaymentFor(415, 5000)).toBe(166);
  });

  it("không bao giờ trừ quá số còn nợ", () => {
    expect(repaymentFor(1000, 50)).toBe(50);
    expect(repaymentFor(1000, 0)).toBe(0);
  });

  it("luôn để lại phần lớn cho người chơi — trả nợ không được thành chơi không thưởng", () => {
    const income = 200;
    const kept = income - repaymentFor(income, 99999);
    expect(kept / income).toBeGreaterThanOrEqual(0.6);
  });

  it("JOY bị trừ (mua hàng) thì không trừ nợ thêm lần nữa", () => {
    expect(repaymentFor(-500, 1000)).toBe(0);
  });

  it("trả dần rồi cũng hết, không kéo dài vô hạn", () => {
    let outstanding = loanTotal(2050).total;
    let days = 0;
    while (outstanding > 0 && days < 100) {
      outstanding -= repaymentFor(DAILY_CASUAL_JOY, outstanding);
      days += 1;
    }
    expect(outstanding).toBe(0);
    expect(days).toBeLessThanOrEqual(15);
  });
});

describe("điều kiện vay", () => {
  const ok = { isAdult: true, accountDays: 30, lifetimeEarned: 5000, hasOpenLoan: false, medianDailyIncome: 415 };

  it("đủ điều kiện thì cho vay kèm hạn mức", () => {
    expect(eligibility(ok)).toEqual({ eligible: true, reasons: [], limit: 2050 });
  });

  it("dưới 18 tuổi thì không — JOYlater là cơ chế mắc nợ", () => {
    expect(eligibility({ ...ok, isAdult: false }).reasons).toContain("adult");
  });

  it("tài khoản quá mới hoặc chưa từng kiếm đủ thì không", () => {
    expect(eligibility({ ...ok, accountDays: 3 }).reasons).toContain("accountAge");
    expect(eligibility({ ...ok, lifetimeEarned: 100 }).reasons).toContain("earned");
  });

  it("còn nợ thì không vay thêm", () => {
    expect(eligibility({ ...ok, hasOpenLoan: true }).reasons).toContain("openLoan");
  });

  it("nêu ĐỦ mọi lý do cùng lúc, không chỉ lý do đầu", () => {
    const result = eligibility({ isAdult: false, accountDays: 1, lifetimeEarned: 0, hasOpenLoan: true, medianDailyIncome: 0 });
    expect(result.reasons).toEqual(
      expect.arrayContaining(["adult", "accountAge", "earned", "openLoan", "noIncome"]),
    );
  });
});

describe("hạn mức so với giá thật trong bảng giá", () => {
  const casualLimit = creditLimit(DAILY_CASUAL_JOY);

  it("người chơi thường vay đủ mở một chặng học vĩnh viễn (1.500)", () => {
    expect(casualLimit).toBeGreaterThanOrEqual(1500);
  });

  it("vay đủ vài tháng thuê bất kỳ ứng dụng nào", () => {
    const dearestRent = Math.max(...Object.values(FEATURE_PRICES));
    expect(casualLimit / dearestRent).toBeGreaterThanOrEqual(3);
  });

  it("KHÔNG vay nổi mua-vĩnh-viễn ứng dụng đắt nhất — món lớn vẫn phải để dành", () => {
    const arcadeOwn = ownFromMonthly(FEATURE_PRICES.hugoArcade);
    expect(casualLimit).toBeLessThan(arcadeOwn);
  });
});
