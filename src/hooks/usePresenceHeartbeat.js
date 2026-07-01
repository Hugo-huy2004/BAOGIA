/**
 * Sends a lightweight heartbeat while the member portal tab is visible, so the
 * backend can mark the member "online" (Redis key, ~90s TTL) and flip today's
 * active-user bit (Redis bitmap). See server/utils/presenceService.js.
 */
import { useEffect, useRef } from "react";

const HEARTBEAT_MS = 45_000;
const apiBase = import.meta.env.VITE_API_URL || "/api";
const lastHeartbeatAtByEmail = new Map();

export function usePresenceHeartbeat(email) {
  const nextRetryAtRef = useRef(0);
  const failCountRef = useRef(0);

  useEffect(() => {
    if (!email) return;

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      if (!navigator.onLine) return;
      if (Date.now() < nextRetryAtRef.current) return;

      const normalizedEmail = email.trim().toLowerCase();
      const lastSentAt = lastHeartbeatAtByEmail.get(normalizedEmail) || 0;
      if (Date.now() - lastSentAt < 10_000) return;
      lastHeartbeatAtByEmail.set(normalizedEmail, Date.now());

      fetch(`${apiBase}/presence/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      }).then((res) => {
        if (!res.ok) throw new Error(`heartbeat ${res.status}`);
        failCountRef.current = 0;
        nextRetryAtRef.current = 0;
      }).catch(() => {
        failCountRef.current += 1;
        const backoffMs = Math.min(10 * 60_000, HEARTBEAT_MS * failCountRef.current);
        nextRetryAtRef.current = Date.now() + backoffMs;
      });
    };

    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [email]);
}

export default usePresenceHeartbeat;
