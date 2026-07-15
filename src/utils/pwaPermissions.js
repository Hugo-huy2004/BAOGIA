// PWA Permission Auto-Setup: silently enable weather, location, and push
// notifications for a seamless app-like experience.
import { getCachedGeolocation } from "./geoCache.js";

function isStandalonePWA() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export async function autoBluePrintPWAPermissions() {
  if (!isStandalonePWA()) return;

  // Chặn việc lặp lại xin quyền liên tục trong cùng một phiên làm việc (session)
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pwa_perms_checked") === "true") {
    return;
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("pwa_perms_checked", "true");
  }

  // 1. Lấy vị trí thông qua cache (nếu đã đồng ý thì không hiện popup, nếu từ chối cũng không hỏi lại)
  getCachedGeolocation().catch(() => {});

  // 2. Tự động bật thông báo đẩy (chỉ hỏi 1 lần duy nhất mỗi phiên)
  if ("Notification" in window && Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted" && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.pushManager) {
          registration.pushManager
            .getSubscription()
            .then((sub) => {
              if (!sub) {
                // Sẽ được PWARealtimeBridge đăng ký khi phát hiện quyền granted
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      /* ignore errors */
    }
  }
}
