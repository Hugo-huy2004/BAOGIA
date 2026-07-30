import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

import { Blocks, Swords, Castle, Keyboard, Grid3X3, Infinity as InfinityIcon, Rocket, Zap } from "lucide-react";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
import StandaloneGameShell from "./StandaloneGameShell";
import BackButton from "../shared/BackButton";

import { fetchProfile } from "../../../services/arcadeApi";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import memberService from "../../../services/classes/MemberService";
import { appInstallationPolicy } from "../../../../shared/appInstallationPolicy";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import "./arcade-theme.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
const ARCADE_DL_KEY = "hugo_arcade_downloaded_v1";
const INSTALLED_APPS_KEY = "hugo_installed_utilities_v2";
const HOME_SCREEN_APPS_KEY = "hugo_home_screen_utilities_v1";

const readStoredList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const GAMES = [
  { id: "chess",     name: "HugoChess Table 3D", tagline: "Đấu BOT hoặc hai người trên cùng thiết bị.", label: "Cờ Vua · Offline Table", Icon: Castle },
  { id: "survivor",  name: "Hugo Space Survivor",tagline: "Không chiến Neon 3D & 4 lớp Boss.", label: "Bắn Súng 3D · Multi-Boss", Icon: Rocket },
  { id: "flappy",    name: "Hugo Flappy Cyber",   tagline: "Vượt chướng không gian Slow-Motion.", label: "Cyberpunk 3D", Icon: Zap },
  { id: "tetris",    name: "Hugo Tetris Neon",  tagline: "Xếp hình Neon 3D 60 FPS.", label: "Xếp Hình Neon", Icon: Grid3X3 },
  { id: "2048",      name: "2048 Mega Fusion",  tagline: "Gộp số 2048. Phá giới hạn điểm.", label: "Trí Tuệ · Logic", Icon: Blocks },
  { id: "caro",      name: "Caro 3×3 Arena",    tagline: "Ba quân tạo nên chiến thắng.", label: "Đối Kháng · AI 3 Cấp", Icon: Swords },
  { id: "wordguess", name: "Mật Mã Từ 3D",      tagline: "Từ Hán-Việt tri thức.", label: "Từ Vựng · Thẻ Lật", Icon: Keyboard },
  { id: "snake",     name: "Hugo Snake 3D Pro", tagline: "Rắn săn mồi Khối Cầu Neon 3D.", label: "Cổ Điển 3D", Icon: InfinityIcon },
];

// Game được đưa lên thẻ "Tâm điểm" đầu trang.
const FEATURED = GAMES[0];

const CATEGORIES = [
  { id: "all",      label: "Tất cả" },
  { id: "featured", label: "Nổi bật" },
  { id: "pvp",      label: "Đối kháng" },
];

// ─── Sub-components ────────────────────────────────────────────────

const JoyChip = React.memo(function JoyChip({ balance }) {
  return (
    <div className="arc-joy-chip">
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
      <span>{(balance ?? 0).toLocaleString("vi-VN")}</span>
      <small>JOY</small>
    </div>
  );
});

// Một hàng trong danh sách kiểu App Store: icon squircle · tên/mô tả · nút NHẬN.
const GameRow = React.memo(function GameRow({ game, profile, isLocked, isDownloaded, downloadProgress, onPinToHome, onClick }) {
  const best  = profile?.[game.id]?.bestScore || 0;
  const priceLabel = game.id === "chess" ? "299 JOY" : "199 JOY";
  const isDownloading = downloadProgress !== undefined;

  // Vòng tiến trình tròn (App Store)
  const radius = 9;
  const circ   = 2 * Math.PI * radius;
  const strokeDash = isDownloading ? circ * (1 - (downloadProgress / 100)) : circ;

  return (
    <div
      className="arc-row"
      data-game={game.id}
      role="button"
      tabIndex={0}
      onClick={isDownloading ? undefined : onClick}
      onKeyDown={(e) => { if (!isDownloading && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
    >
      <div className="arc-row__icon">
        <game.Icon size={30} strokeWidth={1.75} aria-hidden="true" />
      </div>

      <div className="arc-row__body">
        <p className="arc-row__name">{game.name}</p>
        <p className="arc-row__sub">{game.tagline}</p>
        <p className="arc-row__meta">
          {game.label}{best ? ` · Kỷ lục ${best.toLocaleString("vi-VN")}` : ""}
        </p>
      </div>

      {isDownloading ? (
        <button type="button" className="arc-get" disabled onClick={(e) => e.stopPropagation()} aria-label={`Đang tải ${downloadProgress}%`}>
          <span>
            <svg width="22" height="22" viewBox="0 0 22 22" style={{ transform: "rotate(-90deg)" }} aria-hidden="true">
              <circle cx="11" cy="11" r={radius} fill="none" stroke="currentColor" strokeWidth="2" opacity=".25" />
              <circle
                cx="11" cy="11" r={radius}
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={strokeDash}
                style={{ transition: "stroke-dashoffset .12s linear" }}
              />
            </svg>
            {downloadProgress}%
          </span>
        </button>
      ) : isDownloaded ? (
        <button type="button" className="arc-get" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          <span>MỞ</span>
        </button>
      ) : (
        <button type="button" className="arc-get" onClick={(e) => { e.stopPropagation(); onPinToHome(game.id); }}>
          <span>NHẬN</span>
          {isLocked && <small className="arc-get__price">{priceLabel}</small>}
        </button>
      )}
    </div>
  );
});

// ─── Main ──────────────────────────────────────────────────────────
export default function HugoArcadeTab({ onBack, bio, onBioUpdate, showToast }) {
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
  const [scrolled, setScrolled] = useState(false);

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

  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredGames = GAMES.filter((g) => {
    if (selectedCategory === "featured") return g.id === "chess" || g.id === "survivor" || g.id === "tetris";
    if (selectedCategory === "pvp") return g.id === "chess" || g.id === "caro";
    return true;
  });

  // ── App Store Download State ────────────────────────────────────────
  // Use a dedicated key so Dashboard's homeScreenApps sync never overwrites it
  const [downloading, setDownloading] = useState({}); // { gameId: 0-100 }
  const [downloaded, setDownloaded]   = useState(() => {
    // Primary source: dedicated arcade download key
    const dedicated = readStoredList(ARCADE_DL_KEY);
    // Fallback: also check the home screen list for any pre-existing arcade games
    const home = readStoredList(HOME_SCREEN_APPS_KEY);
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
        const dedicated = readStoredList(ARCADE_DL_KEY);
        if (!dedicated.includes(gameId)) {
          localStorage.setItem(ARCADE_DL_KEY, JSON.stringify([...dedicated, gameId]));
        }

        // 2. Also add to home screen & installed lists for Dashboard to render icon
        const fullAppId = `arcade_${gameId}`;
        const savedHome = readStoredList(HOME_SCREEN_APPS_KEY);
        const savedInst = readStoredList(INSTALLED_APPS_KEY);
        const updatedInst = appInstallationPolicy.normalizeInstalled([
          ...(Array.isArray(bio?.installedUtilities) ? bio.installedUtilities : []),
          ...savedInst,
          fullAppId,
        ]);
        const updatedHome = appInstallationPolicy.normalizeHomeScreen([
          ...(Array.isArray(bio?.homeScreenUtilities) ? bio.homeScreenUtilities : []),
          ...savedHome,
          fullAppId,
        ], updatedInst);
        localStorage.setItem(HOME_SCREEN_APPS_KEY, JSON.stringify(updatedHome));
        localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(updatedInst));

        // 3. Tell the always-mounted Dashboard to refresh icons immediately
        window.dispatchEvent(new CustomEvent("hugo:app-installed", { detail: { appId: fullAppId } }));

        // 4. Persist the install so it also appears on the user's other devices.
        if (bio?._id && bio._id !== "guest") {
          memberService.updateMemberBio(bio._id, {
            installedUtilities: updatedInst,
            homeScreenUtilities: updatedHome,
          }).then((response) => {
            if (response?.bio) onBioUpdate?.(response.bio);
          }).catch(() => {
            // Offline-first: the local install remains available.
          });
        }

        // 5. Update local downloaded state and confirm the action.
        setTimeout(() => {
          setDownloaded(prev => new Set([...prev, gameId]));
          setDownloading(prev => {
            const next = { ...prev };
            delete next[gameId];
            return next;
          });
          const game = GAMES.find((item) => item.id === gameId);
          showToast?.(`${game?.name || "Trò chơi"} đã được thêm vào Ứng dụng.`, "success");
        }, 400);
      } else {
        setDownloading(prev => ({ ...prev, [gameId]: progress }));
      }
    }, 100);
  }, [bio, downloading, onBioUpdate, showToast]);

  return (
    <>
      {/* ── HugoArcade Shell Lobby ─────────────────────────────────────────────────── */}
      <div className="arc" style={{ visibility: activeGame ? "hidden" : "visible" }}>
        {/* Nav bar iOS: tiêu đề nhỏ chỉ hiện sau khi large title cuộn khuất. */}
        <header className={`arc-topbar${scrolled ? " is-scrolled" : ""}`}>
          <div className="arc-col">
            <BackButton onClick={onBack} iconOnly />
            <span className="arc-topbar-title">{activeTab === "rank" ? "Xếp hạng" : "Hugo Arcade"}</span>
            <JoyChip balance={joyBalance} />
            {!subscribed && (
              <button type="button" className="arc-text-btn" onClick={() => setShowInvoice(true)}>
                Pro
              </button>
            )}
          </div>
        </header>

        <main className="arc-main" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 24)}>
          <div className="arc-col">
            {activeTab === "games" ? (
              <>
                <div className="arc-largetitle">
                  <h1>Hugo Arcade</h1>
                  <p>Chơi ngay trong Hugo — không quảng cáo.</p>
                </div>

                <div className="arc-seg" role="tablist" aria-label="Lọc trò chơi">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedCategory === cat.id}
                      className={selectedCategory === cat.id ? "active" : ""}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <section className="arc-feature" data-game={FEATURED.id}>
                  <div
                    className="arc-feature__art"
                    role="button"
                    tabIndex={0}
                    aria-label={`Chơi ${FEATURED.name}`}
                    onClick={() => openGame(FEATURED.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGame(FEATURED.id); } }}
                  >
                    <span className="arc-feature__kicker">Tâm điểm hôm nay</span>
                    <FEATURED.Icon size={64} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div className="arc-feature__bar">
                    <div className="arc-feature__body">
                      <strong>{FEATURED.name}</strong>
                      <span>{FEATURED.tagline}</span>
                    </div>
                    <button type="button" className="arc-get" onClick={() => openGame(FEATURED.id)}>
                      <span>CHƠI</span>
                    </button>
                  </div>
                </section>

                <div className="arc-section-hd">
                  <h2 className="arc-section-hd-title">Trò chơi</h2>
                  <span className="arc-section-hd-count">{filteredGames.length} trò chơi</span>
                </div>

                <div className="arc-list">
                  {filteredGames.map((g) => (
                    <GameRow
                      key={g.id}
                      game={g}
                      profile={profile}
                      isLocked={g.id === "chess" ? !chessSubscribed : (g.id !== "2048" && !subscribed)}
                      isDownloaded={downloaded.has(g.id)}
                      downloadProgress={downloading[g.id]}
                      onPinToHome={handlePinToHome}
                      onClick={() => openGame(g.id)}
                    />
                  ))}
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
                    <small>JOY</small>
                    <strong>{(joyBalance ?? 0).toLocaleString("vi-VN")}</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="arc-largetitle">
                  <h1>Xếp hạng</h1>
                  <p>Game thủ xuất sắc nhất toàn hệ thống.</p>
                </div>
                <div className="arc-rank-body">
                  <ArcadeLeaderboard active={activeTab === "rank"} />
                </div>
              </>
            )}
          </div>
        </main>

        <nav className={`arc-navbar${scrolled ? " is-compact" : ""}`}>
          <button type="button" className={`arc-nav-btn ${activeTab === "games" ? "active" : ""}`} onClick={() => setTab("games")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "games" ? "'FILL' 1" : "" }}>sports_esports</span>
            <span>Trò chơi</span>
          </button>
          <button type="button" className={`arc-nav-btn ${activeTab === "rank" ? "active" : ""}`} onClick={() => setTab("rank")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "rank" ? "'FILL' 1" : "" }}>leaderboard</span>
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
