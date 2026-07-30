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
  it("nằm trong khung mobile và trước các modal/onboarding", () => {
    const mobileMainIndex = page.indexOf('className="portal-mobile-main"');
    const tabBarIndex = page.indexOf('id="mobile-bottom-tab-bar"');
    const onboardingIndex = page.indexOf("<PWAPermissionOnboarding", tabBarIndex);

    expect(page.match(/id="mobile-bottom-tab-bar"/g)).toHaveLength(1);
    expect(mobileMainIndex).toBeGreaterThan(-1);
    expect(tabBarIndex).toBeGreaterThan(mobileMainIndex);
    expect(onboardingIndex).toBeGreaterThan(tabBarIndex);
  });

  it("không dùng fixed/absolute positioning", () => {
    expect(tabBarClass).toBeTruthy();
    expect(tabBarClass).not.toMatch(/\b(fixed|absolute|bottom-0)\b/);
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

  it("không để PWA standalone bỏ qua safe-area đã được giới hạn", () => {
    const standaloneTabBar = css.match(
      /html\.standalone-pwa \.mobile-portal-tabbar\s*\{[^}]*\}/,
    )?.[0];

    expect(standaloneTabBar).toMatch(
      /padding-bottom:\s*var\(--portal-tabbar-pad\)/,
    );
    expect(standaloneTabBar).not.toMatch(
      /padding-bottom:\s*(?:calc\([^;]*env|env)\(safe-area-inset-bottom/,
    );
    expect(css).toMatch(
      /--portal-safe-bottom:\s*min\(34px,\s*max\(0px,\s*env\(safe-area-inset-bottom/,
    );
    expect(css).toMatch(
      /--portal-tabbar-pad:\s*min\(20px,\s*max\(8px,\s*var\(--portal-safe-bottom/,
    );
  });
});
