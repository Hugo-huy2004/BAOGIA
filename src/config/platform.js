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
/* Query này CHỈ dùng để nghe thay đổi (người dùng cài PWA giữa phiên, hoặc
   bấm F11) rồi chạy lại isStandalone(). Nó cố tình rộng — quyết định thật nằm
   ở isStandalone() bên dưới. */
export const APP_DISPLAY_QUERY =
  "(display-mode: standalone), (display-mode: fullscreen)";

const displayMode = (mode) => window.matchMedia?.(`(display-mode: ${mode})`).matches === true;

/**
 * `(display-mode: fullscreen)` KHÔNG chứng minh được là app đã cài.
 *
 * Chromium trả về đúng giá trị đó cho MỘT TAB THƯỜNG khi người dùng bấm F11
 * hoặc nút xanh toàn màn hình của macOS. Bắt nó vô điều kiện nghĩa là: ai mở
 * hugowishpax.studio trên máy tính rồi phóng to toàn màn hình đều bị coi là
 * "đang dùng app đã cài" — /login đổi sang PWALoginPage, navbar biến mất,
 * /introduction bị đá về /login. Đó chính là lỗi được báo.
 *
 * Nhưng không bỏ hẳn được: manifest đặt display_override ['fullscreen'] nên
 * PWA Android chạy fullscreen thật và `standalone` là FALSE ở đó.
 *
 * Ranh giới: chỉ TIN fullscreen trên điện thoại. Desktop cài PWA thì Chrome
 * mở ở chế độ standalone, nên nhánh này không cướp mất trường hợp nào.
 *
 * Chỉ "trên điện thoại" VẪN CHƯA ĐỦ. Mở web trên điện thoại (hoặc bật giả lập
 * thiết bị trong DevTools) rồi cho cửa sổ toàn màn hình thì user agent là điện
 * thoại và display-mode là fullscreen — y hệt PWA đã cài, nên /login đổi sang
 * PWALoginPage giữa một tab web bình thường. Đó là lỗi được báo lần hai.
 *
 * Thứ phân biệt được hai trường hợp không nằm ở màn hình mà ở CÁCH MỞ: PWA
 * luôn khởi động từ start_url của manifest, đang mang sẵn `?source=pwa`. Ghi
 * cờ đó vào sessionStorage ngay lần tải đầu (tham số chỉ có ở điều hướng đầu
 * tiên), và sessionStorage sống đúng bằng vòng đời của tab/app — vừa đúng
 * nghĩa "phiên này được mở từ màn hình chính".
 */
const PWA_LAUNCH_KEY = "hugo-pwa-launch";

/** Ghi cờ nếu phiên này khởi động từ start_url của manifest. */
const rememberPwaLaunch = () => {
  try {
    if (new URLSearchParams(window.location.search).get("source") === "pwa") {
      window.sessionStorage.setItem(PWA_LAUNCH_KEY, "1");
    }
  } catch {
    // Chế độ riêng tư chặn sessionStorage. Không sao: fullscreen mất một tín
    // hiệu, còn standalone/minimal-ui/navigator.standalone vẫn nhận ra PWA.
  }
};
rememberPwaLaunch();

const launchedAsApp = () => {
  try {
    return window.sessionStorage.getItem(PWA_LAUNCH_KEY) === "1";
  } catch {
    return false;
  }
};

export const isStandalone = () => {
  if (IS_NATIVE) return true;
  // iOS đã "Thêm vào màn hình chính" — tín hiệu riêng của WebKit, không mơ hồ.
  if (window.navigator.standalone === true) return true;
  if (displayMode("standalone") || displayMode("minimal-ui") || displayMode("window-controls-overlay")) {
    return true;
  }
  // Fullscreen chỉ được tính khi phiên này thật sự mở từ màn hình chính.
  return displayMode("fullscreen") && detectInstallTarget().isMobile && launchedAsApp();
};

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
