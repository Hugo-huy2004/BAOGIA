import React from "react";
import { useTranslation } from "react-i18next";
import "./game-intro.css";

const GAME_META = {
  chess: { icon: "castle", detail: "8 × 8", badge: "AI 2500" },
  survivor: { icon: "rocket_launch", detail: "∞", badge: "SURVIVAL" },
  flappy: { icon: "bolt", detail: "1 TAP", badge: "CYBER" },
  tetris: { icon: "view_compact", detail: "10 × 20", badge: "NEON" },
  "2048": { icon: "grid_view", detail: "4 × 4", badge: "FUSION" },
  caro: { icon: "close", detail: "5 IN ROW", badge: "AI DUEL" },
  wordguess: { icon: "spellcheck", detail: "6 TRIES", badge: "WORDS" },
  snake: { icon: "route", detail: "∞", badge: "CLASSIC" },
};

const GAME_MODES = [
  { id: "easy", icon: "bolt", reward: 18 },
  { id: "medium", icon: "local_fire_department", reward: 38 },
  { id: "hard", icon: "military_tech", reward: 75 },
];

function GameArtwork({ gameId }) {
  if (gameId === "2048") {
    const tiles = ["2", "4", "8", "16", "32", "64", "128", "256", "512"];
    return (
      <div className="intro-art intro-art--2048" aria-hidden="true">
        <div className="fusion-phone fusion-phone--rear">
          <span className="fusion-logo">2048</span>
          <div className="fusion-menu"><i /><i /><i /><i /></div>
        </div>
        <div className="fusion-phone fusion-phone--front">
          <div className="fusion-score"><b>06280</b><b>242622</b></div>
          <div className="fusion-grid">
            {tiles.map((tile, index) => <i key={tile} data-level={index}>{tile}</i>)}
          </div>
        </div>
      </div>
    );
  }

  if (gameId === "snake") {
    return (
      <div className="intro-art intro-art--snake" aria-hidden="true">
        <div className="snake-title">CLASSIC <strong>SNAKE</strong></div>
        <div className="snake-board">
          <i className="snake-fruit">●</i>
          <div className="snake-chain">
            <i /><i /><i /><i /><i className="snake-head"><b /><b /></i>
          </div>
          <span className="snake-level">LEVEL 01</span>
        </div>
      </div>
    );
  }

  if (gameId === "chess") {
    return (
      <div className="intro-art intro-art--chess" aria-hidden="true">
        <div className="chess-orbit" />
        <div className="chess-board">{Array.from({ length: 36 }, (_, index) => <i key={index} />)}</div>
        <span className="material-symbols-outlined chess-king">chess</span>
        <span className="chess-rank">AI<br /><b>2500</b></span>
      </div>
    );
  }

  if (gameId === "survivor") {
    return (
      <div className="intro-art intro-art--survivor" aria-hidden="true">
        <div className="space-ring space-ring--one" />
        <div className="space-ring space-ring--two" />
        <span className="space-planet" />
        <span className="material-symbols-outlined space-rocket">rocket_launch</span>
        {Array.from({ length: 9 }, (_, index) => <i className={`space-star space-star--${index + 1}`} key={index} />)}
      </div>
    );
  }

  if (gameId === "flappy") {
    return (
      <div className="intro-art intro-art--flappy" aria-hidden="true">
        <div className="flappy-sun" />
        <div className="flappy-cloud flappy-cloud--one" />
        <div className="flappy-cloud flappy-cloud--two" />
        <div className="flappy-pipe flappy-pipe--top" />
        <div className="flappy-pipe flappy-pipe--bottom" />
        <div className="flappy-bird"><span className="material-symbols-outlined">bolt</span></div>
        <span className="flappy-trail">•••</span>
      </div>
    );
  }

  if (gameId === "tetris") {
    return (
      <div className="intro-art intro-art--tetris" aria-hidden="true">
        <div className="tetris-well">
          {["a", "b", "c", "d", "e", "f", "g"].map((shape) => <div className={`tetromino tetromino--${shape}`} key={shape}><i /><i /><i /><i /></div>)}
        </div>
        <span className="tetris-score">NEXT<br /><b>12,480</b></span>
      </div>
    );
  }

  if (gameId === "caro") {
    return (
      <div className="intro-art intro-art--caro" aria-hidden="true">
        <div className="caro-grid" />
        <span className="caro-mark caro-mark--x">×</span>
        <span className="caro-mark caro-mark--o">○</span>
        <span className="caro-mark caro-mark--x2">×</span>
        <div className="caro-line" />
        <span className="caro-vs">YOU <b>VS</b> AI</span>
      </div>
    );
  }

  return (
    <div className="intro-art intro-art--wordguess" aria-hidden="true">
      <div className="word-book">
        <span>HUGO</span>
        <div>{["W", "O", "R", "D", "S"].map((letter, index) => <i className={index < 3 ? "is-found" : ""} key={letter}>{letter}</i>)}</div>
      </div>
      <div className="word-pencil" />
      <span className="word-note">6 / 6</span>
    </div>
  );
}

export default function GameIntroScreen({
  gameId,
  isProActive = false,
  onSelectDifficulty,
  onClose,
}) {
  const { t } = useTranslation();
  const meta = GAME_META[gameId] || GAME_META["2048"];
  const gameKey = `arcadeIntro.games.${gameId}`;

  return (
    <section className={`arcade-intro arcade-intro--${gameId}`}>
      <div className="arcade-intro__aurora" aria-hidden="true" />
      <header className="arcade-intro__header">
        <button type="button" className="arcade-intro__back" onClick={onClose} aria-label={t("arcadeIntro.close")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="arcade-intro__brand">HUGO ARCADE</span>
        <span className="arcade-intro__edition">{meta.badge}</span>
      </header>

      <div className="arcade-intro__body">
        <div className="arcade-intro__copy">
          <span className="arcade-intro__eyebrow">
            <span className="material-symbols-outlined">{meta.icon}</span>
            {t(`${gameKey}.eyebrow`)}
          </span>
          <h1>{t(`${gameKey}.title`)}</h1>
          <p>{t(`${gameKey}.description`)}</p>
        </div>

        <GameArtwork gameId={gameId} />

        <div className="arcade-intro__footer">
          <div className="arcade-intro__facts">
            <span><b>{meta.detail}</b>{t("arcadeIntro.board")}</span>
            <span><b>+ JOY</b>{t("arcadeIntro.reward")}</span>
            <span><b>SOLO</b>{t("arcadeIntro.mode")}</span>
          </div>
          <p className="arcade-intro__hint">{t(`${gameKey}.hint`)}</p>
          <div className="arcade-intro__mode-heading">
            <span>{t("arcadeIntro.chooseMode")}</span>
            <small>{t("arcadeIntro.tapToPlay")}</small>
          </div>
          <div className="arcade-intro__modes" role="group" aria-label={t("arcadeIntro.chooseMode")}>
            {GAME_MODES.map((mode) => {
              const locked = mode.id !== "easy" && !isProActive;
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={`arcade-intro__mode arcade-intro__mode--${mode.id}`}
                  onClick={() => onSelectDifficulty?.(mode.id)}
                  disabled={locked}
                  aria-label={`${t(`arcadeIntro.difficulty.${mode.id}`)}${locked ? ` — ${t("arcadeIntro.proRequired")}` : ""}`}
                >
                  <span className="material-symbols-outlined">
                    {locked ? "lock" : mode.icon}
                  </span>
                  <strong>{t(`arcadeIntro.difficulty.${mode.id}`)}</strong>
                  <small>{locked ? t("arcadeIntro.proRequired") : `+${mode.reward} JOY`}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
