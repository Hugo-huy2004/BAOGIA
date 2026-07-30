import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Dock mobile được portal thẳng ra body để không thể bị layout, modal hoặc
// một ancestor của MemberPortalPage đẩy lên.
const page = readFileSync(
  resolve("src/pages/member/MemberPortalPage.jsx"),
  "utf8",
);
const css = readFileSync(resolve("src/index.css"), "utf8");

describe("portal mobile dock", () => {
  it("render đúng một dock bằng React portal vào body", () => {
    expect(page.match(/id="mobile-bottom-tab-bar"/g)).toHaveLength(1);
    expect(page).toMatch(/function MobilePortalDock/);
    expect(page).toMatch(/createPortal\(/);
    expect(page).toMatch(/document\.body/);
    expect(page).toMatch(/className="mobile-portal-dock"/);
  });

  it("dock ghim trực tiếp vào đáy và chỉ cao vừa đủ", () => {
    const dock = css.match(/\.mobile-portal-dock\s*\{[^}]*\}/)?.[0];
    expect(dock).toMatch(/position:\s*fixed/);
    expect(dock).toMatch(/bottom:\s*0/);
    expect(dock).toMatch(/left:\s*0/);
    expect(dock).toMatch(/right:\s*0/);
    expect(dock).toMatch(
      /--portal-dock-safe:\s*min\(12px,\s*max\(6px,\s*var\(--portal-safe-bottom-px/,
    );
    expect(css).toMatch(
      /\.mobile-portal-dock__track\s*\{[^}]*height:\s*44px/,
    );
    expect(css).toMatch(
      /\.mobile-portal-content\s*\{[^}]*padding-bottom:\s*76px/,
    );
  });

  it("app shell mobile ghim vào vùng nhìn thấy, nội dung cuộn bên trong", () => {
    const shell = css.match(
      /\.member-portal-shell\.portal-mobile-layout\s*\{[^}]*\}/g,
    )?.at(-1);
    expect(shell).toMatch(/position:\s*fixed/);
    expect(shell).toMatch(/top:\s*var\(--portal-visual-top,\s*0px\)/);
    expect(shell).toMatch(/bottom:\s*auto/);
    expect(shell).toMatch(
      /height:\s*var\(--portal-visual-height,\s*100dvh\)/,
    );
    expect(css).toMatch(/\.mobile-portal-content\s*\{[^}]*overflow-y:\s*auto/);
  });

  it("đồng bộ visualViewport và clamp safe-area cho iPhone", () => {
    expect(page).toMatch(/window\.visualViewport/);
    expect(page).toMatch(/--portal-visual-height/);
    expect(page).toMatch(/--portal-visual-top/);
    expect(page).toMatch(
      /Math\.min\(34,\s*Math\.max\(0,\s*rawSafeBottom\)\)/,
    );
  });

  it("không để safe-area iPhone làm dock phình bất thường", () => {
    expect(css).toMatch(
      /--portal-safe-bottom:\s*min\(34px,\s*max\(0px,\s*env\(safe-area-inset-bottom/,
    );
    expect(page).toMatch(/--portal-safe-bottom-px/);
  });
});
