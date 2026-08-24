/**
 * Which shell the client is running in.
 *
 * Set at build time by VITE_BUILD_TARGET (see `npm run build:native`), not
 * sniffed from the user agent — the decision has to be identical in the bundler
 * and at runtime, and a UA check cannot influence which plugins Vite runs.
 *
 * The web build keeps the PWA: service worker, offline cache, Web Push.
 * The native build must not have one. A service worker inside a Capacitor
 * WebView caches the app shell and then serves it back forever, so a shipped
 * update never reaches the device — the app looks "stuck" on an old version
 * with no way to force a refresh from the store.
 *
 * No optional chaining on `import.meta.env` here: Vite only substitutes the
 * literal for the plain member expression, and `?.` blocks it. That leaves
 * IS_NATIVE unknown at build time, so Rollup can't drop the native-only
 * branches and every browser visitor precaches the Capacitor plugin chunks
 * they will never run.
 */
export const BUILD_TARGET = import.meta.env.VITE_BUILD_TARGET || "web";

/** True in the App Store / Play Store builds. */
export const IS_NATIVE = BUILD_TARGET === "native";

/** True in the browser build, where the PWA layer is still wanted. */
export const IS_WEB = !IS_NATIVE;

/**
 * True when the app runs as an app rather than a browser tab: an installed PWA,
 * or the native shell.
 *
 * The Capacitor WebView reports `display-mode: browser`, so the media query on
 * its own is false there — and every app-only branch (the PWA login screen, the
 * hidden marketing navbar, "already installed, so hide the install prompt")
 * silently fell back to the web experience inside the store build.
 *
 * A function, not a const: display-mode flips when the user installs the PWA
 * mid-session.
 */
/**
 * Media query list nhận diện "đang chạy như một app".
 *
 * Phải có CẢ `fullscreen`: manifest dùng display_override: ['fullscreen'] nên
 * Android chạy PWA ở chế độ fullscreen và `(display-mode: standalone)` là
 * FALSE ở đó. Chỉ bắt standalone thì mọi nhánh app-only (màn đăng nhập PWA,
 * ẩn navbar marketing, "đã cài rồi nên đừng mời cài nữa") lặng lẽ rơi về bản
 * web ngay trong app đã cài.
 */
export const APP_DISPLAY_QUERY =
  "(display-mode: standalone), (display-mode: fullscreen)";

export const isStandalone = () =>
  IS_NATIVE ||
  window.matchMedia?.(APP_DISPLAY_QUERY).matches === true ||
  window.navigator.standalone === true;

/**
 * Nhận diện thiết bị/trình duyệt đủ chi tiết để hướng dẫn cài PWA cho ĐÚNG
 * chỗ bấm. Chỉ đọc user agent — không có API nào khác trả lời được "người này
 * đang ở Safari hay ở trình duyệt trong Zalo".
 */
export function detectInstallTarget() {
  const ua = navigator.userAgent || "";
  // iPadOS 13+ khai user agent y hệt macOS; maxTouchPoints là điểm khác duy nhất.
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);

  // Trình duyệt nhúng trong app khác: KHÔNG có menu "Thêm vào màn hình chính",
  // nên bước đầu tiên luôn là thoát ra trình duyệt hệ thống.
  const inApp =
    /FBAN|FBAV|FB_IAB|Instagram|Zalo|TikTok|Line\/|Messenger|MicroMessenger|Twitter|Snapchat/i.test(
      ua,
    );

  let browser;
  if (iOS) {
    // Trên iOS mọi trình duyệt đều là WebKit, nhưng menu Chia sẻ nằm khác chỗ.
    browser = /CriOS/.test(ua)
      ? "chrome"
      : /EdgiOS/.test(ua)
        ? "edge"
        : /FxiOS/.test(ua)
          ? "firefox"
          : "safari";
  } else {
    browser = /SamsungBrowser/.test(ua)
      ? "samsung"
      : /EdgA/.test(ua)
        ? "edge"
        : /Firefox/.test(ua)
          ? "firefox"
          : "chrome";
  }

  return { iOS, android, inApp, browser, isMobile: iOS || android };
}
