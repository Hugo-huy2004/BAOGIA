import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
import ArcadeGameFrame from "./ArcadeGameFrame";
import Game2048 from "./Game2048";
import GameCaro from "./GameCaro";
import GameWordGuess from "./GameWordGuess";
import GameSurvivor from "./GameSurvivor";
import ChessPage from "../../../pages/public/ChessPage";
import { fetchProfile } from "../../../services/arcadeApi";
import { HOW_TO_PLAY } from "./arcadeConstants";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import "./arcade-theme.css";

const ARCADE_PRICE_JOY = 199;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const GAMES = [
  { id: "2048", icon: "grid_view", name: "2048", tagline: "Gộp số. Phá giới hạn.", accent: "orange", symbol: "2048", detail: "Logic · Chiến thuật" },
  { id: "caro", icon: "grid_3x3", name: "Caro AI", tagline: "Năm quân tạo nên chiến thắng.", accent: "violet", symbol: "×○", detail: "Đối kháng · AI" },
  { id: "chess", icon: "chess", name: "HugoChess", tagline: "Đấu Bot hoặc bạn bè, có JOY.", accent: "amber", symbol: "♞", detail: "Cờ vua · Xếp hạng" },
  { id: "wordguess", icon: "spellcheck", name: "Mật Mã Từ", tagline: "Mỗi chữ cái là một manh mối.", accent: "emerald", symbol: "A?", detail: "Ngôn ngữ · Suy luận" },
  { id: "survivor", icon: "rocket_launch", name: "Space Survivor", tagline: "Sinh tồn giữa bão đạn.", accent: "rose", symbol: "✦", detail: "Hành động · Đạn mạc" }
];

// Chess is a real-time multiplayer room game with its own lobby/leaderboard —
// it doesn't fit the generic single-player ArcadeGameFrame flow the other
// games use, so it renders its full existing UI (ChessPage) instead.
const STANDALONE_GAMES = new Set(["chess"]);

const GAME_COMPONENTS = {
  "2048": Game2048,
  caro: GameCaro,
  wordguess: GameWordGuess,
  survivor: GameSurvivor
};

const DEMO_FRAMES = {
  "2048": [[2, 2, 4, 8], [0, 4, 4, 8], [0, 0, 8, 8], [0, 0, 0, 16]],
  caro: [
    ["x", "", "", "", "", "", "o", "", "", "", "", "", "x", "", "", "", "", "", "o", "", "", "", "", "", ""],
    ["x", "", "", "", "", "", "o", "", "", "", "", "", "x", "", "", "", "", "", "o", "", "", "", "", "", "x"],
    ["x", "", "", "", "", "", "x", "", "", "", "", "", "x", "", "", "", "", "", "x", "", "", "", "", "", "x"],
  ],
  wordguess: [
    [{ l: "M", s: "absent" }, { l: "A", s: "present" }, { l: "Y", s: "absent" }, { l: "M", s: "absent" }, { l: "O", s: "present" }],
    [{ l: "H", s: "correct" }, { l: "U", s: "correct" }, { l: "G", s: "correct" }, { l: "O", s: "correct" }, { l: "?", s: "active" }],
    [{ l: "H", s: "correct" }, { l: "U", s: "correct" }, { l: "G", s: "correct" }, { l: "O", s: "correct" }, { l: "S", s: "correct" }],
  ],
  survivor: [1, 2, 3], // Demo loop
  chess: [1, 2, 3]
};

function GameArtwork({ game }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const timer = window.setInterval(() => {
      setFrame((current) => (current + 1) % DEMO_FRAMES[game].length);
    }, game === "2048" ? 1050 : 1250);
    return () => window.clearInterval(timer);
  }, [game]);

  if (game === "2048") {
    return (
      <div className="arcade-art arcade-art-2048" aria-hidden="true">
        <div className="demo-stage demo-2048-stage" key={frame}>
          {DEMO_FRAMES[game][frame].map((value, index) => <span key={index} className={!value ? "empty" : `tile-${value}`}>{value || ""}</span>)}
        </div>
        <small><span className="material-symbols-outlined">swipe</span> Vuốt để gộp số giống nhau</small>
      </div>
    );
  }
  if (game === "caro") {
    return (
      <div className="arcade-art arcade-art-caro" aria-hidden="true">
        <div className={`demo-stage demo-caro-stage ${frame === 2 ? "is-winning" : ""}`} key={frame}>
          {DEMO_FRAMES[game][frame].map((cell, index) => <span key={index} className={cell}>{cell === "x" ? "×" : cell === "o" ? "○" : ""}</span>)}
        </div>
        <small><span className="material-symbols-outlined">gesture</span> Nối 5 quân để chiến thắng</small>
      </div>
    );
  }
  if (game === "survivor") {
    const cells = [
       ["", "", "🔴", "", "🚀", "", "🔴", "", ""],
       ["", "🔴", "", "", "🚀", "🔴", "", "", ""],
       ["🔴", "", "", "🔴", "🚀", "", "", "", "🔴"]
    ];
    return (
      <div className="arcade-art arcade-art-survivor" aria-hidden="true">
        <div className="demo-stage demo-survivor-grid" key={frame}>
          {cells[frame % 3].map((cell, index) => <span key={index} className={cell === "🚀" ? "ship" : cell === "🔴" ? "bullet" : ""}>{cell}</span>)}
        </div>
        <small><span className="material-symbols-outlined">rocket</span> Lách qua những kẽ hở hẹp nhất</small>
      </div>
    );
  }
  if (game === "chess") {
    const board = ["♜","♞","♝","♛","♚","♝","♞","♜"];
    return (
      <div className="arcade-art arcade-art-chess" aria-hidden="true">
        <div className="demo-stage demo-chess-stage">
          {board.map((p, i) => <span key={i} className={i % 2 === 0 ? "dark" : ""}>{p}</span>)}
        </div>
        <small><span className="material-symbols-outlined">emoji_events</span> Đấu Bot hoặc bạn bè, leo rank</small>
      </div>
    );
  }
  return (
    <div className="arcade-art arcade-art-word" aria-hidden="true">
      <div className="demo-stage demo-word-stage" key={frame}>
        {DEMO_FRAMES[game][frame].map(({ l, s }, index) => <span key={`${index}-${l}`} className={s}>{l}</span>)}
      </div>
      <small><span className="material-symbols-outlined">keyboard</span> Đoán từ qua màu gợi ý</small>
    </div>
  );
}

export default function HugoArcadeTab({ onBack, bio, onBioUpdate }) {
  const [searchParams] = useSearchParams();
  // Deep-link support: /arcade?game=chess&room=<id> (old /chess/:roomId share
  // links redirect here) opens straight into Chess with that room joined.
  const [activeGame, setActiveGame] = useState(() => searchParams.get("game") === "chess" ? "chess" : null);
  const chessRoomId = searchParams.get("room") || null;
  const [profile, setProfile] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const { active: subscribed } = useFeatureGate(bio, "hugoArcade");
  // True only while a match is actually running — drives the locked
  // fullscreen layout below (hides leaderboard/intro, blocks page scroll) so
  // swipe gestures aimed at the game don't drag the page up/down instead.
  const [isPlaying, setIsPlaying] = useState(false);
  const gameFrameRef = useRef(null);

  useEffect(() => {
    if (!isPlaying) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isPlaying]);

  useEffect(() => { setIsPlaying(false); }, [activeGame]);

  useEffect(() => {
    if (!activeGame && bio?.email) fetchProfile(bio.email).then(setProfile);
  }, [activeGame, bio?.email]);

  const totalGames = GAMES.reduce((sum, g) => sum + (profile?.[g.id]?.gamesPlayed || 0), 0);
  const totalWins = GAMES.reduce((sum, g) => {
    const record = profile?.[g.id]?.record || {};
    return sum + Object.values(record).reduce((s, tier) => s + (tier?.wins || 0), 0);
  }, 0);

  const handleConfirmCharge = async () => {
    const res = await fetch(`${API_BASE}/joy/subscribe-feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bio.email, featureKey: "hugoArcade" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi trao đổi JOY.");
    return data;
  };

  const handleSuccess = (data) => {
    useJoyStore.getState().setBalance(data.balance);
    onBioUpdate?.({
      ...bio,
      featureSubscriptions: {
        ...(bio.featureSubscriptions || {}),
        hugoArcade: { active: true, expiresAt: data.expiresAt }
      }
    });
  };

  if (!activeGame) {
    return (
      <div className="arcade-app arcade-scroll-shell">
        <header className="arcade-topbar">
          <button onClick={onBack} className="arcade-icon-btn" aria-label="Quay lại"><span className="material-symbols-outlined">arrow_back</span></button>
          <div className="arcade-brand"><span className="arcade-brand-mark material-symbols-outlined">stadia_controller</span><div><strong>HugoArcade</strong><small>Play · Earn · Repeat</small></div></div>
          <div className="arcade-live"><i /> ONLINE</div>
        </header>

        {!subscribed && (
          <div className="arcade-instruction" style={{ margin: "16px max(18px, env(safe-area-inset-left))", borderColor: "var(--warning, #f59e0b)" }}>
            <span className="arcade-instruction-icon"><span className="material-symbols-outlined">workspace_premium</span></span>
            <div>
              <strong>Bứt phá & Huyền thoại đang chờ</strong>
              <p>
                Trao đổi {ARCADE_PRICE_JOY} JOY/tháng để mở khóa hai độ khó này ở mọi trò chơi. "Khởi động" luôn miễn phí cho mọi người.
                {" "}
                <button onClick={() => setShowInvoice(true)} style={{ fontWeight: 700, textDecoration: "underline" }}>
                  Trao đổi {ARCADE_PRICE_JOY} JOY ngay
                </button>
              </p>
            </div>
          </div>
        )}

        <main className="arcade-home">
          <section className="arcade-hero">
            <div className="arcade-hero-copy">
              <span className="arcade-eyebrow"><span className="material-symbols-outlined">stadia_controller</span> MINI GAME UNIVERSE</span>
              <h1>Chơi một ván.<br/><em>Vui cả ngày.</em></h1>
              <p>Ba thế giới, ba kiểu tư duy. Chinh phục thử thách, lập kỷ lục và mang JOY về ví.</p>
              <div className="arcade-hero-stats">
                <div><strong>{totalGames}</strong><span>Ván đã chơi</span></div>
                <div><strong>{totalWins}</strong><span>Chiến thắng</span></div>
                <div><strong>+75</strong><span>JOY tối đa/ván</span></div>
              </div>
            </div>
            <div className="arcade-hero-art" aria-hidden="true">
              <span className="tile t1">2</span><span className="tile t2">X</span><span className="tile t3">A</span><span className="tile t4">8</span>
              <div className="arcade-orbit"><span className="material-symbols-outlined">sports_esports</span></div>
            </div>
          </section>

          <div className="arcade-section-heading"><div><span>CHỌN TRÒ CHƠI</span><h2>Hôm nay bạn muốn phá đảo gì?</h2></div><span className="arcade-game-count">{GAMES.length < 10 ? `0${GAMES.length}` : GAMES.length} games</span></div>

          <section className="arcade-game-grid">
            {GAMES.map((g, index) => {
              const best = profile?.[g.id]?.bestScore || 0;
              const played = profile?.[g.id]?.gamesPlayed || 0;
              return (
                <button key={g.id} onClick={() => setActiveGame(g.id)} className={`arcade-game-card accent-${g.accent}`}>
                  <div className="arcade-card-top"><span className="arcade-card-index">GAME 0{index + 1}</span><span className="arcade-card-status"><i /> SẴN SÀNG</span></div>
                  <GameArtwork game={g.id} />
                  <div className="arcade-card-copy"><span>{g.detail}</span><div className="arcade-card-title"><h3>{g.name}</h3><span className="material-symbols-outlined">arrow_outward</span></div><p>{g.tagline}</p></div>
                  <div className="arcade-card-footer"><div><small>KỶ LỤC</small><strong>{best.toLocaleString("vi-VN")}</strong></div><div><small>ĐÃ CHƠI</small><strong>{played}</strong></div><span className="arcade-play-pill"><span className="material-symbols-outlined">play_arrow</span> Chơi ngay</span></div>
                </button>
              );
            })}
          </section>

          <section className="arcade-reward-banner">
            <div className="reward-icon"><span className="material-symbols-outlined">trophy</span></div>
            <div><span>THỬ THÁCH HUYỀN THOẠI</span><h3>Thắng cấp cao nhất, nhận ngay <b>75 JOY</b></h3><p>Mỗi độ khó là một hành trình riêng. Càng khó, phần thưởng càng đáng giá.</p></div>
            <span className="material-symbols-outlined reward-spark">auto_awesome</span>
          </section>
        </main>

        <JoyExchangeModal
          open={showInvoice}
          bio={bio}
          item="hugoArcade"
          onClose={() => setShowInvoice(false)}
          onConfirm={handleConfirmCharge}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  const gameInfo = GAMES.find((g) => g.id === activeGame);

  // Chess brings its own full-screen lobby/board/leaderboard UI — mount it
  // directly instead of wrapping it in the generic single-player game shell.
  if (STANDALONE_GAMES.has(activeGame)) {
    return <ChessPage embedded initialRoomId={chessRoomId} onBack={() => setActiveGame(null)} />;
  }

  const GameComponent = GAME_COMPONENTS[activeGame];
  // While playing, the topbar's "back" button becomes "Quit" — it backs out
  // of the match into difficulty-select instead of leaving the game entirely,
  // since a stray tap mid-match shouldn't bounce the member back to the lobby.
  const handleTopbarBack = () => {
    if (isPlaying) gameFrameRef.current?.quit();
    else setActiveGame(null);
  };
  return (
    <div className={`arcade-app arcade-scroll-shell accent-${gameInfo.accent} ${isPlaying ? "arcade-fullscreen-play" : ""}`}>
      <header className="arcade-topbar">
        <button onClick={handleTopbarBack} className="arcade-icon-btn" aria-label={isPlaying ? "Thoát" : "Về sảnh"}>
          <span className="material-symbols-outlined">{isPlaying ? "close" : "arrow_back"}</span>
        </button>
        <div className="arcade-brand"><span className="arcade-brand-mark">{gameInfo.symbol}</span><div><strong>{gameInfo.name}</strong><small>{gameInfo.detail}</small></div></div>
        {isPlaying
          ? <button onClick={handleTopbarBack} className="arcade-quit-btn">Quit</button>
          : <span className="arcade-top-reward"><span className="material-symbols-outlined">stars</span> Tối đa 75 JOY</span>}
      </header>
      <main className="arcade-play-layout">
        <section className="arcade-play-main">
          {!isPlaying && (
            <div className="arcade-game-intro"><div><span>HUGOARCADE / {gameInfo.name.toUpperCase()}</span><h1>{gameInfo.tagline}</h1></div><p>{HOW_TO_PLAY[activeGame]?.rule}</p></div>
          )}
          <ArcadeGameFrame ref={gameFrameRef} game={activeGame} bio={bio} onBioUpdate={onBioUpdate} onStageChange={(stage) => setIsPlaying(stage === "playing")}>
            {(difficulty, onGameOver) => <GameComponent difficulty={difficulty} onGameOver={onGameOver} />}
          </ArcadeGameFrame>
        </section>
        {!isPlaying && <aside className="arcade-side-panel"><ArcadeLeaderboard game={activeGame} active={true} /></aside>}
      </main>
    </div>
  );
}
