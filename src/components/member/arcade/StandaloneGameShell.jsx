import React, { useState, useEffect, Suspense, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import GAME_THEMES from "./gameThemes";
import { DIFFICULTIES } from "./arcadeConstants";
import { submitScore } from "../../../services/arcadeApi";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import GameIntroScreen from "./GameIntroScreen";
import "./game-shell.css";

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

// Semantic outcome colours — deliberately palette-independent so a win never
// reads as a loss just because a game's accent happens to be red.
const RESULT_CONFIG = {
  win:  { icon: "emoji_events", color: "#16a66a" },
  lose: { icon: "refresh",      color: "#e94e72" },
  draw: { icon: "handshake",    color: "#ef8c17" },
};

export default function StandaloneGameShell({ gameId, bio, onBioUpdate, onClose }) {
  const { t } = useTranslation();
  const theme = GAME_THEMES[gameId] || GAME_THEMES["2048"];
  const GameComp = GAME_COMPONENTS[gameId];
  const sound = useArcadeSound();

  const [stage, setStage] = useState("intro"); // intro | playing | result
  const [difficulty, setDifficulty] = useState(null);
  const [paused, setPaused] = useState(false);
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
    setPaused(false);
    setStage("playing");
  }, [sound]);

  const handleGameOver = useCallback(async (score, result) => {
    setPaused(false);
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
    setPaused(false);
    setStage("playing");
    setResultData(null);
  }, [sound]);

  const handleChangeDifficulty = useCallback(() => {
    sound.playBeep();
    setDifficulty(null);
    setResultData(null);
    setPaused(false);
    setStage("intro");
  }, [sound]);

  // Leaving mid-match still records the loss — pausing is the safe exit, so
  // quitting from the pause screen must stay a deliberate, scored action.
  const handleQuit = useCallback(() => {
    setPaused(false);
    setStage("result");
    setResultData({ score: 0, result: "lose", joyDelta: 0, joyAwarded: false });
  }, []);

  // Back button pauses instead of instantly forfeiting — an accidental tap
  // used to cost the player the match.
  const handleBack = useCallback(() => {
    if (stage === "playing") {
      sound.playBeep();
      setPaused(true);
      return;
    }
    onClose?.();
  }, [stage, sound, onClose]);

  // Escape pauses; a backgrounded tab pauses too, so nobody loses a run to a
  // phone call.
  useEffect(() => {
    if (stage !== "playing") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); setPaused((p) => !p); }
    };
    const onHide = () => { if (document.hidden) setPaused(true); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [stage]);

  if (!GameComp) return null;

  const difficultyLabel = DIFFICULTIES.find((d) => d.id === difficulty)?.label || difficulty;
  const outcome = RESULT_CONFIG[resultData?.result] || RESULT_CONFIG.lose;

  return createPortal(
    <div className={`arcade-game arcade-game--${gameId}`}>
      {stage !== "intro" && <div className="gshell__aurora" aria-hidden="true" />}

      {/* ── Stage: Per-game introduction ── */}
      {stage === "intro" && (
        <GameIntroScreen
          gameId={gameId}
          isProActive={Boolean(bio?.featureSubscriptions?.hugoArcade?.active)}
          onSelectDifficulty={handleSelectDifficulty}
          onClose={onClose}
        />
      )}

      {stage !== "intro" && (
        <>
          <div className="gshell__status" />

          <header className="gshell__bar">
            <button type="button" className="gshell__icon-btn" onClick={handleBack} aria-label={t("arcadeGame.back")}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="gshell__title">
              <p>{theme.name}</p>
              {difficulty && <small>{difficultyLabel}</small>}
            </div>
            {bio && (
              <div className="gshell__joy" title={t("arcadeGame.joyBalance")}>
                <span className="material-symbols-outlined">toll</span>
                <b>{(bio.joyBalance ?? 0).toLocaleString("vi-VN")}</b>
              </div>
            )}
            {stage === "playing" && (
              <button
                type="button"
                className="gshell__icon-btn"
                onClick={() => { sound.playBeep(); setPaused((p) => !p); }}
                aria-label={t(paused ? "arcadeGame.resume" : "arcadeGame.pause")}
              >
                <span className="material-symbols-outlined">{paused ? "play_arrow" : "pause"}</span>
              </button>
            )}
          </header>
        </>
      )}

      {/* ── Stage: Playing ── */}
      {stage === "playing" && (
        <div key={playKey} className="gshell__stage">
          <Suspense fallback={
            <div className="gshell__loading">
              <div className="gshell__spinner" />
              <p>{t("arcadeGame.loading")}</p>
            </div>
          }>
            <GameComp
              difficulty={difficulty}
              paused={paused}
              onGameOver={handleGameOver}
              sound={sound}
            />
          </Suspense>
        </div>
      )}

      {/* ── Overlay: Pause ── */}
      {stage === "playing" && paused && (
        <div className="gshell__overlay" role="dialog" aria-modal="true" aria-label={t("arcadeGame.paused")}>
          <div className="gshell__card">
            <div className="gshell__badge">
              <span className="material-symbols-outlined">pause</span>
            </div>
            <p className="gshell__eyebrow">{theme.name}</p>
            <h2>{t("arcadeGame.paused")}</h2>
            <p>{t("arcadeGame.pausedHint")}</p>
            <div className="gshell__actions" style={{ marginTop: 20 }}>
              <button type="button" className="gshell__btn" onClick={handleChangeDifficulty}>
                {t("arcadeGame.changeDifficulty")}
              </button>
              <button type="button" className="gshell__btn gshell__btn--primary" onClick={() => { sound.playBeep(); setPaused(false); }}>
                {t("arcadeGame.resume")}
              </button>
            </div>
            <button type="button" className="gshell__btn gshell__btn--ghost" onClick={handleQuit}>
              {t("arcadeGame.quit")}
            </button>
          </div>
        </div>
      )}

      {/* ── Stage: Result ── */}
      {stage === "result" && resultData && (
        <div className="gshell__overlay">
          <div className="gshell__card" style={{ "--result-color": outcome.color }}>
            <div className="gshell__badge">
              <span className="material-symbols-outlined">{outcome.icon}</span>
            </div>
            <p className="gshell__eyebrow">{theme.name}</p>
            <h2>{t(`arcadeGame.result.${resultData.result}`)}</h2>

            <div className="gshell__score">
              {t("arcadeGame.scoreValue", { score: resultData.score?.toLocaleString("vi-VN") })}
            </div>

            <div className="gshell__reward">
              <span className="material-symbols-outlined">toll</span>
              <b>{resultData.joyDelta > 0 ? "+" : ""}{resultData.joyDelta || 0}</b>
              <span>JOY</span>
            </div>

            <div className="gshell__actions">
              <button type="button" className="gshell__btn" onClick={handleChangeDifficulty}>
                {t("arcadeGame.changeDifficulty")}
              </button>
              <button type="button" className="gshell__btn gshell__btn--primary" onClick={handleReplay}>
                {t("arcadeGame.replay")}
              </button>
            </div>

            <button type="button" className="gshell__btn gshell__btn--ghost" onClick={onClose}>
              {t("arcadeGame.close")}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
