import React, { useState, useEffect, lazy, Suspense } from "react";
import LazyBoundary from "../os/LazyBoundary";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../../i18n/languages";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { startViewTransition } from "../../../utils/viewTransitions";

import { Blocks, Swords, Castle, Infinity as InfinityIcon } from "lucide-react";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
// Lazy: vỏ game kéo theo game-shell.css (73 KB) + mã game. UtilityPublicPage
// vốn đã lazy nó; import tĩnh ở đây bắt mọi thành viên chỉ mở tab Arcade phải
// tải hết dù chưa bấm chơi. Chỗ dùng nằm sau điều kiện nên lazy được.
const StandaloneGameShell = lazy(() => import("./StandaloneGameShell"));


import { fetchProfile } from "../../../services/api/modules/arcadeApi";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import { useArcadeSound } from "../../../hooks/useArcadeSound";
import { isEventActive } from "../../../utils/joyCalculation";
import { useAppInstall, readStoredList, HOME_SCREEN_APPS_KEY } from "../../../hooks/useAppInstall";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import "./arcade-theme.css";
import { joyText } from "../../../lib/joyDisplay";

// Cổng 8081 là mặc định của Metro/Expo và nó trả HTML 200 cho MỌI đường dẫn,
// nên gọi API "thành công" mà nhận về một trang web. Backend là 8099, và ở dev
// thì đi qua proxy của Vite bằng đường dẫn tương đối như phần còn lại của app.
const API_BASE = import.meta.env.VITE_API_URL || "/api";

// `studio: true` = game do Hugo Studio tự dựng từ đầu (luật thuộc phạm vi công
// cộng hoặc do chính hệ thống thiết kế) → được gắn nhãn "Độc quyền". Game dựa
// trên thiết kế của người khác thì ghi `credit` thay vì nhãn độc quyền — không
// nhận vơ, và cũng là lý do 3 game clone (xếp khối tetromino, chim bay qua ống,
// đoán từ kiểu Wordle) đã bị gỡ khỏi hệ thống.
// Tên game là danh từ riêng nên giữ nguyên mọi ngôn ngữ. Câu giới thiệu và
// nhãn thể loại lấy thẳng từ `arcadeIntro.games.*` — bộ chữ đó đã được dịch tay
// cho cả 9 ngôn ngữ, chép lại ở đây là tự tạo ra bản thứ hai để lệch nhau.
// Pinball và Space Wars ẩn từ 25/10/2026 — sảnh chỉ còn 4 game hiện hành. Mã
// game vẫn giữ (StandaloneGameShell), thêm lại một dòng ở đây là hiện lại.
const GAMES = [
  { id: "chess",    name: "HugoChess Table 3D",  Icon: Castle, studio: true },
  { id: "snake",    name: "Snake 3D: Vương Quốc Trái Cây", Icon: InfinityIcon, studio: true },
  { id: "caro",     name: "Caro 5 Arena",        Icon: Swords, studio: true },
  { id: "2048",     name: "2048 Mega Fusion",    Icon: Blocks, creditKey: "arcadeGame.credit2048" },
];

// Thẻ "Tâm điểm" đầu trang tự xoay vòng qua các game.
const SPOTLIGHT_MS = 5000;

const CATEGORIES = [
  { id: "all",    labelKey: "arcadeGame.catAll" },
  { id: "studio", labelKey: "arcadeGame.catStudio" },
  { id: "pvp",    labelKey: "arcadeGame.catPvp" },
];

// ─── Sub-components ────────────────────────────────────────────────

const JoyChip = React.memo(function JoyChip({ balance }) {
  return (
    <div className="arc-joy-chip">
      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
      <span>{joyText(balance ?? 0)}</span>
    </div>
  );
});

// Thẻ game: ảnh bìa màu riêng của game (icon bồng bềnh) + tên + nút NHẬN/MỞ.
// `--i` là thứ tự để thẻ hiện lần lượt thay vì bật ra cùng lúc.
const GameCard = React.memo(function GameCard({ game, index, profile, isLocked, isDownloaded, downloadProgress, onPinToHome, onClick }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const best  = profile?.[game.id]?.bestScore || 0;
  const priceLabel = joyText(game.id === "chess" ? 299 : 199);
  const isDownloading = downloadProgress !== undefined;

  // Vòng tiến trình tròn (App Store)
  const radius = 9;
  const circ   = 2 * Math.PI * radius;
  const strokeDash = isDownloading ? circ * (1 - (downloadProgress / 100)) : circ;

  return (
    <div
      className="arc-card"
      data-game={game.id}
      style={{ "--i": index }}
      role="button"
      tabIndex={0}
      aria-label={t("arcadeGame.playGame", { game: game.name })}
      onClick={isDownloading ? undefined : onClick}
      onKeyDown={(e) => { if (!isDownloading && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
    >
      <div className="arc-card__art">
        <span className="arc-card__orb" aria-hidden="true" />
        <game.Icon className="arc-card__icon" size={46} strokeWidth={1.6} aria-hidden="true" />
        {best > 0 && (
          <span className="arc-card__best">
            <span className="material-symbols-outlined">emoji_events</span>
            {best.toLocaleString(locale)}
          </span>
        )}
      </div>

      <div className="arc-card__body">
        <p className="arc-card__name">{game.name}</p>
        <p className="arc-card__sub">{t(`arcadeIntro.games.${game.id}.title`)}</p>
        {game.studio ? (
          <p className="arc-card__studio">
            <span className="material-symbols-outlined">verified</span>
            {t("arcadeGame.exclusive")}
          </p>
        ) : game.creditKey ? (
          <p className="arc-card__studio arc-card__studio--credit">{t(game.creditKey)}</p>
        ) : null}
      </div>

      <div className="arc-card__foot">
        {isDownloading ? (
          <button type="button" className="arc-get" disabled onClick={(e) => e.stopPropagation()} aria-label={t("arcadeGame.downloading", { percent: downloadProgress })}>
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
            <span>{t("arcadeGame.openApp")}</span>
          </button>
        ) : (
          <button type="button" className="arc-get" onClick={(e) => { e.stopPropagation(); onPinToHome(game.id); }}>
            <span>{t("arcadeGame.getApp")}{isLocked && <small className="arc-get__price">{priceLabel}</small>}</span>
          </button>
        )}
      </div>
    </div>
  );
});

// ─── Main ──────────────────────────────────────────────────────────
/*
 * Nút X đỏ của portal (góc trên-phải) đóng app; nút lùi góc trên-trái là đường
 * ra quen tay hơn: ở tab Xếp hạng thì về sảnh, ở sảnh thì gọi `onBack`.
 */
export default function HugoArcadeTab({ bio, onBioUpdate, showToast, onBack }) {
  const { t } = useTranslation();
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

  const setTab = React.useCallback((t) => {
    startViewTransition(() => {
      setSearchParams(p => { p.set("tab", t); return p; }, { replace: true });
    });
  }, [setSearchParams]);

  const openGame = React.useCallback((id) => {
    playBeep();
    startViewTransition(() => {
      setSearchParams(p => { p.set("game", id); return p; }, { replace: true });
    });
  }, [playBeep, setSearchParams]);

  const closeGame = React.useCallback(() => {
    startViewTransition(() => {
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
    });
  }, [isFromUtilities, navigate, setSearchParams]);

  const handleConfirmCharge = React.useCallback(async () => {
    const res = await fetch(`${API_BASE}/joy/subscribe-feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bio.email, featureKey: "hugoArcade" })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t("arcadeGame.exchangeError"));
    return data;
  }, [bio?.email]);

  const handleSuccess = React.useCallback((data) => {
    useJoyStore.getState().setBalance(data.balance);
    onBioUpdate?.({ ...bio, featureSubscriptions: { ...(bio.featureSubscriptions || {}), hugoArcade: { active: true, expiresAt: data.expiresAt } } });
  }, [bio, onBioUpdate]);

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [spotIdx, setSpotIdx] = useState(0);
  const spotlight = GAMES[spotIdx];
  const lobbyVisible = !activeGame && activeTab === "games";
  useEffect(() => {
    if (!lobbyVisible) return undefined;
    const id = setInterval(() => setSpotIdx((i) => (i + 1) % GAMES.length), SPOTLIGHT_MS);
    return () => clearInterval(id);
  }, [lobbyVisible, spotIdx]);

  const handleBack = activeTab === "rank" ? () => setTab("games") : onBack;

  const filteredGames = GAMES.filter((g) => {
    if (selectedCategory === "studio") return !!g.studio;
    if (selectedCategory === "pvp") return g.id === "chess" || g.id === "caro";
    return true;
  });

  // ── Tải game ────────────────────────────────────────────────────────
  // `installed` là nguồn duy nhất; trước đây màn này giữ một Set riêng rồi tự
  // cập nhật, nên cài/gỡ ở Thư viện không dội về đây.
  const { installed, progress: installProgress, install } = useAppInstall({ bio, onBioUpdate });

  const bareGameIds = (list) => list
    .filter((id) => String(id).startsWith("arcade_"))
    .map((id) => String(id).slice("arcade_".length));

  // Bản dựng cũ chỉ ghi game vào danh sách màn hình chính, nên vẫn phải ngó qua
  // đó, nếu không game cài từ lâu lại hiện nút Tải.
  const downloaded = React.useMemo(
    () => new Set([...bareGameIds(installed), ...bareGameIds(readStoredList(HOME_SCREEN_APPS_KEY))]),
    [installed],
  );

  // Tiến trình theo appId, còn màn này nói chuyện bằng gameId trần.
  const downloading = Object.fromEntries(
    Object.entries(installProgress).map(([appId, value]) => [appId.replace("arcade_", ""), value]),
  );

  // Tải game = cài một app tên `arcade_<id>`. Việc ghi ba kho, đẩy lên server
  // và báo cho các màn khác nằm ở `useAppInstall` — Arcade chỉ nói cái gì được
  // cài và báo lại cho người chơi.
  const handlePinToHome = React.useCallback((gameId) => {
    install(`arcade_${gameId}`, {
      onDone: () => {
        const game = GAMES.find((item) => item.id === gameId);
        showToast?.(t("arcadeGame.addedToApps", { game: game?.name || t("arcadeGame.gameFallback") }), "success");
      },
    });
  }, [install, showToast, t]);

  return (
    <>
      {/* ── HugoArcade Shell Lobby ─────────────────────────────────────────────────── */}
      <div className="arc" style={{ visibility: activeGame ? "hidden" : "visible" }}>
        {/* Nền cực quang: ba đốm màu trôi chậm sau nội dung. */}
        <div className="arc-aurora" aria-hidden="true"><i /><i /><i /></div>

        <header className={`arc-topbar${scrolled ? " is-scrolled" : ""}`}>
          <div className="arc-col">
            {handleBack && (
              <button type="button" className="arc-back" onClick={handleBack} aria-label={t("arcadeGame.back")}>
                <span className="material-symbols-outlined">arrow_back_ios_new</span>
              </button>
            )}
            <span className="arc-topbar-title">{activeTab === "rank" ? t("arcadeGame.rankTitle") : "Hugo Arcade"}</span>
            <JoyChip balance={joyBalance} />
            {!subscribed && (
              <button type="button" className="arc-pro-btn" onClick={() => setShowInvoice(true)}>
                <span className="material-symbols-outlined">workspace_premium</span>
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
                  <h1><span className="arc-gradient-text">Hugo Arcade</span></h1>
                  <p>{t("arcadeGame.noAds")}</p>
                </div>

                {/* Saturday 2× JOY event banner */}
                {isEventActive() && (
                  <div className="arc-event-banner">
                    <span className="material-symbols-outlined">church</span>
                    <div>
                      <p className="arc-event-banner__title">{t("arcadeGame.eventSaturdayTitle")}</p>
                      <p className="arc-event-banner__desc">{t("arcadeGame.eventSaturdayDesc")}</p>
                    </div>
                  </div>
                )}

                {/* key theo game → mỗi lần xoay là một lượt hoạt cảnh vào mới. */}
                <section className="arc-feature" data-game={spotlight.id} key={spotlight.id}>
                  <div
                    className="arc-feature__art"
                    role="button"
                    tabIndex={0}
                    aria-label={t("arcadeGame.playGame", { game: spotlight.name })}
                    onClick={() => openGame(spotlight.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGame(spotlight.id); } }}
                  >
                    <span className="arc-feature__sparks" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
                    <span className="arc-feature__ring" aria-hidden="true" />
                    <span className="arc-feature__kicker">
                      <span className="material-symbols-outlined">local_fire_department</span>
                      {t("arcadeGame.spotlight")}
                    </span>
                    <spotlight.Icon className="arc-feature__icon" size={84} strokeWidth={1.4} aria-hidden="true" />
                    <div className="arc-feature__caption">
                      <strong>{spotlight.name}</strong>
                      <span>{t(`arcadeIntro.games.${spotlight.id}.title`)}</span>
                    </div>
                    <span className="arc-feature__play">
                      <span className="material-symbols-outlined">play_arrow</span>
                      {t("arcadeGame.play")}
                    </span>
                  </div>
                </section>
                <div className="arc-dots" role="tablist" aria-label={t("arcadeGame.spotlight")}>
                  {GAMES.map((g, i) => (
                    <button
                      key={g.id}
                      type="button"
                      role="tab"
                      aria-selected={i === spotIdx}
                      aria-label={g.name}
                      data-game={g.id}
                      className={i === spotIdx ? "active" : ""}
                      onClick={() => setSpotIdx(i)}
                    />
                  ))}
                </div>

                <div className="arc-seg" role="tablist" aria-label={t("arcadeGame.filterGames")}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={selectedCategory === cat.id}
                      className={selectedCategory === cat.id ? "active" : ""}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {t(cat.labelKey)}
                    </button>
                  ))}
                </div>

                <div className="arc-section-hd">
                  <h2 className="arc-section-hd-title">{t("arcadeGame.gamesTitle")}</h2>
                  <span className="arc-section-hd-count">{filteredGames.length}</span>
                </div>

                <div className="arc-grid" key={selectedCategory}>
                  {filteredGames.map((g, i) => (
                    <GameCard
                      key={g.id}
                      game={g}
                      index={i}
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
                  <div className="arc-stat-box" data-stat="games">
                    <span className="material-symbols-outlined">sports_esports</span>
                    <small>{t("arcadeGame.totalMatches")}</small>
                    <strong>{totalGames}</strong>
                  </div>
                  <div className="arc-stat-box" data-stat="wins">
                    <span className="material-symbols-outlined">emoji_events</span>
                    <small>{t("arcadeGame.wins")}</small>
                    <strong>{totalWins}</strong>
                  </div>
                  <div className="arc-stat-box arc-stat-box--balance" data-stat="joy">
                    <span className="material-symbols-outlined">toll</span>
                    <small>{t("memberPortal.walletApp.balanceLabel")}</small>
                    <strong title={joyText(joyBalance ?? 0)}>{joyText(joyBalance ?? 0)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="arc-largetitle">
                  <h1><span className="arc-gradient-text">{t("arcadeGame.rankTitle")}</span></h1>
                  <p>{t("arcadeGame.rankDesc")}</p>
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
            <span>{t("arcadeGame.gamesTitle")}</span>
          </button>
          <button type="button" className={`arc-nav-btn ${activeTab === "rank" ? "active" : ""}`} onClick={() => setTab("rank")}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "rank" ? "'FILL' 1" : "" }}>leaderboard</span>
            <span>{t("arcadeGame.rankTitle")}</span>
          </button>
        </nav>
      </div>

      {/* ── Active Game (standalone shell) ── */}
      {/* Mỗi game là một chunk riêng. Chunk tải hỏng (mất mạng, hoặc bản deploy
          mới xoá chunk cũ khi tab đang mở) mà không có ranh giới lỗi thì lỗi vọt
          lên làm TRẮNG CẢ PORTAL, không riêng game đó. `resetKey` theo gameId để
          một game lỗi không khoá luôn game tiếp theo người chơi mở. */}
      <LazyBoundary resetKey={activeGame} onBack={closeGame} backLabel={t("arcadeGame.backToArcade", "Về sảnh game")}>
        <Suspense fallback={<div className="fixed inset-0 z-50 grid place-items-center bg-black"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" /></div>}>
          {activeGame && (
            <StandaloneGameShell
              gameId={activeGame}
              bio={bio}
              onClose={closeGame}
            />
          )}
        </Suspense>
      </LazyBoundary>

      <JoyExchangeModal
        open={showInvoice} bio={bio} item="hugoArcade"
        onClose={() => setShowInvoice(false)}
        onConfirm={handleConfirmCharge}
        onSuccess={handleSuccess}
      />
    </>
  );
}
