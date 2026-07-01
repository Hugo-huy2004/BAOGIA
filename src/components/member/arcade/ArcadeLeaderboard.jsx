import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchLeaderboard } from "../../../services/arcadeApi";

function AvatarInitials({ name, url }) {
  if (url) {
    return <div className="arc-lb-avatar" style={{ padding: 0 }}>
      <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
    </div>;
  }
  const initials = (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return <div className="arc-lb-avatar">{initials}</div>;
}

const RANK_LABEL = { 0: "01", 1: "02", 2: "03" };

export default function ArcadeLeaderboard({ game, active = true }) {
  const [lb, setLb]             = useState([]);
  const [loading, setLoading]   = useState(true);
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
      <div style={{ padding: "64px 0", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 24, height: 24, border: "2px solid var(--arc-b2)", borderTopColor: "var(--arc-a)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 900, letterSpacing: ".15em", color: "var(--arc-t3)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--arc-t3)", display: "inline-block" }} />
          LIVE RANKING
        </div>
        <button
          onClick={() => fetchLb(true)}
          disabled={spinning}
          style={{
            fontSize: 10, fontWeight: 800, color: "var(--arc-t2)",
            padding: "5px 10px", borderRadius: 7, border: "1px solid var(--arc-b1)",
            background: "var(--arc-s2)", transition: ".15s",
            opacity: spinning ? .5 : 1, display: "flex", alignItems: "center", gap: 4,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 12, display: "block" }}>refresh</span>
          Cập nhật
        </button>
      </div>

      {lb.length === 0 ? (
        <div className="arc-lb-empty">Chưa có người chơi nào.<br />Hãy là người đầu tiên!</div>
      ) : (
        <div className="arc-lb">
          {lb.map((p, i) => {
            const record = p.record || { easy: { wins: 0 }, medium: { wins: 0 }, hard: { wins: 0 } };
            const isTop3 = i < 3;

            return (
              <div key={p.email || i} className={`arc-lb-row${i === 0 ? " rank-1" : i === 1 ? " rank-2" : ""}`}>
                <div className={`arc-lb-rank${i < 3 ? ` rank-${i + 1}` : ""}`}>
                  {RANK_LABEL[i] ?? i + 1}
                </div>
                <AvatarInitials name={p.displayName} url={p.avatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="arc-lb-name">{p.displayName || "Ẩn danh"}</div>
                  <div className="arc-lb-plays">{p.gamesPlayed} ván</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginRight: 8 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--arc-t3)" }} title="Thắng Khởi động">
                    E·{record.easy?.wins || 0}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--arc-t2)" }} title="Thắng Bứt phá">
                    M·{record.medium?.wins || 0}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: isTop3 ? "var(--arc-t1)" : "var(--arc-t2)" }} title="Thắng Huyền thoại">
                    H·{record.hard?.wins || 0}
                  </span>
                </div>
                <div className="arc-lb-score">{p.bestScore.toLocaleString("vi-VN")}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
