/**
 * Anomalous-login guard: opt-in via the browser's native geolocation prompt
 * (no custom consent UI needed — the permission prompt itself is the
 * consent). The first successful reading becomes the member's "trusted"
 * location; later readings further than 50km away force a logout + redirect
 * to /login, so a stolen/shared session token can't be used far from where
 * the member normally is.
 */
import { useEffect, useRef } from "react";
import { logoutAuth } from "../services/authSession";

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // re-check every 15 min while the app is open

export function useLocationGuard({ email, enabled = true, onAnomaly }) {
  const checkingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !email || typeof navigator === "undefined" || !navigator.geolocation) return;

    const apiBase = import.meta.env.VITE_API_URL || "/api";

    const runCheck = () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(`${apiBase}/bios/me/check-location`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                email,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              })
            });
            const data = await res.json();
            if (data?.anomaly) {
              if (onAnomaly) {
                onAnomaly({ distanceKm: data.distanceKm, lat: pos.coords.latitude, lng: pos.coords.longitude });
              } else {
                await logoutAuth();
                window.location.href = "/login?reason=location_anomaly";
              }
            }
          } catch (_) {
            // Network failure — fail open (never block login over connectivity issues).
          } finally {
            checkingRef.current = false;
          }
        },
        () => { checkingRef.current = false; }, // permission denied / unavailable — fail open, no guard possible
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    };

    runCheck();
    const tid = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => clearInterval(tid);
  }, [enabled, email, onAnomaly]);
}
