import { describe, expect, it } from "vitest";
import { isProfileSetupRoute } from "../middleware/authMiddleware.js";

// Chưa chọn đơn vị JOY thì requireMember trả 403 cho MỌI route, trừ danh sách
// dưới đây. Danh sách này là chỗ dễ hỏng nhất của một cổng chặn bắt buộc: rộng
// quá thì chặn hờ, hẹp quá thì khoá cửa để chìa bên trong.
describe("cổng chặn hồ sơ chưa xong", () => {
  it("mở đúng những đường cần để hoàn tất lựa chọn", () => {
    for (const url of [
      "/api/bios/me",
      "/api/bios/me?x=1",
      "/api/bios/me/profile-gaps",
      "/api/bios/me/onboarding",
      "/api/auth/member/logout",
      "/api/auth/member/google",
    ]) {
      expect(isProfileSetupRoute(url), url).toBe(true);
    }
  });

  it("KHÔNG mở những đường khác dưới /bios/me — so khớp chính xác, không theo tiền tố", () => {
    for (const url of [
      "/api/bios/me/update",
      "/api/bios/me/check-location",
      "/api/bios/me/portal-theme",
      "/api/joy/balance",
      "/api/joy/transfer",
      "/api/joy/joylater/open",
      "/api/companion/challenges",
    ]) {
      expect(isProfileSetupRoute(url), url).toBe(false);
    }
  });

  it("dấu / thừa hay chuỗi rỗng không lách được cổng", () => {
    expect(isProfileSetupRoute("/api/bios/me/")).toBe(true);
    expect(isProfileSetupRoute("/api/bios/me/update/")).toBe(false);
    expect(isProfileSetupRoute("")).toBe(false);
    expect(isProfileSetupRoute(undefined)).toBe(false);
  });
});
