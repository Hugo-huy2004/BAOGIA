import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Thanh tab dưới của portal PHẢI nằm trong luồng (hàng cuối của app shell
// 100dvh). Lần nào nó quay lại `position: fixed` là lần đó PWA iOS lại neo nó
// vào một viewport không phải màn hình thật → thanh tab nổi lên giữa màn.
const page = readFileSync(
  resolve(__dirname, "../MemberPortalPage.jsx"),
  "utf8",
);
const css = readFileSync(resolve(__dirname, "../../../index.css"), "utf8");

const tabBarClass = page.match(/className=\{`mobile-portal-tabbar[^`]*`\}/)?.[0];

describe("portal mobile tab bar", () => {
  it("không dùng fixed/absolute positioning", () => {
    expect(tabBarClass).toBeTruthy();
    expect(tabBarClass).not.toMatch(/\b(fixed|absolute|bottom-0)\b/);
  });

  it("app shell mobile là cột 100dvh có nội dung cuộn bên trong", () => {
    expect(css).toMatch(
      /\.member-portal-shell\.portal-mobile-layout\s*\{[^}]*height:\s*100dvh/,
    );
    expect(css).toMatch(/\.mobile-portal-content\s*\{[^}]*overflow-y:\s*auto/);
  });
});
