import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

import { Blocks, Swords, Castle, Keyboard, Grid3X3, Infinity as InfinityIcon, Rocket, Zap } from "lucide-react";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
import StandaloneGameShell from "./StandaloneGameShell";

import { fetchProfile } from "../../../services/arcadeApi";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import "./arcade-theme.css";

const ARCADE_PRICE_JOY = 199;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const GAMES = [
  { id: "chess",     name: "HugoChess AI 2500", tagline: "Thách đấu AI Master ELO 2500 & PvP.", label: "Cờ Vua · Đại Sư ELO", Icon: Castle },
  { id: "survivor",  name: "Hugo Space Survivor",tagline: "Bắn máy bay Neon 3D & Trùm Cuối.", label: "Bắn Súng 3D · Boss", Icon: Rocket },
  { id: "flappy",    name: "Hugo Flappy Cyber",   tagline: "Vượt chướng không gian Slow-Motion.", label: "Cyberpunk 3D", Icon: Zap },
  { id: "tetris",    name: "Hugo Tetris Neon",  tagline: "Xếp hình Neon 3D 60 FPS.", label: "Xếp Hình Neon", Icon: Grid3X3 },
  { id: "2048",      name: "2048 Mega Fusion",  tagline: "Gộp số 2048. Phá giới hạn điểm.", label: "Trí Tuệ · Logic", Icon: Blocks },
  { id: "caro",      name: "Caro AI Master",    tagline: "Năm quân tạo nên chiến thắng.", label: "Đối Kháng · AI 5 Cấp", Icon: Swords },
  { id: "wordguess", name: "Mật Mã Từ 3D",      tagline: "Từ Hán-Việt tri thức.", label: "Từ Vựng · Thẻ Lật", Icon: Keyboard },
  { id: "snake",     name: "Hugo Snake 3D Pro", tagline: "Rắn săn mồi Khối Cầu Neon 3D.", label: "Cổ Điển 3D", Icon: InfinityIcon },
];

// ─── Sub-components ────────────────────────────────────────────────

const JoyChip = React.memo(function JoyChip({ balance }) {
  return (
    <div className="arc-joy-chip bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold px-3 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.2)]">
      <span className="material-symbols-outlined text-amber-400 mr-1" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>toll</span>
      <span>{(balance ?? 0).toLocaleString("vi-VN")}</span>
      <span className="text-[10px] text-amber-400/80 ml-1">JOY</span>
    </div>
  );
});

const GameCard = React.memo(function GameCard({ game, profile, isLocked, isDownloaded, downloadProgress, onPinToHome, onClick }) {
  const best  = profile?.[game.id]?.bestScore || 0;
  const isChess = game.id === "chess";
  const priceLabel = isChess ? "299 JOY" : "199 JOY";
  const isDownloading = downloadProgress !== undefined;

  // Circular SVG progress ring (App Store style)
  const radius = 13;
  const circ   = 2 * Math.PI * radius;
  const strokeDash = isDownloading ? circ * (1 - (downloadProgress / 100)) : circ;

  return (
    <div className="arc-game-card relative group flex flex-col justify-between" data-game={game.id}>
      <div className="arc-card-artwork cursor-pointer" onClick={!isDownloading ? onClick : undefined}>
        <div className="arc-card-artwork-grid" />
        <div className="arc-icon-badge">
          <game.Icon size={28} strokeWidth={1.75} className="arc-card-icon text-white" />
        </div>
        {!isDownloading && !isDownloaded && (
          <div className="arc-card-play-overlay">
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            CHƠI NGAY
          </div>
        )}
      </div>

      <div className="arc-card-body flex-1 flex flex-col justify-between">
        <div>
          <span className="arc-card-label">{game.label}</span>
          <p className="arc-card-name">{game.name}</p>
          <p className="arc-card-tagline">{game.tagline}</p>
        </div>

        <div className="space-y-2 mt-3">
          <div className="arc-card-footer">
            <div className="arc-card-stat">
              <small>Kỷ lục</small>
              <strong>{best ? best.toLocaleString("vi-VN") : "—"}</strong>
            </div>
            <div className="arc-card-stat">
              <small>Trạng thái</small>
              <strong>{isDownloaded ? "Đã tải" : isLocked ? "Chưa mua" : "Sẵn sàng"}</strong>
            </div>
          </div>

          {/* ── App Store Download Button ── */}
          {isDownloaded ? (
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="w-full py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border bg-emerald-500/20 border-emerald-500/40 text-emerald-300 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">play_circle</span>
              <span>Mở &amp; Chơi</span>
            </button>
          ) : isDownloading ? (
            // ── Circular progress ring (App Store style) ──
            <button
              disabled
              className="w-full py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 border bg-white/5 border-white/10 text-zinc-400 cursor-not-allowed"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" className="-rotate-90">
                {/* Track */}
                <circle cx="15" cy="15" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                {/* Progress */}
                <circle
                  cx="15" cy="15" r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={strokeDash}
                  style={{ transition: "stroke-dashoffset 0.12s linear" }}
                />
              </svg>
              <span>{downloadProgress}%</span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPinToHome(game.id);
              }}
              className="w-full py-2 px-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border bg-white/10 hover:bg-white/20 border-white/20 text-white active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>{isLocked ? `TẢI · ${priceLabel}` : "TẢI VỀ TIỆN ÍCH"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Main ──────────────────────────────────────────────────────────
export default function HugoArcadeTab({ onBack, bio, onBioUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab  = searchParams.get("tab")  || "games";
  const activeGame = searchParams.get("game") === "chess"
    ? "chess"
    : (searchParams.get("game") || null);

  const fromParam = searchParams.get("from");
  const isFromUtilities = fromParam === "utilities" || location.state?.from === "/member/utilities";

  const [profile, setProfile] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const { active: subscribed }      = useFeatureGate(bio, "hugoArcade");
  const { active: chessSubscribed } = useFeatureGate(bio, "hugoChess");
  const joyBalance = useJoyStore(s => s.balance);

  useEffect(() => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
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
    if (isFromUtilities) {
      navigate("/member/utilities", { replace: true });
    } else {
      setSearchParams(p => {
        p.delete("game");
        p.delete("room");
        p.delete("from");
        return p;
      }, { replace: true });
    }
  }, [isFromUtilities, navigate, setSearchParams]);

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
    if (selectedCategory === "featured") return g.id === "chess" || g.id === "survivor" || g.id === "tetris";
    if (selectedCategory === "pvp") return g.id === "chess" || g.id === "caro";
    return true;
  });

  // ── App Store Download State ────────────────────────────────────────
  // Use a dedicated key so Dashboard's homeScreenApps sync never overwrites it
  const ARCADE_DL_KEY = "hugo_arcade_downloaded_v1";

  const [downloading, setDownloading] = useState({}); // { gameId: 0-100 }
  const [downloaded, setDownloaded]   = useState(() => {
    // Primary source: dedicated arcade download key
    const dedicated = JSON.parse(localStorage.getItem("hugo_arcade_downloaded_v1") || "[]");
    // Fallback: also check the home screen list for any pre-existing arcade games
    const home = JSON.parse(localStorage.getItem("hugo_home_screen_utilities_v1") || "[]");
    const fromHome = home.filter(id => id.startsWith("arcade_")).map(id => id.slice("arcade_".length));
    return new Set([...dedicated, ...fromHome]);
  });

  const handlePinToHome = React.useCallback((gameId) => {
    if (downloading[gameId] !== undefined) return; // already downloading

    // Kick off App Store-style circular progress
    setDownloading(prev => ({ ...prev, [gameId]: 0 }));
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 6;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloading(prev => ({ ...prev, [gameId]: 100 }));

        // 1. Write to dedicated arcade download key (never overwritten by Dashboard)
        const dedicated = JSON.parse(localStorage.getItem(ARCADE_DL_KEY) || "[]");
        if (!dedicated.includes(gameId)) {
          localStorage.setItem(ARCADE_DL_KEY, JSON.stringify([...dedicated, gameId]));
        }

        // 2. Also add to home screen & installed lists for Dashboard to render icon
        const fullAppId = `arcade_${gameId}`;
        const savedHome = JSON.parse(localStorage.getItem("hugo_home_screen_utilities_v1") || "[]");
        const savedInst = JSON.parse(localStorage.getItem("hugo_installed_utilities_v2") || "[]");
        const updatedHome = [...new Set([...savedHome, fullAppId])];
        const updatedInst = [...new Set([...savedInst, fullAppId])];
        localStorage.setItem("hugo_home_screen_utilities_v1", JSON.stringify(updatedHome));
        localStorage.setItem("hugo_installed_utilities_v2", JSON.stringify(updatedInst));

        // 3. Tell the always-mounted Dashboard to refresh icons immediately
        window.dispatchEvent(new CustomEvent("hugo:app-installed", { detail: { appId: fullAppId } }));

        // 4. Update local downloaded state (no toast)
        setTimeout(() => {
          setDownloaded(prev => new Set([...prev, gameId]));
          setDownloading(prev => {
            const next = { ...prev };
            delete next[gameId];
            return next;
          });
        }, 400);
      } else {
        setDownloading(prev => ({ ...prev, [gameId]: progress }));
      }
    }, 100);
  }, [downloading, ARCADE_DL_KEY]);

  return (
    <>
      {/* ── HugoArcade Shell Lobby ─────────────────────────────────────────────────── */}
      <div className="arc" style={{ visibility: activeGame ? "hidden" : "visible" }}>
        <header className="arc-topbar bg-[#0a0a0f]/95 backdrop-blur-3xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all active:scale-95" aria-label="Quay lại">
              <span className="material-symbols-outlined text-base">arrow_back_ios_new</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF2D55] to-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,45,85,0.5)]">
                <span className="material-symbols-outlined text-white text-lg">sports_esports</span>
              </div>
              <span className="text-xl font-black tracking-tight text-white font-sans">
                Hugo<span className="text-[#FF2D55]">Arcade</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <JoyChip balance={joyBalance} />
            {!subscribed && (
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-[#FF2D55] to-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(255,45,85,0.5)] active:scale-95 hover:brightness-110 transition-all" onClick={() => setShowInvoice(true)}>
                Arcade Pro
              </button>
            )}
          </div>
        </header>

        {/* HugoArcade Category Bar — ONLY shown when on games tab */}
        {activeTab === "games" && (
          <div className="flex items-center gap-2.5 overflow-x-auto px-6 py-3 bg-[#0e0f18]/80 border-b border-white/5 no-scrollbar backdrop-blur-xl">
            {[
              { id: "all", label: "Tất Cả Game", icon: "grid_view" },
              { id: "featured", label: "Nổi Bật", icon: "star" },
              { id: "pvp", label: "Cờ Vua & Đối Kháng", icon: "sports_esports" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all active:scale-95 ${
                  selectedCategory === cat.id
                    ? "bg-[#FF2D55] text-white shadow-[0_0_16px_rgba(255,45,85,0.5)]"
                    : "bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        <main className="arc-main">
          {activeTab === "games" ? (
            <>
              {/* HugoArcade Hero Spotlight — Apple Arcade Liquid Glass Banner */}
              <div className="relative mx-6 mt-5 rounded-[32px] overflow-hidden border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] bg-gradient-to-r from-[#FF2D55]/30 via-purple-900/30 to-[#0e0f18] p-6 md:p-8 flex items-center justify-between gap-6 backdrop-blur-3xl">
                {/* Ambient Glow Orbits */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#FF2D55]/25 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/25 rounded-full blur-[80px] pointer-events-none" />

                <div className="z-10 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF2D55] text-white font-black text-[10px] uppercase tracking-widest mb-3 shadow-[0_4px_14px_rgba(255,45,85,0.5)]">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    HugoArcade Spotlight
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-white font-sans drop-shadow-md">
                    HugoChess AI 2500 &amp; Space Survivor
                  </h1>
                  <p className="text-xs md:text-sm text-zinc-200 mb-5 leading-relaxed font-sans font-medium">
                    Đỉnh cao Cờ Vua ELO 2500, Bắn Máy Bay Neon 3D &amp; Xếp Hình Neon 60 FPS.
                  </p>
                  <button
                    className="px-7 py-3 rounded-full bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-100 active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,255,255,0.3)] flex items-center gap-2"
                    onClick={() => openGame("chess")}
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                    CHƠI NGAY
                  </button>
                </div>

                {/* 3D Showcase Card (Right) */}
                <motion.div
                  className="hidden sm:flex flex-col items-center justify-center w-36 h-36 rounded-3xl bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-700 p-0.5 shadow-[0_15px_35px_rgba(255,45,85,0.45)] border border-white/40 cursor-pointer flex-shrink-0"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openGame("chess")}
                >
                  <div className="w-full h-full rounded-[22px] bg-black/30 backdrop-blur-md flex flex-col items-center justify-center gap-2 p-3 text-center border border-white/20">
                    <Castle size={38} strokeWidth={1.75} className="text-white filter drop-shadow-lg" />
                    <span className="text-[10px] font-black text-white tracking-wider font-mono uppercase bg-white/20 px-2.5 py-0.5 rounded-full border border-white/30">
                      ELO 2500
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Game Grid */}
              <div className="arc-section-hd px-6 mt-7">
                <div>
                  <p className="arc-section-hd-label uppercase tracking-widest text-[10px] font-black text-[#FF2D55]">Collection</p>
                  <h2 className="arc-section-hd-title text-xl font-black text-white">Thư Viện Trò Chơi Nổi Bật</h2>
                </div>
                <span className="arc-section-hd-count text-xs font-mono text-zinc-400">{filteredGames.length} Games</span>
              </div>

              <div className="arc-game-grid px-6">
                {filteredGames.map(g => {
                  const isDownloaded = downloaded.has(g.id);
                  const dlProgress   = downloading[g.id];
                  return (
                    <GameCard
                      key={g.id}
                      game={g}
                      profile={profile}
                      isLocked={g.id === "chess" ? !chessSubscribed : (g.id !== "2048" && !subscribed)}
                      isDownloaded={isDownloaded}
                      downloadProgress={dlProgress}
                      onPinToHome={handlePinToHome}
                      onClick={() => openGame(g.id)}
                    />
                  );
                })}
              </div>

              <div className="arc-stats-strip">
                <div className="arc-stat-box">
                  <small>Tổng ván</small>
                  <strong>{totalGames}</strong>
                </div>
                <div className="arc-stat-box">
                  <small>Chiến thắng</small>
                  <strong>{totalWins}</strong>
                </div>
                <div className="arc-stat-box">
                  <small>JOY hiện có</small>
                  <strong style={{ color: "var(--arc-joy)" }}>{(joyBalance ?? 0).toLocaleString("vi-VN")}</strong>
                </div>
              </div>
            </>
          ) : (
            /* Ranking tab — Hugo Arcade Leaderboard */
            <div className="px-6 py-6 pb-20">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-white font-sans tracking-tight">Bảng Xếp Hạng</h2>
                <p className="text-xs text-zinc-400 font-medium mt-1">Xếp hạng game thủ xuất sắc nhất toàn hệ thống.</p>
              </div>

              <ArcadeLeaderboard active={activeTab === "rank"} />
            </div>
          )}
        </main>

        <nav className="arc-navbar bg-[#0a0a0f]/95 border-t border-white/10 backdrop-blur-2xl">
          <button className={`arc-nav-btn ${activeTab === "games" ? "active" : ""}`} onClick={() => setTab("games")}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: activeTab === "games" ? "'FILL' 1" : "" }}>sports_esports</span>
            <span>Trò chơi</span>
          </button>
          <button className={`arc-nav-btn ${activeTab === "rank" ? "active" : ""}`} onClick={() => setTab("rank")}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: activeTab === "rank" ? "'FILL' 1" : "" }}>leaderboard</span>
            <span>Xếp hạng</span>
          </button>
        </nav>
      </div>

      {/* ── Active Game (standalone shell) ── */}
      {activeGame && (
        <StandaloneGameShell
          gameId={activeGame}
          bio={bio}
          onBioUpdate={onBioUpdate}
          onClose={closeGame}
        />
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
