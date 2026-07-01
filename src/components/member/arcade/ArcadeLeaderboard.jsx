import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchLeaderboard } from "../../../services/arcadeApi";

function AvatarInitials({ name, url }) {
  if (url) {
    return <img src={url} alt={name} className="arc-lb-avatar" style={{ objectFit: "cover" }} />;
  }
  const initials = (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return <div className="arc-lb-avatar">{initials}</div>;
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default function ArcadeLeaderboard({ game, active = true }) {
  const [lb, setLb]           = useState([]);
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
      <div style={{ padding: "32px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.1)", borderTopColor: "var(--g,#7c3aed)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", display: "inline-block" }} />
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".14em", color: "var(--arc-t3)", textTransform: "uppercase" }}>Live Ranking</span>
        </div>
        <button
          onClick={() => fetchLb(true)}
          disabled={spinning}
          style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid var(--arc-b1)",
            background: "var(--arc-s2)", color: "var(--arc-t2)", fontSize: 13,
            display: "grid", placeItems: "center",
            animation: spinning ? "spin 1s linear infinite" : "none",
          }}
        >↻</button>
      </div>

      {lb.length === 0 ? (
        <div className="arc-lb-empty">Chưa có người chơi nào.<br />Hãy là người đầu tiên! 🏆</div>
      ) : (
        <div className="arc-lb">
          {lb.map((p, i) => (
            <div key={p.email || i} className={`arc-lb-row${i < 3 ? ` rank-${i+1}` : ""}`}>
              <div className="arc-lb-rank">
                {i < 3 ? RANK_MEDALS[i] : i + 1}
              </div>
              <AvatarInitials name={p.displayName} url={p.avatarUrl} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="arc-lb-name">{p.displayName || "Ẩn danh"}</p>
                <p className="arc-lb-plays">{p.gamesPlayed} lượt chơi</p>
              </div>
              <p className="arc-lb-score">{p.bestScore.toLocaleString("vi-VN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
