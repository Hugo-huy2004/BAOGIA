import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { notify } from "../../../lib/notify";
import { Blocks, Swords, Castle, Keyboard, Grid3X3, Infinity as InfinityIcon, Rocket, Zap } from "lucide-react";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
import ArcadeGameFrame from "./ArcadeGameFrame";

const Game2048          = React.lazy(() => import("./Game2048"));
const GameCaro          = React.lazy(() => import("./GameCaro"));
const GameWordGuess     = React.lazy(() => import("./GameWordGuess"));
const GameTetris        = React.lazy(() => import("./GameTetris"));
const GameSnake         = React.lazy(() => import("./GameSnake"));
const GameSpaceSurvivor = React.lazy(() => import("./GameSpaceSurvivor"));
const GameFlappyCyber    = React.lazy(() => import("./GameFlappyCyber"));
const ChessPage         = React.lazy(() => import("../../../pages/public/ChessPage"));
import { fetchProfile } from "../../../services/arcadeApi";
import { HOW_TO_PLAY } from "./arcadeConstants";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import "./arcade-theme.css";

const ARCADE_PRICE_JOY = 199;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const GAMES = [
  { id: "chess",     name: "HugoChess AI 2500", tagline: "Thách đấu AI Master ELO 2500 & PvP.", label: "Cờ Vua · Đại Sư ELO",       Icon: Castle },
  { id: "survivor",  name: "Hugo Space Survivor",tagline: "Bắn máy bay Neon 3D & Trùm Cuối.",  label: "Mới · Bắn Súng 3D · Boss", Icon: Rocket },
  { id: "flappy",    name: "Hugo Flappy Cyber",   tagline: "Vượt chướng không gian Slow-Motion.", label: "Mới · Cyberpunk 3D",      Icon: Zap },
  { id: "tetris",    name: "Hugo Tetris Neon",  tagline: "Xếp hình Neon 3D. Xóa hàng bứt phá.", label: "Neon 3D · 60 FPS Engine",  Icon: Grid3X3 },
  { id: "2048",      name: "2048 Mega Fusion",  tagline: "Gộp số 2048. Phá giới hạn điểm số.",  label: "Logic · Trí Tuệ · X2 JOY",  Icon: Blocks },
  { id: "caro",      name: "Caro AI Master",    tagline: "Năm quân tạo nên chiến thắng.",       label: "Đối Kháng · AI 5 Cấp", Icon: Swords },
  { id: "wordguess", name: "Mật Mã Từ 3D",      tagline: "Từ Hán-Việt tri thức. Gợi ý 5 JOY.",  label: "Từ Vựng · Thẻ Lật 3D", Icon: Keyboard },
  { id: "snake",     name: "Hugo Snake 3D Pro", tagline: "Rắn săn mồi Khối Cầu Neon 3D.",       label: "Cổ Điển · Đồ Họa 3D", Icon: InfinityIcon },
];

const STANDALONE = new Set(["chess"]);
const GAME_COMPONENTS = {
  tetris: GameTetris,
  "2048": Game2048,
  caro: GameCaro,
  wordguess: GameWordGuess,
  snake: GameSnake,
  survivor: GameSpaceSurvivor,
  flappy: GameFlappyCyber,
};

// ─── Sub-components ────────────────────────────────────────────────

const JoyChip = React.memo(function JoyChip({ balance }) {
  return (
    <div className="arc-joy-chip">
      <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>toll</span>
      <span>{(balance ?? 0).toLocaleString("vi-VN")}</span>
      <span className="arc-joy-label">JOY</span>
    </div>
  );
});

const GameCard = React.memo(function GameCard({ game, profile, isLocked, onClick }) {
  const best   = profile?.[game.id]?.bestScore   || 0;
  const played = profile?.[game.id]?.gamesPlayed || 0;
  const isChess = game.id === "chess";

  const badgeLabel = isLocked
    ? (isChess ? "299 JOY" : "Cần Pro")
    : "CHƠI";

  return (
    <button onClick={onClick} className="arc-game-card" data-game={game.id}>
      <div className="arc-card-artwork">
        <div className="arc-card-artwork-grid" />
        <div className="arc-icon-badge">
          <game.Icon size={30} strokeWidth={1.75} className="arc-card-icon text-white" />
        </div>
        <div className="arc-card-play-overlay">
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          CHƠI NGAY
        </div>
      </div>
      <div className="arc-card-body">
        <span className="arc-card-label">{game.label}</span>
        <p className="arc-card-name">{game.name}</p>
        <p className="arc-card-tagline">{game.tagline}</p>
        <div className="arc-card-footer">
          <div className="arc-card-stat">
            <small>Kỷ lục</small>
            <strong>{best ? best.toLocaleString("vi-VN") : "—"}</strong>
          </div>
          <div className="arc-card-stat">
            <small>Ván</small>
            <strong>{played || "—"}</strong>
          </div>
          <span className={`arc-card-badge${isLocked ? " locked" : ""}${isChess && isLocked ? " chess" : ""}`}>
            {badgeLabel}
          </span>
        </div>
      </div>
    </button>
  );
});

// ─── Main ──────────────────────────────────────────────────────────
export default function HugoArcadeTab({ onBack, bio, onBioUpdate }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab  = searchParams.get("tab")  || "games";
  const activeGame = searchParams.get("game") === "chess"
    ? "chess" : (searchParams.get("game") || null);
  const chessRoomId = searchParams.get("room") || null;

  const [rankingGame, setRankingGame]  = useState("2048");
  const [profile, setProfile]         = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);
  const gameFrameRef = useRef(null);

  const { active: subscribed }      = useFeatureGate(bio, "hugoArcade");
  const { active: chessSubscribed } = useFeatureGate(bio, "hugoChess");
  const joyBalance = useJoyStore(s => s.balance);

  useEffect(() => {
    if (!isPlaying && !STANDALONE.has(activeGame)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isPlaying, activeGame]);

  useEffect(() => { setIsPlaying(false); }, [activeGame]);

  // Fullscreen when game overlay opens; exit when closed
  useEffect(() => {
    if (activeGame) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [activeGame]);

  useEffect(() => {
    if (bio?.email) fetchProfile(bio.email).then(setProfile);
  }, [bio?.email]);

  const totalGames = GAMES.reduce((s, g) => s + (profile?.[g.id]?.gamesPlayed || 0), 0);
  const totalWins  = GAMES.reduce((s, g) => {
    const rec = profile?.[g.id]?.record || {};
    return s + Object.values(rec).reduce((a, t) => a + (t?.wins || 0), 0);
  }, 0);

  const { playBeep } = useArcadeSound();

  const setTab = React.useCallback((t) => setSearchParams(p => { p.set("tab", t); return p; }, { replace: true }), [setSearchParams]);
  const openGame = React.useCallback((id) => {
    playBeep();
    setSearchParams(p => { p.set("game", id); return p; }, { replace: true });
  }, [playBeep, setSearchParams]);
  const closeGame = React.useCallback(() => {
    if (isPlaying) gameFrameRef.current?.quit();
    else setSearchParams(p => { p.delete("game"); p.delete("room"); return p; }, { replace: true });
  }, [isPlaying, setSearchParams]);

  const handleConfirmCharge = React.useCallback(async () => {
    const res = await fetch(`${API_BASE}/joy/subscribe-feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bio.email, featureKey: "hugoArcade" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi trao đổi JOY.");
    return data;
  }, [bio?.email]);
  const handleSuccess = React.useCallback((data) => {
    useJoyStore.getState().setBalance(data.balance);
    onBioUpdate?.({ ...bio, featureSubscriptions: { ...(bio.featureSubscriptions || {}), hugoArcade: { active: true, expiresAt: data.expiresAt } } });
  }, [bio, onBioUpdate]);

  const gameInfo = activeGame ? GAMES.find(g => g.id === activeGame) : null;

  const [selectedCategory, setSelectedCategory] = useState("all");
  const filteredGames = GAMES.filter((g) => {
    if (selectedCategory === "featured") return g.id === "chess" || g.id === "tetris";
    if (selectedCategory === "chess") return g.id === "chess" || g.id === "caro";
    if (selectedCategory === "logic") return g.id === "tetris" || g.id === "wordguess" || g.id === "2048";
    if (selectedCategory === "arcade") return g.id === "snake";
    return true;
  });

  return (
    <>
      {/* ── HugoArcade Shell Lobby ─────────────────────────────────────────────────── */}
      <div className="arc" style={{ visibility: activeGame ? "hidden" : "visible" }}>
        <header className="arc-topbar bg-[#0a0a0f]/90 backdrop-blur-2xl border-b border-white/10">
          <button onClick={onBack} className="arc-back text-white" aria-label="Quay lại">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back_ios_new</span>
          </button>
          <div className="arc-logo">
            <span className="material-symbols-outlined text-[#FF2D55] text-2xl mr-1.5 font-bold">sports_esports</span>
            <span className="text-xl font-extrabold tracking-tight text-white font-sans">
              Hugo<span className="text-[#FF2D55]">Arcade</span>
            </span>
          </div>
          <div className="arc-topbar-right">
            <JoyChip balance={joyBalance} />
            {!subscribed && (
              <button className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF2D55] to-[#E60039] text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(255,45,85,0.4)] active:scale-95 transition-all" onClick={() => setShowInvoice(true)}>
                Arcade Pro
              </button>
            )}
          </div>
        </header>

        {/* HugoArcade Category Bar (Clean Monochrome Labels) */}
        <div className="flex items-center gap-2 overflow-x-auto px-6 py-3 bg-[#0f1019]/90 border-b border-white/5 no-scrollbar">
          {[
            { id: "all", label: "Tất Cả Game" },
            { id: "featured", label: "Nổi Bật HugoArcade" },
            { id: "chess", label: "Cờ Vua & AI" },
            { id: "logic", label: "Logic 3D Neon" },
            { id: "arcade", label: "Phản Xạ 120FPS" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all active:scale-95 ${
                selectedCategory === cat.id
                  ? "bg-[#FF2D55] text-white shadow-[0_4px_16px_rgba(255,45,85,0.45)]"
                  : "bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <main className="arc-main">

          {activeTab === "games" ? (
            <>
              {/* HugoArcade Hero Spotlight — Large 3D Motion Stage */}
              <div className="arc-hero rounded-[36px] mx-6 mt-6 overflow-hidden border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative bg-gradient-to-r from-[#FF2D55]/25 via-[#1c1d2e] to-[#0a0a0f] p-8 md:p-12 min-h-[360px] flex items-center justify-between gap-8 backdrop-blur-2xl">
                <div className="arc-hero-grid" />
                <div className="arc-hero-content max-w-xl z-10 relative">
                  <div className="arc-hero-badge bg-[#FF2D55]/20 border border-[#FF2D55]/40 text-rose-300 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-4 inline-flex items-center gap-2 shadow-[0_4px_16px_rgba(255,45,85,0.3)]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF2D55] animate-ping" /> HugoArcade Exclusive
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3 font-sans leading-none bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                    HugoChess AI 2500 &amp; Neon 3D
                  </h1>
                  <p className="text-sm md:text-base text-zinc-300 max-w-lg mb-7 leading-relaxed font-sans font-medium">
                    Trải nghiệm siêu phẩm Cờ Vua AI Master ELO 2500, Tetris Neon 3D &amp; Mật mã từ Hán-Việt với hệ số thưởng <strong className="text-[#FFB340]">x2.5 JOY Multiplier</strong>.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      className="px-8 py-3.5 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.3)] flex items-center gap-2.5"
                      onClick={() => openGame("chess")}
                    >
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      CHƠI NGAY (PLAY)
                    </button>
                  </div>
                </div>

                {/* Animated 3D Floating Motion Graphic Stage (Right Side) */}
                <div className="hidden lg:flex items-center justify-center relative w-80 h-72 flex-shrink-0 z-10">
                  {/* Ambient Glowing Orbit Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FF2D55]/40 via-purple-500/30 to-amber-500/30 blur-2xl"
                    animate={{ scale: [0.95, 1.2, 0.95], opacity: [0.4, 0.85, 0.4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />

                  {/* Main Floating 3D Master Tile */}
                  <motion.div
                    className="relative z-10 w-48 h-48 rounded-[32px] bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-700 p-1 shadow-[0_20px_50px_rgba(255,45,85,0.45)] border border-white/40 backdrop-blur-xl flex flex-col items-center justify-center gap-2.5 cursor-pointer"
                    animate={{ y: [-10, 10, -10], rotate: [-3, 3, -3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    onClick={() => openGame("chess")}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shadow-inner backdrop-blur-md">
                      <Castle size={44} strokeWidth={1.75} className="text-white filter drop-shadow-lg" />
                    </div>
                    <span className="text-xs font-black text-white tracking-widest font-mono uppercase bg-black/30 px-3 py-1 rounded-full border border-white/20">
                      MASTER ELO 2500
                    </span>
                  </motion.div>

                  {/* Satellite Floating Badge 1: JOY Multiplier */}
                  <motion.div
                    className="absolute -top-3 -left-2 z-20 px-3.5 py-1.5 rounded-full bg-[#1c1d2e]/95 border border-amber-400/50 text-amber-300 text-xs font-black shadow-2xl backdrop-blur-md flex items-center gap-1.5"
                    animate={{ y: [8, -8, 8] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-sm">⚡</span> x2.5 JOY Multiplier
                  </motion.div>

                  {/* Satellite Floating Badge 2: Tetris Neon Tile */}
                  <motion.div
                    className="absolute -bottom-3 -right-2 z-20 w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF2D55] to-fuchsia-600 border border-white/40 text-white flex items-center justify-center shadow-2xl backdrop-blur-md cursor-pointer"
                    animate={{ y: [-8, 8, -8], rotate: [6, -6, 6] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    onClick={() => openGame("tetris")}
                  >
                    <Grid3X3 size={28} strokeWidth={2} className="filter drop-shadow-md" />
                  </motion.div>
                </div>
              </div>

              {/* Game Grid */}
              <div className="arc-section-hd px-6 mt-6">
                <div>
                  <p className="arc-section-hd-label uppercase tracking-widest text-[10px] font-black text-[#FF2D55]">HugoArcade Collection</p>
                  <h2 className="arc-section-hd-title text-xl font-black text-white">Thư Viện Trò Chơi Nổi Bật</h2>
                </div>
                <span className="arc-section-hd-count text-xs font-mono text-zinc-400">{filteredGames.length} Games</span>
              </div>

              <div className="arc-game-grid px-6">
                {filteredGames.map(g => (
                  <GameCard
                    key={g.id} game={g}
                    profile={profile}
                    isLocked={g.id === "chess" ? !chessSubscribed : (g.id !== "2048" && !subscribed)}
                    onClick={() => openGame(g.id)}
                  />
                ))}
              </div>

              <div className="arc-stats-strip">
                <div className="arc-stat-box">
                  <small>Tổng ván</small>
                  <strong>{totalGames}</strong>
                  <span>tất cả game</span>
                </div>
                <div className="arc-stat-box">
                  <small>Chiến thắng</small>
                  <strong>{totalWins}</strong>
                  <span>lượt thắng</span>
                </div>
                <div className="arc-stat-box">
                  <small>JOY hiện có</small>
                  <strong style={{ color: "var(--arc-joy)" }}>{(joyBalance ?? 0).toLocaleString("vi-VN")}</strong>
                  <span>trong ví</span>
                </div>
                <div className="arc-stat-box">
                  <small>JOY tối đa</small>
                  <strong>75</strong>
                  <span>mỗi ván thắng</span>
                </div>
              </div>
            </>
          ) : (
            /* Ranking tab */
            <div style={{ padding: "20px 24px 60px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p className="arc-section-hd-label">Bảng vàng</p>
                  <h2 className="arc-section-hd-title">Thành tích cao nhất</h2>
                </div>
                <select
                  value={rankingGame}
                  onChange={e => setRankingGame(e.target.value)}
                  style={{
                    background: "var(--arc-s2)", color: "var(--arc-t1)",
                    border: "1px solid var(--arc-b2)", padding: "8px 14px",
                    borderRadius: 10, fontSize: 12, fontWeight: 700,
                    fontFamily: "inherit", cursor: "pointer", outline: "none",
                  }}
                >
                  {GAMES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <ArcadeLeaderboard game={rankingGame} active={activeTab === "ranking"} />
            </div>
          )}
        </main>
      </div>

      {/* ── Game overlay ───────────────────────────────────────────── */}
      {activeGame && (
        <div className="arc-game-overlay">
          {STANDALONE.has(activeGame) ? (
            <Suspense fallback={
              <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--arc-t2)", fontSize: 13 }}>
                Đang tải HugoChess...
              </div>
            }>
              <ChessPage embedded initialRoomId={chessRoomId} onBack={closeGame} bio={bio} onBioUpdate={onBioUpdate} />
            </Suspense>
          ) : (
            <>
              {/* Game topbar */}
              <header className="arc-topbar" style={{ background: "#141522", borderBottomColor: "rgba(255,255,255,0.1)" }}>
                <button onClick={closeGame} className="arc-back" aria-label={isPlaying ? "Thoát" : "Về sảnh"}>
                  {isPlaying ? "✕" : "←"}
                </button>
                {gameInfo && (
                  <div className="arc-logo">
                    <div className="arc-logo-mark">
                      <gameInfo.Icon size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <span className="arc-logo-name" style={{ fontSize: 13, color: "#ffffff" }}>{gameInfo.name}</span>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: ".1em", textTransform: "uppercase" }}>
                        {gameInfo.label}
                      </div>
                    </div>
                  </div>
                )}
                <div className="arc-topbar-right">
                  {isPlaying
                    ? <button onClick={closeGame} className="arc-quit-btn">Thoát ván</button>
                    : <span style={{ fontSize: 11, color: "var(--arc-joy)", fontWeight: 700 }}>Tối đa 75 JOY</span>
                  }
                </div>
              </header>

              {/* Game body */}
              <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
                <div className="arc-game-overlay-body">
                  {!isPlaying && gameInfo && (
                    <div className="arc-game-intro">
                      <p className="arc-game-intro-label">{gameInfo.label}</p>
                      <h1>{gameInfo.tagline}</h1>
                      <p>{HOW_TO_PLAY[activeGame]?.rule}</p>
                    </div>
                  )}

                  <ArcadeGameFrame
                    ref={gameFrameRef}
                    game={activeGame} bio={bio} onBioUpdate={onBioUpdate}
                    onStageChange={(stage) => setIsPlaying(stage === "playing")}
                    onClose={closeGame}
                  >
                    {(difficulty, onGameOver) => {
                      const GameComponent = GAME_COMPONENTS[activeGame];
                      return (
                        <Suspense fallback={
                          <div style={{ padding: "60px", textAlign: "center", color: "var(--arc-t2)", fontSize: 13 }}>
                            Đang tải game...
                          </div>
                        }>
                          <GameComponent difficulty={difficulty} onGameOver={onGameOver} />
                        </Suspense>
                      );
                    }}
                  </ArcadeGameFrame>
                </div>

                {!isPlaying && (
                  <aside className="arc-game-side">
                    <div className="arc-game-side-header">
                      <h3>Bảng xếp hạng</h3>
                      <span style={{ fontSize: 9, color: "var(--arc-t3)", fontWeight: 700, letterSpacing: ".1em" }}>LIVE</span>
                    </div>
                    <div className="arc-game-side-body">
                      <ArcadeLeaderboard game={activeGame} active={true} />
                    </div>
                  </aside>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <JoyExchangeModal
        open={showInvoice} bio={bio} item="hugoArcade"
        onClose={() => setShowInvoice(false)}
        onConfirm={handleConfirmCharge}
        onSuccess={handleSuccess}
      />
    </>
  );
}
