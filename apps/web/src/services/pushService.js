/**
 * One entry point for push, whichever shell the app runs in.
 *
 * Web  → Web Push (VAPID + service worker), unchanged, via webPushHelper.
 * Native → APNs on iOS / FCM on Android, via @capacitor/push-notifications.
 *
 * They are not interchangeable: Web Push has no implementation inside an iOS
 * WebView, and a native build has no service worker to receive it. Call sites
 * should use this facade and never branch on platform themselves.
 *
 * The Capacitor plugin is imported dynamically so it never enters the web
 * bundle — the web build must not ship a native plugin it cannot use.
 */
import { IS_NATIVE } from "../config/platform";
import { API_BASE } from "../config/apiBase";
import { webPushHelper } from "../utils/webPushHelper";
import { getStoredAppLanguage, localeForLanguage } from "../i18n/languages";

/** Remembered so unsubscribe can name the exact device to remove. */
let currentNativeToken = null;

const deviceContext = () => ({
  locale: localeForLanguage(getStoredAppLanguage() || navigator.language),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
});

async function loadPlugin() {
  const [{ PushNotifications }, { Capacitor }] = await Promise.all([
    import("@capacitor/push-notifications"),
    import("@capacitor/core"),
  ]);
  return { PushNotifications, platform: Capacitor.getPlatform() };
}

/**
 * Register this device for push. Resolves to a short status string rather than
 * throwing, because every caller here is a settings toggle that needs to show
 * the outcome, not crash.
 */
async function registerNative() {
  const { PushNotifications, platform } = await loadPlugin();
  if (platform !== "ios" && platform !== "android") return "unsupported";

  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== "granted") return "denied";

  // The token arrives on an event, not as a return value, so the promise is
  // resolved by whichever of the two listeners fires first.
  const token = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("push registration timed out")), 15000);
    PushNotifications.addListener("registration", (t) => {
      clearTimeout(timeout);
      resolve(t.value);
    });
    PushNotifications.addListener("registrationError", (err) => {
      clearTimeout(timeout);
      reject(new Error(err?.error || "push registration failed"));
    });
    PushNotifications.register();
  });

  const res = await fetch(`${API_BASE}/notifications/native/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, platform, ...deviceContext() }),
  });
  if (!res.ok) throw new Error(`subscribe failed: HTTP ${res.status}`);

  currentNativeToken = token;
  return "granted";
}

async function unregisterNative() {
  if (!currentNativeToken) return false;
  const res = await fetch(`${API_BASE}/notifications/native/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token: currentNativeToken }),
  });
  currentNativeToken = null;
  return res.ok;
}

export const pushService = {
  /** Whether push can work at all in this shell. */
  isSupported() {
    return IS_NATIVE ? true : webPushHelper.isSupported();
  },

  /** "granted" | "denied" | "unsupported". */
  async subscribe(email) {
    if (IS_NATIVE) return registerNative();
    const permission = await webPushHelper.requestPermission();
    if (permission !== "granted") return permission;
    const registration = await webPushHelper.registerAndSubscribe(email);
    return registration ? "granted" : "denied";
  },

  async unsubscribe() {
    if (IS_NATIVE) return unregisterNative();
    return webPushHelper.unsubscribe();
  },

  /** Whether this device already has an active registration. */
  async isSubscribed() {
    if (IS_NATIVE) return Boolean(currentNativeToken);
    return webPushHelper.isSubscribed();
  },

  /**
   * Called once at startup in native builds so a tap on a notification opens
   * the right screen. No-op on web, where the service worker already handles it.
   */
  async attachNativeHandlers(onOpen) {
    if (!IS_NATIVE) return;
    const { PushNotifications } = await loadPlugin();
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const target = action?.notification?.data?.url;
      if (target) onOpen?.(target);
    });
  },
};
