import React, { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function formatMinutes(totalMinutes) {
  if (totalMinutes <= 0) return "0:00";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m < 10 ? "0" : ""}${m}`;
}

export default function RadioTokenStatus({ bio, onBuyMore }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!bio?.email) return;
    try {
      const res = await fetch(`${API_BASE}/radio/token-status?email=${encodeURIComponent(bio.email)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {}
    setLoading(false);
  }, [bio?.email]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading || !status) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#0e0f17]/90 border border-zinc-200/80 dark:border-white/10 animate-pulse">
        <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        <div className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  const { freeRemaining, freeUsed, freeMinutes, purchasedMinutes, canListen } = status;
  const freePercent = freeMinutes > 0 ? Math.round((freeRemaining / freeMinutes) * 100) : 0;
  const isLow = freeRemaining <= 30 && freeRemaining > 0;
  const isEmpty = !canListen;

  return (
    <div className={`flex flex-col gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-xl transition-all ${
      isEmpty
        ? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-400/40 text-rose-600 dark:text-rose-400"
        : isLow
          ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-400/40 text-amber-700 dark:text-amber-400"
          : "bg-zinc-100 dark:bg-[#0e0f17]/90 border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white"
    }`}>
      {/* Free pool */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
          <span className="text-[11px] font-black tracking-wide uppercase">
            {isEmpty ? "Hết thời gian" : "Tuần này"}
          </span>
        </div>
        <span className="font-mono text-sm font-black">
          {formatMinutes(freeRemaining)}
          <span className="text-[10px] font-bold opacity-50"> / {formatMinutes(freeMinutes)}</span>
        </span>
      </div>

      {/* Free pool progress bar */}
      <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isEmpty ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${freePercent}%` }}
        />
      </div>

      {/* Purchased pool */}
      {purchasedMinutes > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] opacity-60">shopping_bag</span>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Mua thêm</span>
          </div>
          <span className="font-mono text-xs font-bold">
            {formatMinutes(purchasedMinutes)}
          </span>
        </div>
      )}

      {/* Buy more button */}
      {onBuyMore && (
        <button
          onClick={onBuyMore}
          className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#06b6d4]/10 dark:bg-[#06b6d4]/20 text-[#06b6d4] text-[10px] font-black uppercase tracking-wider hover:bg-[#06b6d4]/20 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
          <span>Mua thêm thời gian</span>
        </button>
      )}
    </div>
  );
}

// Heartbeat hook — sends periodic time deductions while radio is playing.
export function useRadioHeartbeat(bio, isPlaying) {
  const [tokenStatus, setTokenStatus] = useState(null);
  const intervalRef = React.useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!bio?.email) return null;
    try {
      const res = await fetch(`${API_BASE}/radio/token-status?email=${encodeURIComponent(bio.email)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTokenStatus(data);
        return data;
      }
    } catch {}
    return null;
  }, [bio?.email]);

  // Send heartbeat (deduct 5 minutes)
  const sendHeartbeat = useCallback(async () => {
    if (!bio?.email) return null;
    try {
      const res = await fetch(`${API_BASE}/radio/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: bio.email, listeningMinutes: 5 }),
      });
      if (res.ok) {
        const data = await res.json();
        setTokenStatus(data);
        return data;
      }
    } catch {}
    return null;
  }, [bio?.email]);

  // Start/stop heartbeat interval
  useEffect(() => {
    if (isPlaying) {
      // Send first heartbeat immediately
      sendHeartbeat();
      // Then every 5 minutes
      intervalRef.current = setInterval(() => {
        sendHeartbeat();
      }, 5 * 60 * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, sendHeartbeat]);

  // Initial fetch on mount
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { tokenStatus, refetch: fetchStatus, sendHeartbeat };
}
