import { describe, expect, it } from "vitest";
import { FEATURE_PRICES, EXCHANGE_TAX_RATE, chargeFeatureSubscription, calcExchangeTotal } from "../utils/featureSubscriptionService.js";
import { FEATURE_PRICES as SHARED_PRICES } from "../../shared/joyPrices.js";

// Lỗi thật đã xảy ra: file dùng `export { FEATURE_PRICES } from '...'`, cú pháp
// đó chuyển tiếp tên ra ngoài mà KHÔNG tạo binding trong file, nên bảng giá là
// undefined ngay trong hàm trừ tiền. Module vẫn nạp bình thường nên test kiểu
// "import được không" không bắt được — phải GỌI hàm mới lộ.
describe("bảng giá tính năng dùng được BÊN TRONG service", () => {
  it("gọi hàm trừ tiền với khoá lạ ném lỗi NGHIỆP VỤ, không phải ReferenceError", async () => {
    const fakeBio = { joyBalance: 99999, email: "test@example.com", save: async () => {} };
    await expect(chargeFeatureSubscription(fakeBio, "khoa-khong-ton-tai", 1))
      .rejects.toThrow("Tính năng không hợp lệ.");
  });

  it("re-export đúng bảng giá dùng chung, không phải bản sao", () => {
    expect(FEATURE_PRICES).toBe(SHARED_PRICES);
    expect(Object.keys(FEATURE_PRICES).length).toBeGreaterThan(0);
  });

  it("phí giao dịch cũng lấy từ bảng dùng chung", () => {
    expect(EXCHANGE_TAX_RATE).toBeGreaterThan(0);
    const { priceJoy, tax, total } = calcExchangeTotal(1000);
    expect(tax).toBe(Math.floor(1000 * EXCHANGE_TAX_RATE));
    expect(total).toBe(priceJoy + tax);
  });
});
