/**
 * Anomalous-login guard: opt-in via the browser's native geolocation prompt.
 * First successful reading becomes the member's "trusted" location.
 * Later readings further than 50 km trigger onAnomaly callback instead of
 * forcing an immediate logout — this prevents the infinite re-login loop
 * that occurred when a user legitimately travels and the old trusted
 * location is never reset.
 */
import { useEffect, useRef } from "react";
import { getCachedGeolocation } from "../utils/geoCache.js";
import { getMemberToken } from "../services/authSession.js";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const apiBase = import.meta.env.VITE_API_URL || "/api";
const locationCheckLocks = new Map();
const LOCATION_CHECK_COOLDOWN_MS = 15_000;
const LOCATION_GRANT_KEY = "hugo:pwa:location-granted:v1";

const getLocationCheckKey = (email, lat, lng) => {
  const roundedLat = Number(lat).toFixed(3);
  const roundedLng = Number(lng).toFixed(3);
  return `${email.trim().toLowerCase()}|${roundedLat}|${roundedLng}`;
};

export function useLocationGuard({ email, enabled = true, onAnomaly }) {
  const checkingRef = useRef(false);
  const onAnomalyRef = useRef(onAnomaly);
  useEffect(() => { onAnomalyRef.current = onAnomaly; }, [onAnomaly]);

  useEffect(() => {
    if (!enabled || !email || email.includes("guest") || !getMemberToken()) return;

    const hasLocationPermission = async () => {
      try {
        if (navigator.permissions?.query) {
          const permission = await navigator.permissions.query({ name: "geolocation" });
          return permission.state === "granted";
        }
      } catch {
        // Safari does not always expose geolocation through Permissions API.
      }
      return localStorage.getItem(LOCATION_GRANT_KEY) === "true";
    };

    const runCheck = async () => {
      if (checkingRef.current) return;
      if (!await hasLocationPermission()) return;
      checkingRef.current = true;

      getCachedGeolocation()
        .then(async (pos) => {
          try {
            const locationKey = getLocationCheckKey(email, pos.coords.latitude, pos.coords.longitude);
            const lastRunAt = locationCheckLocks.get(locationKey) || 0;
            if (Date.now() - lastRunAt < LOCATION_CHECK_COOLDOWN_MS) {
              return;
            }
            locationCheckLocks.set(locationKey, Date.now());

            const res = await fetch(`${apiBase}/bios/me/check-location`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                email,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              }),
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data?.anomaly && onAnomalyRef.current) {
              onAnomalyRef.current({
                distanceKm: data.distanceKm,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            }
          } catch (_) {
            // Network failure — fail open, never block on connectivity issues.
          } finally {
            checkingRef.current = false;
          }
        })
        .catch(() => {
          checkingRef.current = false;
        });
    };

    runCheck();
    const tid = setInterval(runCheck, CHECK_INTERVAL_MS);
    const handlePermissionUpdate = () => runCheck();
    window.addEventListener("hugo:permissions-updated", handlePermissionUpdate);
    return () => {
      clearInterval(tid);
      window.removeEventListener("hugo:permissions-updated", handlePermissionUpdate);
    };
  }, [enabled, email]);
}
