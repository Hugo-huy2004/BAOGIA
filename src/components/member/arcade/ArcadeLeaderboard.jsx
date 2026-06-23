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
        <div className="w-5 h-5 border-2 border-white/10 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="arcade-leaderboard space-y-3">
      <div className="arcade-lb-title flex items-center justify-between px-0.5">
        <div><span>LIVE RANKING</span><h3>Bảng xếp hạng</h3></div>
        <button
          onClick={() => fetchLb(true)}
          disabled={spinning}
          className={`arcade-lb-refresh ${spinning ? "animate-spin" : ""}`}
        >
          ↻
        </button>
      </div>

      {lb.length === 0 ? (
        <div className="py-10 text-center text-slate-500 text-xs bg-white/[.025] rounded-2xl border border-white/[.06]">
          Chưa có người chơi nào
        </div>
      ) : (
        <div className="arcade-lb-list">
          {lb.map((p, i) => (
            <div
              key={p.email || i}
              className={`arcade-lb-row ${i < 3 ? `top-${i+1}` : ""}`}
            >
              <div className={`arcade-rank-number ${i === 0 ? "is-top" : ""}`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="arcade-lb-name">{p.displayName || "Ẩn danh"}</p>
                <p className="arcade-lb-games">{p.gamesPlayed} lượt chơi</p>
              </div>
              <p className="arcade-lb-score">{p.bestScore.toLocaleString("vi-VN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
