import React, { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../../i18n/languages";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

import { Blocks, Swords, Castle, Infinity as InfinityIcon, Rocket, Disc } from "lucide-react";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
// Lazy: vỏ game kéo theo game-shell.css (73 KB) + mã game. UtilityPublicPage
// vốn đã lazy nó; import tĩnh ở đây bắt mọi thành viên chỉ mở tab Arcade phải
// tải hết dù chưa bấm chơi. Chỗ dùng nằm sau điều kiện nên lazy được.
const StandaloneGameShell = lazy(() => import("./StandaloneGameShell"));
import BackButton from "../shared/BackButton";

import { fetchProfile } from "../../../services/arcadeApi";
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
const GAMES = [
  { id: "pinball",  name: "Hugo CyberPinball 3D", Icon: Disc, studio: true },
  { id: "chess",    name: "HugoChess Table 3D",  Icon: Castle, studio: true },
  { id: "survivor", name: "Hugo Space Survivor", Icon: Rocket, studio: true },
  { id: "snake",    name: "Hugo Snake 3D Pro",   Icon: InfinityIcon, studio: true },
  { id: "caro",     name: "Caro 5 Arena",        Icon: Swords, studio: true },
  { id: "2048",     name: "2048 Mega Fusion",    Icon: Blocks, creditKey: "arcadeGame.credit2048" },
];

// Game được đưa lên thẻ "Tâm điểm" đầu trang.
const FEATURED = GAMES[0];

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

// Một hàng trong danh sách kiểu App Store: icon squircle · tên/mô tả · nút NHẬN.
const GameRow = React.memo(function GameRow({ game, profile, isLocked, isDownloaded, downloadProgress, onPinToHome, onClick }) {
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
        <p className="arc-row__sub">{t(`arcadeIntro.games.${game.id}.title`)}</p>
        {game.studio ? (
          <p className="arc-row__studio">
            <span className="material-symbols-outlined">verified</span>
            {t("arcadeGame.exclusive")}
          </p>
        ) : game.creditKey ? (
          <p className="arc-row__studio arc-row__studio--credit">{t(game.creditKey)}</p>
        ) : null}
        <p className="arc-row__meta">
          {t(`arcadeIntro.games.${game.id}.eyebrow`)}{best ? ` ${t("arcadeGame.bestScore", { score: best.toLocaleString(locale) })}` : ""}
        </p>
      </div>

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
          <span>{t("arcadeGame.getApp")}</span>
          {isLocked && <small className="arc-get__price">{priceLabel}</small>}
        </button>
      )}
    </div>
  );
});

// ─── Main ──────────────────────────────────────────────────────────
export default function HugoArcadeTab({ onBack, bio, onBioUpdate, showToast }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
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
    if (!res.ok) throw new Error(data.error || t("arcadeGame.exchangeError"));
    return data;
  }, [bio?.email]);

  const handleSuccess = React.useCallback((data) => {
    useJoyStore.getState().setBalance(data.balance);
    onBioUpdate?.({ ...bio, featureSubscriptions: { ...(bio.featureSubscriptions || {}), hugoArcade: { active: true, expiresAt: data.expiresAt } } });
  }, [bio, onBioUpdate]);

  const [selectedCategory, setSelectedCategory] = useState("all");

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
        {/* Nav bar iOS: tiêu đề nhỏ chỉ hiện sau khi large title cuộn khuất. */}
        <header className={`arc-topbar${scrolled ? " is-scrolled" : ""}`}>
          <div className="arc-col">
            <BackButton onClick={onBack} iconOnly />
            <span className="arc-topbar-title">{activeTab === "rank" ? t("arcadeGame.rankTitle") : "Hugo Arcade"}</span>
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

                <section className="arc-feature" data-game={FEATURED.id}>
                  <div
                    className="arc-feature__art"
                    role="button"
                    tabIndex={0}
                    aria-label={t("arcadeGame.playGame", { game: FEATURED.name })}
                    onClick={() => openGame(FEATURED.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openGame(FEATURED.id); } }}
                  >
                    <span className="arc-feature__kicker">{t("arcadeGame.spotlight")}</span>
                    <FEATURED.Icon size={64} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <div className="arc-feature__bar">
                    <div className="arc-feature__body">
                      <strong>{FEATURED.name}</strong>
                      <span>{t(`arcadeIntro.games.${FEATURED.id}.title`)}</span>
                    </div>
                    <button type="button" className="arc-get" onClick={() => openGame(FEATURED.id)}>
                      <span>{t("arcadeGame.play")}</span>
                    </button>
                  </div>
                </section>

                <div className="arc-section-hd">
                  <h2 className="arc-section-hd-title">{t("arcadeGame.gamesTitle")}</h2>
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
                    <small>{t("arcadeGame.totalMatches")}</small>
                    <strong>{totalGames}</strong>
                  </div>
                  <div className="arc-stat-box">
                    <small>{t("arcadeGame.wins")}</small>
                    <strong>{totalWins}</strong>
                  </div>
                  <div className="arc-stat-box arc-stat-box--balance">
                    <small>{t("memberPortal.walletApp.balanceLabel")}</small>
                    <strong title={joyText(joyBalance ?? 0)}>{joyText(joyBalance ?? 0)}</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="arc-largetitle">
                  <h1>{t("arcadeGame.rankTitle")}</h1>
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
      <Suspense fallback={<div className="fixed inset-0 z-50 grid place-items-center bg-black"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white" /></div>}>
      {activeGame && (
        <StandaloneGameShell
          gameId={activeGame}
          bio={bio}
          onClose={closeGame}
        />
      )}
      </Suspense>

      <JoyExchangeModal
        open={showInvoice} bio={bio} item="hugoArcade"
        onClose={() => setShowInvoice(false)}
        onConfirm={handleConfirmCharge}
        onSuccess={handleSuccess}
      />
    </>
  );
}
