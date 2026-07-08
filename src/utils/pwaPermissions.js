// PWA Permission Auto-Setup: silently enable weather, location, and push
// notifications for a seamless app-like experience.

function isStandalonePWA() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

export async function autoBluePrintPWAPermissions() {
  if (!isStandalonePWA()) return;

  // 1. Auto-enable geolocation for weather (silent, no prompt if already granted)
  if (navigator.geolocation && Notification.permission !== "denied") {
    navigator.geolocation.getCurrentPosition(
      () => {}, // Success: location acquired, weather will use it
      () => {}, // Error: fall back to IP geolocation
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 10 * 60 * 1000 }
    );
  }

  // 2. Auto-enable push notifications (only if not already denied)
  if ("Notification" in window && Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted" && "serviceWorker" in navigator) {
        // Immediately subscribe if granted
        const registration = await navigator.serviceWorker.ready;
        if (registration.pushManager) {
          registration.pushManager
            .getSubscription()
            .then((sub) => {
              if (!sub) {
                // Will be subscribed by PWARealtimeBridge when it detects permission: granted
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
