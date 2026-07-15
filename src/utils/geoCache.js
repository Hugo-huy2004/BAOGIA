// Geolocation Cache and Debouncer
// Consolidates multiple geolocation calls to prevent parallel browser prompts
// Caches location for 10 minutes and silences requests if permission is denied in current session.

let cachedPos = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let pendingPromise = null;

export function getCachedGeolocation() {
  if (cachedPos && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    return Promise.resolve(cachedPos);
  }

  // Avoid spamming if user previously blocked permission in this session
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pwa_location_denied") === "true") {
    return Promise.reject(new Error("Geolocation request ignored due to session-level block"));
  }

  if (pendingPromise) return pendingPromise;

  pendingPromise = new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        cachedPos = {
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          }
        };
        lastFetchTime = Date.now();
        pendingPromise = null;
        resolve(cachedPos);
      },
      (err) => {
        pendingPromise = null;
        if (err.code === err.PERMISSION_DENIED) {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("pwa_location_denied", "true");
          }
        }
        reject(err);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: CACHE_DURATION }
    );
  });

  return pendingPromise;
}
