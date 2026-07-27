import { describe, it, expect } from "vitest";
import { orderTotals, perkLabel, TAX_RATE } from "./storeData";

/* Con số hiển thị trong sheet thanh toán phải trùng với số server trừ tiền
   (server/routes/storeCartRoutes.js → POST /cart/checkout). Test này khoá
   đúng công thức đó lại. */
const serverTotal = (subtotal, discount) =>
  Math.max(1, subtotal + Math.floor(subtotal * TAX_RATE) - discount);

const item = (priceJoy, quantity = 1) => ({ priceJoy, quantity });

describe("orderTotals", () => {
  it("khớp công thức server ở các mức giá lẻ", () => {
    for (const price of [1, 7, 99, 100, 333, 1499, 20001]) {
      const { total } = orderTotals([item(price)]);
      expect(total).toBe(serverTotal(price, 0));
    }
  });

  it("nhân đúng theo số lượng và cộng nhiều dòng", () => {
    const { subtotal, total } = orderTotals([item(150, 3), item(200, 2)]);
    expect(subtotal).toBe(850);
    expect(total).toBe(serverTotal(850, 0));
  });

  it("làm tròn xuống phí 9%", () => {
    expect(orderTotals([item(101)]).tax).toBe(9); // 9.09 → 9
  });

  it("giảm giá không vượt quá tạm tính và tổng không xuống dưới 1", () => {
    const { discount, total } = orderTotals([item(100)], 999);
    expect(discount).toBe(100);
    expect(total).toBe(Math.max(1, 100 + 9 - 100));
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it("giỏ trống thì tổng bằng 0", () => {
    expect(orderTotals([]).total).toBe(0);
  });
});

describe("perkLabel", () => {
  it("đọc được từng loại quyền lợi", () => {
    expect(perkLabel({ productType: "radio_time", radioMinutes: 2880 })).toBe("+2 ngày nghe");
    expect(perkLabel({ productType: "radio_time", radioMinutes: 180 })).toBe("+3 giờ nghe");
    expect(perkLabel({ productType: "system_validity", extendDays: 30 })).toBe("+30 ngày sử dụng");
    expect(perkLabel({ productType: "psy_study_tokens", tokenAmount: 5, tokenType: "call" }))
      .toBe("+5 lượt gọi");
    expect(perkLabel({ productType: "general" })).toBeNull();
    expect(perkLabel(null)).toBeNull();
  });
});
