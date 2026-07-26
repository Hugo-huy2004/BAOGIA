import { getCachedGeolocation } from "../utils/geoCache";
import { webPushHelper } from "../utils/webPushHelper";

const LOCATION_GRANT_KEY = "hugo:pwa:location-granted:v1";
const PERMISSION_EVENT = "hugo:permissions-updated";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)")?.matches
  || window.navigator.standalone === true;

class PWAPermissionService {
  async getPushState() {
    const supported = typeof window !== "undefined"
      && "Notification" in window
      && webPushHelper.isSupported();
    if (!supported) {
      return { supported: false, permission: "unsupported", subscribed: false, ready: false };
    }

    const permission = Notification.permission;
    const subscribed = permission === "granted"
      ? await webPushHelper.isSubscribed()
      : false;

    return {
      supported: true,
      permission,
      subscribed,
      ready: permission === "granted" && (subscribed || import.meta.env.DEV),
    };
  }

  async getLocationState() {
    const supported = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
    if (!supported) {
      return { supported: false, permission: "unsupported", ready: false };
    }

    let permission = localStorage.getItem(LOCATION_GRANT_KEY) === "true" ? "granted" : "prompt";
    try {
      if (navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: "geolocation" });
        permission = status.state;
        if (permission === "denied") localStorage.removeItem(LOCATION_GRANT_KEY);
      }
    } catch {
      // Safari may not expose geolocation through the Permissions API.
    }

    return { supported: true, permission, ready: permission === "granted" };
  }

  async getSnapshot() {
    const [push, location] = await Promise.all([
      this.getPushState(),
      this.getLocationState(),
    ]);
    return {
      push,
      location,
      complete: push.ready && location.ready,
      standalone: isStandalone(),
    };
  }

  async enablePush(email) {
    if (!email || !webPushHelper.isSupported()) return this.getSnapshot();
    const permission = await webPushHelper.requestPermission();
    if (permission === "granted") {
      await webPushHelper.registerAndSubscribe(email);
    }
    this.notifyChanged();
    return this.getSnapshot();
  }

  async enableLocation() {
    const position = await getCachedGeolocation({ fresh: true });
    localStorage.setItem(LOCATION_GRANT_KEY, "true");
    sessionStorage.removeItem("pwa_location_denied");
    this.notifyChanged();
    return { position, snapshot: await this.getSnapshot() };
  }

  async repairPushSubscription(email) {
    if (!email || !webPushHelper.isSupported() || Notification.permission !== "granted") return;
    if (!await webPushHelper.isSubscribed()) {
      await webPushHelper.registerAndSubscribe(email);
      this.notifyChanged();
    }
  }

  notifyChanged() {
    window.dispatchEvent(new CustomEvent(PERMISSION_EVENT));
  }

  watch(callback) {
    const refresh = () => callback();
    window.addEventListener(PERMISSION_EVENT, refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    let geoStatus;
    navigator.permissions?.query?.({ name: "geolocation" })
      .then((status) => {
        geoStatus = status;
        geoStatus.addEventListener?.("change", refresh);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener(PERMISSION_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      geoStatus?.removeEventListener?.("change", refresh);
    };
  }
}

export const pwaPermissionService = new PWAPermissionService();
export { PWAPermissionService, LOCATION_GRANT_KEY };
