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
 */
export const BUILD_TARGET = import.meta.env?.VITE_BUILD_TARGET || "web";

/** True in the App Store / Play Store builds. */
export const IS_NATIVE = BUILD_TARGET === "native";

/** True in the browser build, where the PWA layer is still wanted. */
export const IS_WEB = !IS_NATIVE;
