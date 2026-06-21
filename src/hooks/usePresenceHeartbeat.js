/**
 * Sends a lightweight heartbeat while the member portal tab is visible, so the
 * backend can mark the member "online" (Redis key, ~90s TTL) and flip today's
 * active-user bit (Redis bitmap). See server/utils/presenceService.js.
 */
import { useEffect } from "react";

const HEARTBEAT_MS = 45_000;
const apiBase = import.meta.env.VITE_API_URL || "/api";

export function usePresenceHeartbeat(email) {
  useEffect(() => {
    if (!email) return;

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      fetch(`${apiBase}/presence/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      }).catch(() => {});
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
