import { describe, it, expect } from "vitest";
import { isVoucherActive } from "./voucherStatus";

// Cùng một hàm quyết định số badge ngoài ví và cột "đang có" bên trong, nên sai
// ở đây là voucher còn hạn biến mất khỏi tầm mắt người dùng.
describe("isVoucherActive", () => {
  const now = new Date("2026-08-13T00:00:00Z").getTime();

  it("giữ voucher chưa dùng và còn hạn", () => {
    expect(isVoucherActive({ expiresAt: "2026-09-01T00:00:00Z" }, now)).toBe(true);
  });

  it("loại voucher đã dùng dù còn hạn", () => {
    expect(isVoucherActive({ expiresAt: "2026-09-01T00:00:00Z", usedAt: "2026-08-01T00:00:00Z" }, now)).toBe(false);
  });

  it("loại voucher quá hạn", () => {
    expect(isVoucherActive({ expiresAt: "2026-08-01T00:00:00Z" }, now)).toBe(false);
  });

  it("giữ mã cũ không có hạn dùng", () => {
    expect(isVoucherActive({ code: "BDAY-07-X", expiresAt: null }, now)).toBe(true);
  });
});
