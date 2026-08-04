import { useEffect } from "react";
import { IS_NATIVE } from "../config/platform";
import { notify } from "../lib/notify";
import { setNativeHaptics } from "../utils/haptics";

/**
 * Everything the App Store / Play Store build needs that the browser build
 * doesn't: hardware back button, status bar tint, splash hand-off, keyboard
 * behaviour, real haptics.
 *
 * Renders nothing. Must sit inside <BrowserRouter> — the back button drives
 * the router's history.
 *
 * The plugins are imported dynamically so the web bundle never pulls them in;
 * `IS_NATIVE` is a build-time constant (see config/platform.js), so Rollup
 * drops this whole effect from the web build.
 */
export default function NativeShell() {
  useEffect(() => {
    if (!IS_NATIVE) return;
    let cleanups = [];

    (async () => {
      const [
        { App },
        { StatusBar, Style },
        { SplashScreen },
        { Keyboard },
        haptics,
        { Capacitor },
        { CapacitorUpdater },
      ] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/keyboard"),
        import("@capacitor/haptics"),
        import("@capacitor/core"),
        import("@capgo/capacitor-updater"),
      ]);

      // --- OTA rollback guard (must run first, and must not be moved) -----
      // The updater installs a downloaded bundle and starts a timer
      // (`appReadyTimeout`, 10s). If this call never lands, it assumes the new
      // bundle is broken and rolls back to the previous one on the next
      // launch. That is the entire safety net for shipping outside the store:
      // without it a bundle that throws before mount would brick every device
      // with no way to recover but an App Store release.
      //
      // It sits inside the same effect that renders the app, so reaching here
      // proves React mounted.
      CapacitorUpdater.notifyAppReady().catch(() => {});

      // --- Platform hook for CSS -----------------------------------------
      // iOS and Android disagree about what a native app looks like, and the
      // difference is entirely visual — so it belongs in CSS, not in a prop
      // threaded through the component tree. `html.native-ios` is what the
      // liquid-glass rules in index.css hang off.
      const platform = Capacitor.getPlatform();
      document.documentElement.classList.add(`native-${platform}`);
      cleanups.push(() => document.documentElement.classList.remove(`native-${platform}`));

      // --- Hardware back button (Android) ------------------------------
      // Without a listener Capacitor's default is exitApp() from any screen,
      // which is the single loudest "this isn't a real app" tell. `canGoBack`
      // is the WebView history, which BrowserRouter pushes onto, so it tracks
      // in-app navigation correctly.
      let armedUntil = 0;
      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
          return;
        }
        // At the root: Android convention is press-twice-to-exit, so a stray
        // back doesn't kill the app mid-session.
        if (Date.now() < armedUntil) {
          App.exitApp();
        } else {
          armedUntil = Date.now() + 2000;
          notify.info("Nhấn lại lần nữa để thoát");
        }
      });
      cleanups.push(() => back.remove());

      // --- Status bar follows the theme --------------------------------
      // Same source of truth as App.jsx's dark-class effect: the OS setting.
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const syncStatusBar = (e) => {
        // Style.Dark = light icons (for a dark background), and vice versa.
        StatusBar.setStyle({ style: e.matches ? Style.Dark : Style.Light }).catch(() => {});
        StatusBar.setBackgroundColor({ color: e.matches ? "#0b0a0f" : "#ffffff" }).catch(() => {});
      };
      syncStatusBar(mq);
      mq.addEventListener("change", syncStatusBar);
      cleanups.push(() => mq.removeEventListener("change", syncStatusBar));

      // --- Splash hand-off ---------------------------------------------
      // launchAutoHide is off in capacitor.config.json, so the splash stays up
      // until React has actually painted instead of flashing white in between.
      SplashScreen.hide().catch(() => {});

      // --- Keyboard -----------------------------------------------------
      // The iOS accessory bar (the grey "< > Done" strip) is dead space in an
      // app with its own form controls.
      Keyboard.setAccessoryBarVisible?.({ isVisible: false }).catch(() => {});

      // --- Haptics -------------------------------------------------------
      // navigator.vibrate() has never worked in WKWebView, so every buzz in
      // haptics.js was silently a no-op on iOS. Hand the real engine over.
      setNativeHaptics(haptics);
    })();

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
