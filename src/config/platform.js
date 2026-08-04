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
export const isStandalone = () =>
  IS_NATIVE ||
  window.matchMedia?.("(display-mode: standalone)").matches === true ||
  window.navigator.standalone === true;
