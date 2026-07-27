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
});
