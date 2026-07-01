/**
 * Anomalous-login guard: opt-in via the browser's native geolocation prompt.
 * First successful reading becomes the member's "trusted" location.
 * Later readings further than 50 km trigger onAnomaly callback instead of
 * forcing an immediate logout — this prevents the infinite re-login loop
 * that occurred when a user legitimately travels and the old trusted
 * location is never reset.
 */
import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const apiBase = import.meta.env.VITE_API_URL || "/api";
const locationCheckLocks = new Map();
const LOCATION_CHECK_COOLDOWN_MS = 15_000;

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
    if (!enabled || !email || typeof navigator === "undefined" || !navigator.geolocation) return;

    const runCheck = () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
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
        },
        () => { checkingRef.current = false; },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
      );
    };

    runCheck();
    const tid = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => clearInterval(tid);
  }, [enabled, email]);
}
