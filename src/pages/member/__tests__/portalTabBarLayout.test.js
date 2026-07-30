import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const page = readFileSync(
  resolve("src/pages/member/MemberPortalPage.jsx"),
  "utf8",
);
const css = readFileSync(resolve("src/index.css"), "utf8");

describe("mobile primary navigation", () => {
  it("đã xoá hoàn toàn kiến trúc tab-bar đáy cũ", () => {
    expect(page).not.toContain("mobile-bottom-tab-bar");
    expect(page).not.toContain("MobilePortalDock");
    expect(page).not.toContain("createPortal");
    expect(css).not.toContain("mobile-portal-dock");
    expect(css).not.toContain("--portal-dock-safe");
  });

  it("render navigation mới làm hàng cuối trong app shell", () => {
    expect(page.match(/id="mobile-primary-navigation"/g)).toHaveLength(1);
    expect(page).toContain("function MobilePortalNav");
    expect(page).toMatch(
      /<div className="portal-mobile-main">[\s\S]*className=\{`mobile-portal-content[\s\S]*<MobilePortalNav/,
    );
  });

  it("navigation mới không dùng fixed hoặc thuộc tính định vị bottom", () => {
    const nav = css.match(/\.mobile-portal-nav\s*\{[^}]*\}/)?.[0];
    expect(nav).toMatch(/flex:\s*0 0 auto/);
    expect(nav).toMatch(/border-top:/);
    expect(nav).not.toMatch(/position:\s*fixed/);
    expect(nav).not.toMatch(/^\s*bottom:/m);
    expect(nav).toMatch(
      /min\(6px,\s*max\(4px,\s*env\(safe-area-inset-bottom/,
    );
  });

  it("nội dung cuộn độc lập dưới navigation và không còn khoảng trống 76px", () => {
    expect(css).toMatch(/\.mobile-portal-content\s*\{[^}]*overflow-y:\s*auto/);
    expect(css).not.toMatch(
      /\.mobile-portal-content\s*\{[^}]*padding-bottom:\s*76px/,
    );
    expect(css).toMatch(
      /\.mobile-portal-content\s*\{[^}]*padding-bottom:\s*max\(16px,\s*env\(safe-area-inset-bottom/,
    );
  });

  it("không còn JavaScript visualViewport có thể nâng navigation", () => {
    expect(page).not.toContain("window.visualViewport");
    expect(page).not.toContain("--portal-visual-height");
    expect(page).not.toContain("--portal-visual-top");
    expect(page).not.toContain("--portal-safe-bottom");
    expect(page).not.toContain("safeAreaProbe");
    expect(page).not.toContain("useKeyboardVisible");
    expect(css).toMatch(
      /\.member-portal-shell\.portal-mobile-layout\s*\{[^}]*inset:\s*0[^}]*height:\s*auto/,
    );
  });

  it("mọi mục navigation luôn có icon và nhãn", () => {
    expect(page).toContain("mobile-portal-nav__icon");
    expect(page).toContain("mobile-portal-nav__label");
    expect(page).toMatch(
      /mobile-portal-nav__label[^>]*>\{tab\.label\}<\/span>/,
    );
  });
});
