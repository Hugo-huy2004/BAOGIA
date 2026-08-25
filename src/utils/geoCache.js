// Geolocation Cache and Debouncer
// Single entry point for every geolocation read in the app.
// Caches location for 10 minutes and silences requests if permission is denied in current session.

let cachedPos = null;
let lastFetchTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let pendingPromise = null;
const LOCATION_GRANT_KEY = "hugo:pwa:location-granted:v1";

// Only an explicit user action may trigger the native prompt ({ ask: true } —
// the permission onboarding button). Every other caller reads silently and
// gives up when permission isn't granted yet; otherwise whichever component
// mounted first (weather layer, map) re-prompted on every
// single PWA launch.
async function permissionGranted() {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    if (status) return status.state === "granted";
  } catch {
    // Safari does not always expose geolocation through the Permissions API.
  }
  return typeof localStorage !== "undefined" && localStorage.getItem(LOCATION_GRANT_KEY) === "true";
}

// { fresh: true } bypasses the cache and requests a high-accuracy GPS fix.
export async function getCachedGeolocation({ fresh = false, ask = false } = {}) {
  if (!fresh && cachedPos && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    return cachedPos;
  }

  // Avoid spamming if user previously blocked permission in this session
  if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pwa_location_denied") === "true") {
    throw new Error("Geolocation request ignored due to session-level block");
  }

  if (!ask && !(await permissionGranted())) {
    throw new Error("Geolocation permission not granted yet");
  }

  if (pendingPromise) return pendingPromise;

  const tryGetPosition = (options) => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        (err) => reject(err),
        options
      );
    });
  };

  pendingPromise = (async () => {
    try {
      const options = fresh
        ? { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        : { enableHighAccuracy: false, timeout: 6000, maximumAge: CACHE_DURATION };

      let pos;
      try {
        pos = await tryGetPosition(options);
      } catch (err) {
        // If high-accuracy or short-timeout failed on macOS / desktop (kCLErrorLocationUnknown / POSITION_UNAVAILABLE), retry with low accuracy
        if (fresh && (err.code === 2 || err.code === 3 || err.code === err?.POSITION_UNAVAILABLE)) {
          pos = await tryGetPosition({ enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
        } else {
          throw err;
        }
      }

      cachedPos = {
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }
      };
      lastFetchTime = Date.now();
      return cachedPos;
    } catch (err) {
      if (err?.code === err?.PERMISSION_DENIED) {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("pwa_location_denied", "true");
        }
      }
      throw err;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}
