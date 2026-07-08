import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Blocks, Swords, Castle, Keyboard, Zap, Infinity as InfinityIcon } from "lucide-react";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
import ArcadeGameFrame from "./ArcadeGameFrame";

const Game2048      = React.lazy(() => import("./Game2048"));
const GameCaro      = React.lazy(() => import("./GameCaro"));
const GameWordGuess = React.lazy(() => import("./GameWordGuess"));
const GameSurvivor  = React.lazy(() => import("./GameSurvivor"));
const GameSnake     = React.lazy(() => import("./GameSnake"));
const ChessPage     = React.lazy(() => import("../../../pages/public/ChessPage"));
import { fetchProfile } from "../../../services/arcadeApi";
import { HOW_TO_PLAY } from "./arcadeConstants";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import "./arcade-theme.css";

const ARCADE_PRICE_JOY = 199;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const GAMES = [
  { id: "2048",      name: "2048",           tagline: "Gộp số. Phá giới hạn.",              label: "Logic · Chiến thuật",  Icon: Blocks   },
  { id: "caro",      name: "Caro AI",        tagline: "Năm quân tạo nên chiến thắng.",       label: "Đối kháng · AI",       Icon: Swords   },
  { id: "chess",     name: "HugoChess",      tagline: "Đấu Bot hoặc bạn bè, leo rank.",      label: "Cờ vua · Xếp hạng",   Icon: Castle   },
  { id: "wordguess", name: "Mật Mã Từ",     tagline: "Mỗi chữ cái là một manh mối.",        label: "Ngôn ngữ · Suy luận", Icon: Keyboard },
  { id: "survivor",  name: "Space Survivor", tagline: "Sinh tồn giữa bão đạn.",             label: "Hành động · Đạn mạc", Icon: Zap      },
  { id: "snake",     name: "Hugo Snake",     tagline: "Ăn mồi, dài ra, đừng tự đâm mình.",  label: "Cổ điển · Phản xạ",   Icon: InfinityIcon },
];

const STANDALONE = new Set(["chess"]);
const GAME_COMPONENTS = {
  "2048": Game2048, caro: GameCaro, wordguess: GameWordGuess,
  survivor: GameSurvivor, snake: GameSnake,
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
    : (isChess ? "Chơi" : "Chơi");

  return (
    <button onClick={onClick} className="arc-game-card" data-game={game.id}>
      <div className="arc-card-artwork">
        <div className="arc-card-artwork-grid" />
        <game.Icon size={38} strokeWidth={1.5} className="arc-card-icon" />
        <div className="arc-card-play-overlay">
          <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
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

  const setTab = React.useCallback((t) => setSearchParams(p => { p.set("tab", t); return p; }, { replace: true }), [setSearchParams]);
  const openGame = React.useCallback((id) => setSearchParams(p => { p.set("game", id); return p; }, { replace: true }), [setSearchParams]);
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

  return (
    <>
      {/* ── Lobby ─────────────────────────────────────────────────── */}
      <div className="arc" style={{ visibility: activeGame ? "hidden" : "visible" }}>
        <header className="arc-topbar">
          <button onClick={onBack} className="arc-back" aria-label="Quay lại">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back_ios_new</span>
          </button>
          <div className="arc-logo">
            <div className="arc-logo-mark">HA</div>
            <span className="arc-logo-name">Hugo<span>Arcade</span></span>
          </div>
          <div className="arc-topbar-right">
            <JoyChip balance={joyBalance} />
            {!subscribed && (
              <button className="arc-sub-btn" onClick={() => setShowInvoice(true)}>Pro</button>
            )}
          </div>
        </header>

        {/* Tab nav */}
        <div className="arc-tabs">
          <button className={`arc-tab-btn${activeTab === "games" ? " active" : ""}`} onClick={() => setTab("games")}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>sports_esports</span>
            Trò chơi
          </button>
          <button className={`arc-tab-btn${activeTab === "ranking" ? " active" : ""}`} onClick={() => setTab("ranking")}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>leaderboard</span>
            Xếp hạng
          </button>
        </div>

        <main className="arc-main">
          {!subscribed && activeTab === "games" && (
            <div className="arc-sub-banner" style={{ margin: "16px 24px 0" }}>
              <div className="arc-sub-banner-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <div className="arc-sub-banner-text">
                <strong>Mở khóa Bứt phá &amp; Huyền thoại</strong>
                <p>Trao đổi {ARCADE_PRICE_JOY} JOY/tháng để chinh phục mọi độ khó và kiếm tối đa 75 JOY/ván.</p>
              </div>
              <button className="arc-sub-banner-btn" onClick={() => setShowInvoice(true)}>
                {ARCADE_PRICE_JOY} JOY
              </button>
            </div>
          )}

          {activeTab === "games" && !chessSubscribed && (
            <div className="arc-sub-banner arc-chess-banner" style={{ margin: `${!subscribed ? "8px" : "16px"} 24px 0`, "--g": "#f59e0b", "--g-glow": "rgba(245, 158, 11, .15)", border: "1px solid rgba(245, 158, 11, .3)" }}>
              <div className="arc-sub-banner-icon" style={{ background: "rgba(245, 158, 11, .15)", color: "#f59e0b" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>chess</span>
              </div>
              <div className="arc-sub-banner-text">
                <strong style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px" }}>
                  HugoChess — Thuê riêng
                  <span style={{ fontSize: 9, background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#000", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: 1, fontWeight: 900 }}>PREMIUM</span>
                </strong>
                <p>Đấu Bot · Phòng online · Leo hạng ELO. 299 JOY/tháng, tách biệt với gói Arcade.</p>
              </div>
              <button className="arc-sub-banner-btn" style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)", color: "#000", fontWeight: 900, boxShadow: "0 4px 16px rgba(245, 158, 11, .3)" }} onClick={() => openGame("chess")}>
                299 JOY
              </button>
            </div>
          )}

          {activeTab === "games" ? (
            <>
              {/* Hero */}
              <div className="arc-hero">
                <div className="arc-hero-grid" />
                <div className="arc-hero-artwork" aria-hidden="true">
                  <span className="material-symbols-outlined" style={{ fontSize: 110, fontVariationSettings: "'FILL' 0, 'wght' 100" }}>
                    sports_esports
                  </span>
                </div>
                <div className="arc-hero-content">
                  <div className="arc-hero-badge"><i />Mini Game Universe</div>
                  <h1 className="arc-hero-title">Chơi một ván.<br />Vui cả ngày.</h1>
                  <p className="arc-hero-tagline">Chinh phục thử thách, lập kỷ lục và mang JOY về ví.</p>
                  <div className="arc-hero-actions">
                    <button className="arc-play-btn" onClick={() => openGame("2048")}>
                      <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      Bắt đầu chơi
                    </button>
                    <button className="arc-info-btn">
                      {totalGames} ván · {totalWins} chiến thắng
                    </button>
                  </div>
                </div>
              </div>

              <div className="arc-section-hd">
                <div>
                  <p className="arc-section-hd-label">Thư viện</p>
                  <h2 className="arc-section-hd-title">Hôm nay muốn phá đảo gì?</h2>
                </div>
                <span className="arc-section-hd-count">{String(GAMES.length).padStart(2, "0")} games</span>
              </div>

              <div className="arc-game-grid">
                {GAMES.map(g => (
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
              <header className="arc-topbar" style={{ background: "var(--arc-s1)", borderBottomColor: "var(--arc-b1)" }}>
                <button onClick={closeGame} className="arc-back" aria-label={isPlaying ? "Thoát" : "Về sảnh"}>
                  {isPlaying ? "✕" : "←"}
                </button>
                {gameInfo && (
                  <div className="arc-logo">
                    <div className="arc-logo-mark">
                      <gameInfo.Icon size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <span className="arc-logo-name" style={{ fontSize: 13 }}>{gameInfo.name}</span>
                      <div style={{ fontSize: 9, color: "var(--arc-t3)", letterSpacing: ".1em", textTransform: "uppercase" }}>
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
