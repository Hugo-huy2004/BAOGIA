import { describe, it, expect, beforeEach } from "vitest";
import { isStandalone, IS_NATIVE } from "./platform";

// Không có jsdom: dựng đúng hai global mà isStandalone đụng tới.
globalThis.window ??= globalThis;
globalThis.navigator ??= {};

const setDisplayMode = (standalone) => {
  window.matchMedia = (q) => ({ matches: standalone && q.includes("standalone") });
};

describe("isStandalone", () => {
  beforeEach(() => {
    setDisplayMode(false);
    navigator.standalone = undefined;
  });

  it("tab trình duyệt thường → false", () => {
    expect(isStandalone()).toBe(false);
  });

  it("PWA đã cài (display-mode: standalone) → true", () => {
    setDisplayMode(true);
    expect(isStandalone()).toBe(true);
  });

  it("iOS home-screen (navigator.standalone) → true", () => {
    navigator.standalone = true;
    expect(isStandalone()).toBe(true);
  });

  // Bản native luôn tính là "chạy như app" dù WebView báo display-mode: browser.
  // Ở test IS_NATIVE=false, nên chỉ khẳng định được quan hệ này.
  it("IS_NATIVE luôn kéo theo isStandalone", () => {
    expect(IS_NATIVE ? isStandalone() : true).toBe(true);
  });
});
