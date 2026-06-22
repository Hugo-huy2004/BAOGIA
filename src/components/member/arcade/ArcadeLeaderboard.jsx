import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchLeaderboard } from "../../../services/arcadeApi";

// Generalized from ChessLobby.jsx's local Leaderboard component (same 8s poll +
// visibilitychange refetch + manual refresh pattern), parameterized by `game`.
export default function ArcadeLeaderboard({ game, active = true }) {
  const [lb, setLb] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const intervalRef = useRef(null);

  const fetchLb = useCallback(async (manual = false) => {
    if (manual) setSpinning(true);
    const list = await fetchLeaderboard(game, 30);
    setLb(list);
    setLoading(false);
    if (manual) setTimeout(() => setSpinning(false), 600);
  }, [game]);

  useEffect(() => {
    if (!active) { clearInterval(intervalRef.current); return; }
    setLoading(true);
    fetchLb();
    intervalRef.current = setInterval(fetchLb, 8000);
    return () => clearInterval(intervalRef.current);
  }, [active, game, fetchLb]);

  useEffect(() => {
    if (!active) return;
    const onVisible = () => { if (!document.hidden) fetchLb(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, fetchLb]);

  if (loading) {
    return (
      <div className="py-10 flex justify-center">
        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-700 border-t-zinc-700 dark:border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Bảng Xếp Hạng</span>
        <button
          onClick={() => fetchLb(true)}
          disabled={spinning}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        >
          <span className={`material-symbols-outlined text-sm ${spinning ? "animate-spin" : ""}`}>refresh</span>
        </button>
      </div>

      {lb.length === 0 ? (
        <div className="py-10 text-center text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl">
          Chưa có người chơi nào
        </div>
      ) : (
        <div className="bg-white dark:bg-[#12111a] border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden">
          {lb.map((p, i) => (
            <div
              key={p.email || i}
              className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0"
            >
              <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                {i === 0 ? (
                  <span className="material-symbols-outlined text-[13px] text-amber-500">emoji_events</span>
                ) : (
                  <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400">{i + 1}</span>
                )}
              </div>
              <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center shrink-0 overflow-hidden text-[10px] font-bold">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.displayName} className="w-full h-full object-cover" />
                ) : (
                  (p.displayName ? p.displayName[0].toUpperCase() : "?")
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{p.displayName || "Ẩn danh"}</p>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-400">{p.gamesPlayed} lượt chơi</p>
              </div>
              <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 font-mono shrink-0">{p.bestScore}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
