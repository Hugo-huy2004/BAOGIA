import { describe, expect, it } from "vitest";
import JoyLedger from "../models/JoyLedger.js";
import { awardJoy } from "../utils/joyService.js";

describe("JoyLedger source schema", () => {
  it("chấp nhận source thưởng đọc hết Info & Version", () => {
    const entry = new JoyLedger({
      email: "reader@example.com",
      amount: 50,
      balanceAfter: 150,
      source: "info_read_bonus",
      description: "Read release notes",
    });

    expect(entry.validateSync()).toBeUndefined();
  });

  it("từ chối source lạ trước khi bắt đầu cập nhật ví", async () => {
    await expect(
      awardJoy("reader@example.com", 50, "source-khong-ton-tai", "Invalid"),
    ).rejects.toThrow("INVALID_JOY_SOURCE");
  });
});
