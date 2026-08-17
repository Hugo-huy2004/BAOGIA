import { describe, expect, it } from "vitest";
import { applyProfileValues, missingProfileFields } from "../utils/profileRequirements.js";
import { transferBreakdown } from "../../shared/joyCurrency.js";

// Đơn vị JOY khoá sau lần chọn đầu là thứ giữ cho phí đổi đơn vị 15% có nghĩa.
// Nếu ngày nào đó `applyProfileValues` cho ghi đè, mọi người sẽ đổi đơn vị cho
// khớp người nhận ngay trước khi gửi và không ai trả phí nữa — test này chặn.
describe("đơn vị JOY chọn một lần rồi khoá", () => {
  it("lần đầu thì hỏi, chọn rồi thì không hỏi lại", () => {
    const fresh = {};
    expect(missingProfileFields(fresh).map((field) => field.key)).toContain("joyDenom");
    applyProfileValues(fresh, { joyDenom: "ja" });
    expect(fresh.joyDenom).toBe("ja");
    expect(missingProfileFields(fresh).map((field) => field.key)).not.toContain("joyDenom");
  });

  it("gửi lên đơn vị khác KHÔNG ghi đè được đơn vị đã chọn", () => {
    const bio = { joyDenom: "ja" };
    applyProfileValues(bio, { joyDenom: "vi" });
    expect(bio.joyDenom).toBe("ja");
  });

  it("đơn vị rác bị từ chối chứ không lưu vào ví", () => {
    expect(() => applyProfileValues({}, { joyDenom: "moon" })).toThrow();
  });

  it("khoá đơn vị nghĩa là không né được phí 15%", () => {
    const sender = { joyDenom: "ja" };
    applyProfileValues(sender, { joyDenom: "vi" });   // cố đổi cho khớp người nhận
    const bill = transferBreakdown(1000, sender.joyDenom, "vi", 0.05);
    expect(bill.crossDenom).toBe(true);
    expect(bill.conversionFee).toBe(150);
  });
});
