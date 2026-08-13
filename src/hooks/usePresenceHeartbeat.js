import { useEffect, useRef } from "react";
import { getMemberToken } from "../services/authSession";

const HEARTBEAT_COOLDOWN_MS = 5 * 60_000;
const apiBase = import.meta.env.VITE_API_URL || "/api";
const lastHeartbeatAtByEmail = new Map();

export function usePresenceHeartbeat(email) {
  const nextRetryAtRef = useRef(0);
  const failCountRef = useRef(0);
  const sentCountRef = useRef(0);

  useEffect(() => {
    if (!email) return;

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      if (!navigator.onLine) return;
      if (Date.now() < nextRetryAtRef.current) return;
      if (sentCountRef.current >= 2) return;

      const token = getMemberToken();
      if (!token) return; // Suppress ping when unauthenticated

      const normalizedEmail = email.trim().toLowerCase();
      const lastSentAt = lastHeartbeatAtByEmail.get(normalizedEmail) || 0;
      if (Date.now() - lastSentAt < HEARTBEAT_COOLDOWN_MS) return;
      lastHeartbeatAtByEmail.set(normalizedEmail, Date.now());
      sentCountRef.current += 1;

      fetch(`${apiBase}/presence/heartbeat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      }).then((res) => {
        if (res.status === 401) {
          // Suppress 401 spam by backing off for 10 minutes
          nextRetryAtRef.current = Date.now() + 600_000;
          return;
        }
        if (!res.ok) throw new Error(`heartbeat ${res.status}`);
        failCountRef.current = 0;
        nextRetryAtRef.current = 0;
      }).catch(() => {
        failCountRef.current += 1;
        const backoffMs = Math.min(10 * 60_000, HEARTBEAT_COOLDOWN_MS * failCountRef.current);
        nextRetryAtRef.current = Date.now() + backoffMs;
      });
    };

    ping();
    document.addEventListener("visibilitychange", ping);

    return () => {
      document.removeEventListener("visibilitychange", ping);
    };
  }, [email]);
}

export default usePresenceHeartbeat;
