import { useTranslation } from "react-i18next";
import "./game-intro.css";

const GAME_META = {
  chess: { icon: "castle", detail: "8 × 8", badge: "BOT · LOCAL" },
  survivor: { icon: "rocket_launch", detail: "4 BOSS", badge: "3D ASSAULT" },
  "2048": { icon: "grid_view", detail: "4 × 4", badge: "FUSION" },
  caro: { icon: "close", detail: "3 IN ROW", badge: "3 × 3" },
  snake: { icon: "route", detail: "18×18", badge: "3D PRO" },
};

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
          <span className="snake-level">ENDLESS</span>
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
        <span className="chess-rank">BOT +<br /><b>LOCAL</b></span>
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

export default function GameIntroScreen({
  gameId,
  onStartGame,
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
            <span><b>+ JOY theo điểm</b>{t("arcadeIntro.reward")}</span>
            <span><b>∞</b>{t("arcadeIntro.endless")}</span>
          </div>
          <p className="arcade-intro__hint">{t(`${gameKey}.hint`)}</p>

          <button
            type="button"
            className="arcade-intro__play-btn"
            onClick={onStartGame}
          >
            <span className="material-symbols-outlined">play_arrow</span>
            {t("arcadeIntro.playNow")}
          </button>
        </div>
      </div>
    </section>
  );
}
