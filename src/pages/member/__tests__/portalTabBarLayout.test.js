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
    expect(shell).toMatch(/inset:\s*0/);
    // top+bottom+height là ràng buộc thừa: trình duyệt bỏ `bottom` và thanh tab
    // lại rời khỏi đáy màn.
    const heights = [...shell.matchAll(/(?<!min-|max-)height:\s*([^;]+);/g)];
    expect(heights.map((m) => m[1].trim())).toEqual(["auto"]);
    expect(css).toMatch(/\.mobile-portal-content\s*\{[^}]*overflow-y:\s*auto/);
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
  });
});
