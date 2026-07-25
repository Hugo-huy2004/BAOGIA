import React, { useState, useEffect, Suspense, useCallback } from "react";
import { createPortal } from "react-dom";
import GAME_THEMES from "./gameThemes";
import { DIFFICULTIES, HOW_TO_PLAY } from "./arcadeConstants";
import { submitScore } from "../../../services/arcadeApi";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";

// ─── Per-game lazy imports ─────────────────────────────────────────
const GAME_COMPONENTS = {
  chess:     React.lazy(() => import("../../../pages/public/ChessPage")),
  survivor:  React.lazy(() => import("./GameSpaceSurvivor")),
  flappy:    React.lazy(() => import("./GameFlappyCyber")),
  tetris:    React.lazy(() => import("./GameTetris")),
  "2048":    React.lazy(() => import("./Game2048")),
  caro:      React.lazy(() => import("./GameCaro")),
  wordguess: React.lazy(() => import("./GameWordGuess")),
  snake:     React.lazy(() => import("./GameSnake")),
};

// ─── Difficulty card colors ────────────────────────────────────────
const DIFF_COLORS = {
  easy:   { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", text: "#34d399", glow: "0 6px 20px rgba(16,185,129,0.2)" },
  medium: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", text: "#fbbf24", glow: "0 6px 20px rgba(245,158,11,0.2)" },
  hard:   { bg: "rgba(244,63,94,0.12)",  border: "rgba(244,63,94,0.35)",  text: "#fb7185", glow: "0 6px 20px rgba(244,63,94,0.2)" },
};

// ─── Result config ─────────────────────────────────────────────────
const RESULT_CONFIG = {
  win:  { label: "CHIẾN THẮNG", icon: "emoji_events", color: "#fbbf24" },
  lose: { label: "THỬ LẠI",    icon: "refresh",       color: "#fb7185" },
  draw: { label: "HÒA",         icon: "handshake",     color: "#38bdf8" },
};

const css = `
@keyframes agsFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes agsSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes agsScaleIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes agsPulse { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
@keyframes agsShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes agsSpin { to { transform: rotate(360deg); } }
`;

export default function StandaloneGameShell({ gameId, bio, onBioUpdate, onClose }) {
  const theme = GAME_THEMES[gameId] || GAME_THEMES["2048"];
  const GameComp = GAME_COMPONENTS[gameId];
  const sound = useArcadeSound();

  const [stage, setStage] = useState("select"); // select | playing | result
  const [difficulty, setDifficulty] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [playKey, setPlayKey] = useState(0);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSelectDifficulty = useCallback((diffId) => {
    sound.playBeep();
    setDifficulty(diffId);
    setStage("playing");
  }, [sound]);

  const handleGameOver = useCallback(async (score, result) => {
    if (result === "win") {
      sound.playWin();
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      });
    } else {
      sound.playLose();
    }

    try {
      const res = await submitScore(gameId, { score, difficulty, result }, bio);
      setResultData({
        score,
        result,
        joyDelta: res?.joyDelta ?? 0,
        joyAwarded: res?.joyAwarded ?? false,
      });
    } catch {
      setResultData({ score, result, joyDelta: 0, joyAwarded: false });
    }
    setStage("result");
    if (bio?.email) useJoyStore.getState().fetchBalance(bio.email);
  }, [gameId, difficulty, bio, sound]);

  const handleReplay = useCallback(() => {
    sound.playBeep();
    setPlayKey((k) => k + 1);
    setStage("playing");
    setResultData(null);
  }, [sound]);

  const handleChangeDifficulty = useCallback(() => {
    sound.playBeep();
    setDifficulty(null);
    setResultData(null);
    setStage("select");
  }, [sound]);

  const handleClose = useCallback(() => {
    if (stage === "playing") {
      setStage("result");
      setResultData({ score: 0, result: "lose", joyDelta: 0, joyAwarded: false });
      return;
    }
    onClose?.();
  }, [stage, onClose]);

  if (!GameComp) return null;

  const objectives = HOW_TO_PLAY[gameId]?.objective || {};

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: theme.gradient,
      display: "flex", flexDirection: "column",
      animation: "agsFadeIn .25s ease",
      overflow: "hidden",
    }}>
      <style>{css}</style>

      {/* ── Ambient background particles ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            width: 2, height: 2, borderRadius: "50%",
            background: theme.accent,
            opacity: 0.15 + (i % 3) * 0.1,
            animation: `agsPulse ${2.5 + (i % 4)}s ease-in-out ${(i % 5) * 0.5}s infinite`,
          }} />
        ))}
      </div>

      {/* ── Status bar (top accent line) ── */}
      <div style={{ height: 3, background: theme.statusBar, flexShrink: 0, position: "relative", zIndex: 2 }} />

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 16px",
        background: theme.headerBg,
        borderBottom: `1px solid ${theme.accent}22`,
        flexShrink: 0,
        position: "relative", zIndex: 2,
        backdropFilter: "blur(12px)",
      }}>
        <button onClick={handleClose} style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff", flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {theme.name}
          </p>
          {difficulty && (
            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: theme.accent, letterSpacing: ".1em", textTransform: "uppercase" }}>
              {DIFFICULTIES.find(d => d.id === difficulty)?.label || difficulty}
            </p>
          )}
        </div>
        {bio && (
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 999,
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#fbbf24", fontVariationSettings: "'FILL' 1" }}>toll</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", fontVariantNumeric: "tabular-nums" }}>
              {(bio.joyBalance ?? 0).toLocaleString("vi-VN")}
            </span>
          </div>
        )}
      </div>

      {/* ── Stage: Select Difficulty ── */}
      {stage === "select" && (
        <div style={{
          flex: 1, overflow: "auto",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "24px 20px 40px",
          position: "relative", zIndex: 1,
        }}>
          {/* Game icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `${theme.accent}18`,
            border: `1.5px solid ${theme.accent}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
            boxShadow: `0 8px 30px ${theme.accentGlow}`,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 36, color: theme.accent, fontVariationSettings: "'FILL' 1" }}>
              {theme.icon}
            </span>
          </div>

          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", textAlign: "center" }}>
            Chọn Độ Khó
          </h2>
          <p style={{ margin: "6px 0 20px", fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 300 }}>
            {HOW_TO_PLAY[gameId]?.rule || "Chọn độ khó để bắt đầu chơi."}
          </p>

          {/* Difficulty cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 400 }}>
            {DIFFICULTIES.map((d) => {
              const dc = DIFF_COLORS[d.id];
              const locked = d.id !== "easy" && !bio?.featureSubscriptions?.hugoArcade?.active;
              return (
                <button
                  key={d.id}
                  onClick={() => !locked && handleSelectDifficulty(d.id)}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 16,
                    background: locked ? "rgba(255,255,255,0.03)" : dc.bg,
                    border: `1.5px solid ${locked ? "rgba(255,255,255,0.08)" : dc.border}`,
                    cursor: locked ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 14,
                    textAlign: "left",
                    boxShadow: locked ? "none" : dc.glow,
                    opacity: locked ? 0.5 : 1,
                    transition: "transform .15s, box-shadow .15s",
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: locked ? "rgba(255,255,255,0.05)" : `${dc.text}20`,
                    border: `1px solid ${locked ? "rgba(255,255,255,0.1)" : `${dc.text}40`}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: locked ? "#666" : dc.text }}>
                      {locked ? "lock" : d.id === "easy" ? "bolt" : d.id === "medium" ? "local_fire_department" : "military_tech"}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{d.label}</span>
                      {d.id === "medium" && !locked && (
                        <span style={{ fontSize: 8, fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.15)", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".08em" }}>Đề xuất</span>
                      )}
                      {locked && (
                        <span style={{ fontSize: 8, fontWeight: 800, color: "#fb7185", background: "rgba(244,63,94,0.15)", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".08em" }}>Cần Pro</span>
                      )}
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                      {objectives[d.id] || d.description}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: locked ? "#555" : dc.text, fontVariantNumeric: "tabular-nums" }}>
                      {locked ? "???" : `+${d.win}`}
                    </span>
                    <span style={{ display: "block", fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em" }}>JOY</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pro upsell */}
          {!bio?.featureSubscriptions?.hugoArcade?.active && (
            <div style={{
              marginTop: 16, padding: "10px 14px", borderRadius: 12,
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
              display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 400,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#fbbf24" }}>workspace_premium</span>
              <span style={{ fontSize: 11, color: "rgba(251,191,36,0.8)", flex: 1 }}>Mở khóa Bứt Phá &amp; Huyền Thoại</span>
            </div>
          )}
        </div>
      )}

      {/* ── Stage: Playing ── */}
      {stage === "playing" && (
        <div key={playKey} style={{
          flex: 1, overflow: "auto",
          display: "flex", justifyContent: "center", alignItems: "flex-start",
          position: "relative", zIndex: 1,
        }}>
          <Suspense fallback={
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
              <div style={{ width: 36, height: 36, border: `3px solid ${theme.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "agsSpin .8s linear infinite" }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: ".1em", textTransform: "uppercase" }}>Đang tải...</p>
            </div>
          }>
            <GameComp
              difficulty={difficulty}
              onGameOver={handleGameOver}
              sound={sound}
            />
          </Suspense>
        </div>
      )}

      {/* ── Stage: Result ── */}
      {stage === "result" && resultData && (
        <div style={{
          flex: 1, overflow: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24,
          position: "relative", zIndex: 1,
        }}>
          <div style={{
            width: "100%", maxWidth: 360,
            background: "rgba(0,0,0,0.6)",
            border: `1.5px solid ${RESULT_CONFIG[resultData.result]?.color || "#fff"}33`,
            borderRadius: 24,
            padding: "28px 24px",
            textAlign: "center",
            animation: "agsScaleIn .3s cubic-bezier(.16,1,.3,1)",
            backdropFilter: "blur(16px)",
          }}>
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: `${RESULT_CONFIG[resultData.result]?.color || "#fff"}15`,
              border: `2px solid ${RESULT_CONFIG[resultData.result]?.color || "#fff"}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
              boxShadow: `0 0 30px ${RESULT_CONFIG[resultData.result]?.color || "#fff"}25`,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: RESULT_CONFIG[resultData.result]?.color || "#fff", fontVariationSettings: "'FILL' 1" }}>
                {RESULT_CONFIG[resultData.result]?.icon || "sports_score"}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: 9, fontWeight: 800, letterSpacing: ".15em", textTransform: "uppercase", color: RESULT_CONFIG[resultData.result]?.color || "#fff", opacity: 0.7 }}>
              HugoArcade
            </p>
            <h2 style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 900, color: "#fff" }}>
              {RESULT_CONFIG[resultData.result]?.label || "HOÀN THÀNH"}
            </h2>

            {/* Score */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              margin: "14px 0",
            }}>
              <span style={{
                padding: "5px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 12, fontWeight: 800, color: "#fff", fontVariantNumeric: "tabular-nums",
              }}>
                {resultData.score?.toLocaleString("vi-VN")} điểm
              </span>
            </div>

            {/* JOY earned */}
            <div style={{
              padding: "12px 16px", borderRadius: 14,
              background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
              margin: "12px 0 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fbbf24", fontVariationSettings: "'FILL' 1" }}>toll</span>
                <span style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24", fontVariantNumeric: "tabular-nums" }}>
                  {resultData.joyDelta > 0 ? "+" : ""}{resultData.joyDelta || 0}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(251,191,36,0.7)" }}>JOY</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleChangeDifficulty} style={{
                flex: 1, padding: "12px 0", borderRadius: 12,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 800, cursor: "pointer",
              }}>
                Đổi Độ Khó
              </button>
              <button onClick={handleReplay} style={{
                flex: 2, padding: "12px 0", borderRadius: 12,
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}cc)`,
                border: "none",
                color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer",
                boxShadow: `0 4px 16px ${theme.accentGlow}`,
              }}>
                Chơi Lại
              </button>
            </div>

            {/* Close button */}
            <button onClick={onClose} style={{
              marginTop: 10, padding: "8px 0", width: "100%", borderRadius: 10,
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}>
              Đóng game
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
