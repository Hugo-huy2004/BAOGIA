/**
 * Tracks "active" companion (HugoPSY) usage and sends a heartbeat
 * every 30s while the tab is visible and the user has interacted recently.
 * The backend converts confirmed active time into +10 JOY per 10 minutes,
 * capped at 60 JOY/day — see POST /api/companion/heartbeat.
 */
import { useEffect, useRef } from "react";

const HEARTBEAT_MS = 30_000;
const IDLE_TIMEOUT_MS = 60_000;
const ACTIVITY_THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "touchstart", "pointerdown", "scroll"];

export function useCompanionSessionTimer({ email, enabled = true }) {
  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);

  useEffect(() => {
    if (!enabled || !email) return;

    const markActive = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
      lastThrottleRef.current = now;
      lastActivityRef.current = now;
    };

    ACTIVITY_EVENTS.forEach(evt => document.addEventListener(evt, markActive, { passive: true }));
    markActive();

    const apiBase = import.meta.env.VITE_API_URL || "/api";
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) return;
      fetch(`${apiBase}/companion/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      }).catch(() => {});
    };

    const interval = setInterval(tick, HEARTBEAT_MS);

    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach(evt => document.removeEventListener(evt, markActive));
    };
  }, [email, enabled]);
}

export default useCompanionSessionTimer;
