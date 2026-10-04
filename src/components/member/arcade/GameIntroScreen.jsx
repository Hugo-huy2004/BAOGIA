import { useTranslation } from "react-i18next";
import "./game-intro.css";

const GAME_META = {
  pinball: { icon: "disc_full", detail: "2.5D HYBRID", badge: "PINBALL 3D" },
  chess: { icon: "castle", detail: "8 × 8", badge: "BOT · LOCAL" },
  survivor: { icon: "rocket_launch", detail: "4 BOSS", badge: "3D ASSAULT" },
  "2048": {
    icon: "auto_awesome",
    detail: "4 × 4",
    badge: "JELLY MONSTER",
    fact2Title: "20 CẤP",
    fact2Desc: "TIẾN HÓA",
  },
  caro: { icon: "close", detail: "5 IN ROW", badge: "10 × 10" },
  snake: { icon: "route", detail: "18×18", badge: "3D PRO" },
};

function JellyPileArtwork() {
  return (
    <div className="intro-art intro-art--2048" aria-hidden="true">
      <div className="jelly-pile-stage">
        <svg
          viewBox="0 0 520 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="jelly-pile-svg"
        >
          <defs>
            <linearGradient id="jellyPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="25%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>

            <linearGradient id="jellyPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="35%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" />
            </linearGradient>

            <linearGradient id="jellyCoral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="35%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>

            <linearGradient id="jellyLime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="40%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#4d7c0f" />
            </linearGradient>

            <linearGradient id="jellyMint" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="35%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0f766e" />
            </linearGradient>

            <linearGradient id="jellyCyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="jellyOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="35%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>

            <linearGradient id="jellyPlum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="35%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#581c87" />
            </linearGradient>

            <linearGradient id="jellyLavender" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a5b4fc" />
              <stop offset="35%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>

            <linearGradient id="jellyYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="35%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>

            <filter id="jellyShadow" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.25" floodColor="#000000" />
            </filter>
            <filter id="jellyHeroShadow" x="-25%" y="-25%" width="160%" height="160%">
              <feDropShadow dx="0" dy="12" stdDeviation="8" floodOpacity="0.32" floodColor="#000000" />
            </filter>
          </defs>

          {/* 1. Yellow Jelly (Top-Right Back) */}
          <g transform="translate(390, 48) rotate(22)" filter="url(#jellyShadow)">
            <rect width="82" height="82" rx="18" fill="url(#jellyYellow)" />
            <rect x="10" y="7" width="62" height="8" rx="4" fill="white" opacity="0.45" />
            <ellipse cx="32" cy="46" rx="10" ry="14" fill="white" />
            <ellipse cx="30" cy="48" rx="6" ry="8" fill="#111" />
            <circle cx="28" cy="44" r="2.2" fill="white" />
          </g>

          {/* 2. Mint Turquoise Jelly (Top-Center Back) */}
          <g transform="translate(182, 16) rotate(-4)" filter="url(#jellyShadow)">
            <rect width="90" height="90" rx="20" fill="url(#jellyMint)" />
            <rect x="10" y="7" width="70" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="36" cy="45" r="4.5" fill="#042f2e" />
            <circle cx="56" cy="45" r="4.5" fill="#042f2e" />
            <circle cx="26" cy="52" r="5" fill="#f43f5e" opacity="0.45" />
            <circle cx="66" cy="52" r="5" fill="#f43f5e" opacity="0.45" />
          </g>

          {/* 3. Warm Orange Jelly (Top-Center-Right Back) */}
          <g transform="translate(280, 24) rotate(8)" filter="url(#jellyShadow)">
            <rect width="94" height="94" rx="20" fill="url(#jellyOrange)" />
            <rect x="10" y="7" width="74" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="35" cy="46" r="9" fill="white" />
            <circle cx="35" cy="49" r="5.5" fill="#111" />
            <circle cx="33" cy="47" r="2" fill="white" />
            <circle cx="65" cy="46" r="9" fill="white" />
            <circle cx="65" cy="49" r="5.5" fill="#111" />
            <circle cx="63" cy="47" r="2" fill="white" />
          </g>

          {/* 4. Lavender / Periwinkle Jelly (Top-Left Back) */}
          <g transform="translate(132, 42) rotate(-14)" filter="url(#jellyShadow)">
            <rect width="86" height="86" rx="19" fill="url(#jellyLavender)" />
            <rect x="9" y="6" width="68" height="8" rx="4" fill="white" opacity="0.45" />
            <circle cx="25" cy="44" r="6.5" fill="white" />
            <circle cx="25" cy="45" r="4" fill="#1e1b4b" />
            <circle cx="43" cy="42" r="6.5" fill="white" />
            <circle cx="43" cy="43" r="4" fill="#1e1b4b" />
            <circle cx="61" cy="44" r="6.5" fill="white" />
            <circle cx="61" cy="45" r="4" fill="#1e1b4b" />
            <rect x="36" y="58" width="14" height="8" rx="4" fill="#1e1b4b" />
            <rect x="41" y="58" width="4" height="3" rx="1" fill="white" />
          </g>

          {/* 5. Lime Green Jelly (Left-Far) */}
          <g transform="translate(18, 112) rotate(-22)" filter="url(#jellyShadow)">
            <rect width="95" height="95" rx="22" fill="url(#jellyLime)" />
            <rect x="10" y="7" width="75" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="34" cy="46" r="8" fill="white" />
            <circle cx="34" cy="42" r="4.5" fill="#111" />
            <circle cx="32" cy="40" r="1.8" fill="white" />
            <circle cx="65" cy="48" r="8" fill="white" />
            <circle cx="65" cy="44" r="4.5" fill="#111" />
            <circle cx="63" cy="42" r="1.8" fill="white" />
            <path d="M 38 68 Q 50 78 62 68" stroke="#1a2e05" strokeWidth="4" strokeLinecap="round" fill="none" />
            <rect x="44" y="66" width="4" height="4" rx="1" fill="white" />
            <rect x="52" y="66" width="4" height="4" rx="1" fill="white" />
          </g>

          {/* 6. Coral Pink Jelly (Left-Middle) */}
          <g transform="translate(68, 60) rotate(-8)" filter="url(#jellyShadow)">
            <rect width="96" height="96" rx="22" fill="url(#jellyCoral)" />
            <rect x="10" y="7" width="76" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="30" cy="44" r="9.5" fill="white" />
            <circle cx="31" cy="44" r="6" fill="#111" />
            <circle cx="29" cy="42" r="2.2" fill="white" />
            <circle cx="66" cy="42" r="9.5" fill="white" />
            <circle cx="65" cy="42" r="6" fill="#111" />
            <circle cx="63" cy="40" r="2.2" fill="white" />
            <path d="M 38 62 Q 48 74 58 62" stroke="#4c0519" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="46" y="62" width="5" height="4" rx="1" fill="white" />
          </g>

          {/* 7. Plum/Deep Violet Jelly (Right-Middle) */}
          <g transform="translate(340, 75) rotate(14)" filter="url(#jellyShadow)">
            <rect width="100" height="100" rx="23" fill="url(#jellyPlum)" />
            <rect x="10" y="7" width="80" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="44" cy="50" r="14" fill="white" />
            <circle cx="42" cy="51" r="8" fill="#111" />
            <circle cx="39" cy="47" r="3" fill="white" />
            <path d="M 34 76 Q 44 70 54 76 Q 64 82 72 76" stroke="#2e1065" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="45" y="74" width="5" height="5" rx="1.5" fill="white" />
          </g>

          {/* 8. Bright Cyan Jelly (Right-Bottom) */}
          <g transform="translate(385, 118) rotate(7)" filter="url(#jellyShadow)">
            <rect width="96" height="96" rx="22" fill="url(#jellyCyan)" />
            <rect x="10" y="7" width="76" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="34" cy="44" r="8.5" fill="white" />
            <circle cx="37" cy="44" r="5" fill="#082f49" />
            <circle cx="35" cy="42" r="1.8" fill="white" />
            <circle cx="68" cy="42" r="8.5" fill="white" />
            <circle cx="71" cy="42" r="5" fill="#082f49" />
            <circle cx="69" cy="40" r="1.8" fill="white" />
            <rect x="44" y="66" width="18" height="12" rx="6" fill="#082f49" />
            <rect x="50" y="66" width="5" height="4" rx="1" fill="white" />
          </g>

          {/* 9. Avocado Green Buddy (Bottom-Right Under Hero) */}
          <g transform="translate(325, 160) rotate(-6)" filter="url(#jellyShadow)">
            <rect width="94" height="90" rx="22" fill="url(#jellyLime)" />
            <rect x="10" y="7" width="74" height="9" rx="4.5" fill="white" opacity="0.45" />
            <circle cx="34" cy="40" r="7.5" fill="white" />
            <circle cx="34" cy="37" r="4" fill="#14532d" />
            <circle cx="64" cy="40" r="7.5" fill="white" />
            <circle cx="64" cy="37" r="4" fill="#14532d" />
            <rect x="42" y="60" width="18" height="11" rx="5.5" fill="#14532d" />
            <rect x="48" y="60" width="5" height="4" rx="1" fill="white" />
          </g>

          {/* 10. Bubblegum Pink Jelly (Left-Front) */}
          <g transform="translate(85, 105) rotate(-16)" filter="url(#jellyHeroShadow)">
            <rect width="112" height="112" rx="26" fill="url(#jellyPink)" />
            <rect x="12" y="8" width="88" height="12" rx="6" fill="white" opacity="0.45" />
            <g>
              <ellipse cx="35" cy="56" rx="17" ry="18" fill="white" />
              <ellipse cx="37" cy="57" rx="12" ry="13" fill="#0284c7" />
              <ellipse cx="39" cy="58" rx="8" ry="9" fill="#082f49" />
              <circle cx="33" cy="51" r="4" fill="white" />
              <circle cx="42" cy="64" r="1.8" fill="white" />
            </g>
            <g>
              <ellipse cx="80" cy="52" rx="16" ry="17" fill="white" />
              <ellipse cx="79" cy="53" rx="11" ry="12" fill="#0284c7" />
              <ellipse cx="78" cy="54" rx="7" ry="8" fill="#082f49" />
              <circle cx="75" cy="47" r="3.5" fill="white" />
              <circle cx="83" cy="60" r="1.6" fill="white" />
            </g>
            <rect x="50" y="78" width="18" height="14" rx="7" fill="#500724" />
            <rect x="56" y="78" width="6" height="5" rx="1.5" fill="white" />
          </g>

          {/* 11. HERO PURPLE JELLY (Center-Front Signature Block) */}
          <g transform="translate(178, 68) rotate(-1)" filter="url(#jellyHeroShadow)">
            <rect width="162" height="156" rx="34" fill="url(#jellyPurple)" />
            <rect x="18" y="11" width="126" height="15" rx="7.5" fill="white" opacity="0.42" />

            <g>
              <rect x="42" y="58" width="24" height="42" rx="12" fill="white" />
              <ellipse cx="53" cy="83" rx="8.5" ry="9.5" fill="#0f172a" />
              <circle cx="51" cy="79" r="2.8" fill="white" />
            </g>
            <g>
              <rect x="94" y="68" width="22" height="38" rx="11" fill="white" />
              <ellipse cx="104" cy="90" rx="8" ry="9" fill="#0f172a" />
              <circle cx="102" cy="86" r="2.6" fill="white" />
            </g>

            <rect x="63" y="112" width="36" height="24" rx="12" fill="#3b0764" />
            <rect x="74" y="112" width="8" height="9" rx="2" fill="white" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function GameArtwork({ gameId }) {
  if (gameId === "2048") {
    return <JellyPileArtwork />;
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
            <span>
              <b>{meta.fact2Title || t("arcadeGame.joyByScore")}</b>
              {meta.fact2Desc || t("arcadeIntro.reward")}
            </span>
            <span><b>∞</b>{t("arcadeIntro.endless")}</span>
          </div>
          {Boolean(t(`${gameKey}.hint`)) && <p className="arcade-intro__hint">{t(`${gameKey}.hint`)}</p>}

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
