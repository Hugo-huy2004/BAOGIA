import { useState, useEffect, useRef, useCallback, useMemo, useDeferredValue, memo } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { cinemaService, mediaUrl, videoSources } from "../../../services/classes/Cinema/CinemaService";
import RadioTokenStatus, { RadioStoreModal, useRadioHeartbeat } from "../RadioTokenStatus";
import { CINEMA_CATEGORIES } from "../../../../shared/cinemaCategories";
import BackButton from "../shared/BackButton";
import { hapticSelect } from "../../../utils/haptics";

/**
 * Chill Premium — rạp phim công cộng của portal, dựng theo lối Netflix.
 *
 * Ba màn: kệ phim (hero + các hàng ngang), chi tiết phim, trình phát toàn màn
 * hình. Bản trước tự vẽ bộ điều khiển video (thanh tiến trình, nút play, đồng
 * hồ) mà không có tốc độ phát, phụ đề, PiP hay điều khiển bằng bàn phím; ở đây
 * dùng `<video controls>` của trình duyệt nên có sẵn tất cả mà không viết dòng
 * nào. 545 dòng cinema-theme.css cũng đã xoá: app khoá theme TỐI bằng class
 * `dark` của portal nên vẫn dùng lại được token màu và hai component ví token
 * của HugoRadio y nguyên.
 *
 * Ba luật của app này:
 *   • XEM TỐN TOKEN, KHÔNG SINH JOY. Thời gian xem trừ vào đúng bộ đếm token
 *     của HugoRadio (5 giờ/tuần, giờ cao điểm nhân đôi) — cùng `bio.radioTokens`
 *     ở máy chủ, cùng hook `useRadioHeartbeat`, cùng cửa mua thêm.
 *   • MỘT lượt gọi API cho cả app. Thư viện chỉ vài chục phim nên tải một lần
 *     rồi lọc/tìm ngay tại máy: SWR gộp mọi lần mở app trong 5 phút thành một
 *     request, còn máy chủ trả kèm Cache-Control nên lần mở sau không chạm
 *     Render. Video và ảnh KHÔNG bao giờ đi qua máy chủ của mình.
 *   • Mỗi phim có NHIỀU nguồn phát và trình phát tự đổi nguồn (`videoSources`):
 *     đường từ Việt Nam tới máy dữ liệu của Internet Archive hay chết giữa
 *     chừng, một URL chết không được phép thành một phim chết.
 */

const PROGRESS_SAVE_EVERY_MS = 5000;
// Không nhích được giây nào trong ngần này thì coi như nguồn không tới nơi —
// đổi nguồn còn hơn để người xem nhìn vòng xoay tới lúc bỏ cuộc.
const STALL_TIMEOUT_MS = 12000;
const RAILS = CINEMA_CATEGORIES.filter((item) => item.id !== "all");

/**
 * Nhãn độ nét lấy từ chiều cao THẬT của bản phát (máy chủ đọc từ Internet
 * Archive). Trường `badge` cũ mặc định "4K Ultra HD" cho mọi phim, kể cả bản
 * quét 320×240 — nên nó đã bị bỏ. Dưới 720p thì không gắn nhãn gì.
 */
function qualityLabel(height) {
  if (height >= 2160) return "4K";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "HD";
  return "";
}

function handleImageFallback(event, rawUrl) {
  const img = event.currentTarget;
  if (rawUrl && !img.dataset.triedDirect) {
    img.dataset.triedDirect = "true";
    img.src = rawUrl;
  } else {
    img.style.visibility = "hidden";
  }
}

function getNetworkState() {
  if (typeof navigator === "undefined") return { type: "Wi-Fi", speed: "Tốt", mbps: 25, recommended: "1080p" };
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return { type: "Wi-Fi/LAN", speed: "Tốt", mbps: 25, recommended: "1080p" };

  const mbps = conn.downlink ? Math.round(conn.downlink) : 15;
  const type = (conn.effectiveType || "4g").toUpperCase();
  let recommended = "1080p";
  if (mbps < 3) recommended = "480p";
  else if (mbps < 8) recommended = "720p";

  return {
    type: type === "4G" ? "4G/Wi-Fi" : type,
    speed: `${mbps} Mbps`,
    mbps,
    recommended,
  };
}

function useNetworkQuality() {
  const [networkInfo, setNetworkInfo] = useState(() => getNetworkState());

  useEffect(() => {
    if (typeof navigator === "undefined") return undefined;
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return undefined;

    const update = () => setNetworkInfo(getNetworkState());
    conn.addEventListener("change", update);
    return () => conn.removeEventListener("change", update);
  }, []);

  return networkInfo;
}

export default function HugoCinemaTab({ bio, onBack, showToast }) {
  const { t, i18n } = useTranslation();
  const network = useNetworkQuality();

  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [fullDescription, setFullDescription] = useState(false);

  const [progress, setProgress] = useState(() => cinemaService.getProgress());
  const [saved, setSaved] = useState(() => cinemaService.getSavedIds());
  const [liked, setLiked] = useState(() => cinemaService.getLikedIds());

  const [isPlaying, setIsPlaying] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  // Chỉ luồng .m3u8 mới có nhiều mức; mp4 để mảng rỗng nên nút chọn tự ẩn.
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(-1);

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const lastSaveRef = useRef(0);
  const lastProgressRef = useRef(0);

  // Hạn mức xem = hạn mức nghe radio. Đồng hồ chỉ chạy khi video phát thật:
  // `onWaiting` tắt nó, nên thời gian ngồi chờ mạng không bị tính tiền.
  const { tokenStatus, loading: tokenLoading, refetch: refetchTokens } = useRadioHeartbeat(bio, isPlaying);
  const outOfTokens = Boolean(tokenStatus && !tokenStatus.canListen);

  const { data: library = [], isLoading } = useSWR(
    "cinema/library",
    () => cinemaService.getMovies({ limit: 100 }),
    { revalidateOnFocus: false, dedupingInterval: 300000, keepPreviousData: true }
  );

  const compact = useMemo(
    () => new Intl.NumberFormat(i18n.language, { notation: "compact", maximumFractionDigits: 1 }),
    [i18n.language]
  );

  const describe = useCallback(
    (movie) => [
      movie.year || null,
      movie.duration || null,
      qualityLabel(movie.height) || null,
      movie.views > 0 ? t("cinema.views", { formatted: compact.format(movie.views) }) : null,
    ].filter(Boolean).join(" · "),
    [compact, t]
  );

  const hero = library[0] || null;

  const continueWatching = useMemo(
    () =>
      Object.entries(progress)
        .sort((a, b) => (b[1].at || 0) - (a[1].at || 0))
        .map(([id]) => library.find((movie) => movie.id === id))
        .filter(Boolean),
    [progress, library]
  );

  // Lọc chạy trên bản trễ của ô tìm kiếm: gõ nhanh thì React vẫn vẽ kịp từng ký
  // tự, phần lọc danh sách nhường lại cho nhịp rảnh.
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return library;
    return library.filter((movie) =>
      [movie.title, movie.creator, movie.description].some((field) =>
        String(field || "").toLowerCase().includes(needle)
      )
    );
  }, [deferredQuery, library]);

  const myList = useMemo(() => library.filter((movie) => saved.includes(movie.id)), [library, saved]);
  const sources = useMemo(() => (playing ? videoSources(playing) : []), [playing]);

  // ── Mở phim ────────────────────────────────────────────────────────────────
  const prefetchStream = useCallback((url) => {
    if (!url || typeof document === "undefined") return;
    try {
      const existing = document.querySelector(`link[rel="prefetch"][href="${CSS.escape(url)}"]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = url;
        document.head.appendChild(link);
      }
    } catch {}
  }, []);

  const openDetail = useCallback(async (movie) => {
    hapticSelect();
    setDetail(movie);
    setFullDescription(false);
    if (movie?.videoUrl) prefetchStream(mediaUrl(movie.videoUrl));

    // Thư viện đã có đủ trường để vẽ ngay; lượt gọi này chỉ để lấy bản mới nhất.
    const { movie: fresh } = await cinemaService.getMovie(movie.id);
    if (fresh) {
      setDetail((current) => (current?.id === fresh.id ? fresh : current));
      if (fresh?.videoUrl) prefetchStream(mediaUrl(fresh.videoUrl));
    }
  }, [prefetchStream]);

  const startPlaying = useCallback(async (movie) => {
    if (outOfTokens) {
      setShowStore(true);
      return;
    }
    hapticSelect();
    setSourceIndex(0);
    setVideoFailed(false);
    // Nạp trước ĐÚNG đường sắp dùng (qua biên), không phải link thẳng — nạp
    // trước đường chậm chỉ tốn băng thông mà chẳng làm ấm được gì.
    if (movie?.videoUrl) prefetchStream(mediaUrl(movie.videoUrl));

    const tokenUrl = await cinemaService.getStreamToken(movie.id);
    const playableMovie = tokenUrl ? { ...movie, secureStreamUrl: tokenUrl } : movie;
    setPlaying(playableMovie);
  }, [outOfTokens, prefetchStream]);

  const stopPlaying = () => {
    const video = videoRef.current;
    if (video && playing) cinemaService.saveProgress(playing.id, video.currentTime, video.duration);
    setPlaying(null);
    setIsPlaying(false);
    setProgress(cinemaService.getProgress());
  };

  /** Nguồn hiện tại không tới nơi → thử nguồn kế; hết nguồn thì nói thẳng. */
  const nextSource = useCallback(() => {
    setSourceIndex((index) => {
      if (index + 1 >= sources.length) {
        setVideoFailed(true);
        return index;
      }
      showToast?.(t("cinema.switchingSource"), "info");
      return index + 1;
    });
  }, [sources.length, showToast, t]);

  // Gắn nguồn phát. Kệ phim là file mp4 của Internet Archive; hls.js chỉ nạp khi
  // admin tự thêm một luồng .m3u8 — nạp sẵn cho mọi người là phí băng thông.
  useEffect(() => {
    const video = videoRef.current;
    const url = sources[sourceIndex];
    if (!video || !url) return undefined;

    let cancelled = false;
    lastProgressRef.current = Date.now();
    setQualityLevels([]);
    setCurrentQualityIndex(-1);

    if (url.includes(".m3u8")) {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) {
          video.src = url;
          return;
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 180,
          maxBufferLength: 120,
          maxMaxBufferLength: 300,
          maxBufferSize: 120 * 1024 * 1024,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          progressive: true,
          startLevel: -1,
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_evt, data) => {
          setQualityLevels(
            data.levels.map((level, index) => ({ index, label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kbps` }))
          );
        });
        hlsRef.current = hls;
      });
    } else {
      video.src = url;
    }

    // Xem dở thì mở lại đúng chỗ cũ, kể cả khi vừa đổi sang nguồn khác.
    const resumeAt = cinemaService.getProgress()[playing?.id]?.seconds || 0;
    const seek = () => { video.currentTime = resumeAt; };
    if (resumeAt > 0) video.addEventListener("loadedmetadata", seek, { once: true });
    video.play().catch(() => { /* trình duyệt chặn tự phát: người xem bấm nút play */ });

    // Canh nguồn đứng hình. `onError` chỉ nổ khi kết nối bị từ chối; một máy dữ
    // liệu im lặng thì trình duyệt cứ chờ tới `ERR_TIMED_OUT` — cả phút trắng.
    const watchdog = setInterval(() => {
      const stalled = Date.now() - lastProgressRef.current > STALL_TIMEOUT_MS;
      if (stalled && !video.paused && video.readyState < 3) nextSource();
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(watchdog);
      video.removeEventListener("loadedmetadata", seek);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [sources, sourceIndex, playing?.id, nextSource]);

  // Hết token thì dừng ngay giữa phim: để chạy tiếp là cho xem không tính giờ.
  useEffect(() => {
    if (outOfTokens && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      showToast?.(t("cinema.token.ranOut"), "warning");
      setShowStore(true);
    }
  }, [outOfTokens, showToast, t]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    lastProgressRef.current = Date.now();
    if (!video || !playing) return;
    if (Date.now() - lastSaveRef.current < PROGRESS_SAVE_EVERY_MS) return;
    lastSaveRef.current = Date.now();
    cinemaService.saveProgress(playing.id, video.currentTime, video.duration);
  };

  const handleEnded = () => {
    if (!playing) return;
    setIsPlaying(false);
    cinemaService.clearProgress(playing.id);
    setProgress(cinemaService.getProgress());
  };

  const toggleSaved = useCallback((id, event) => {
    event?.stopPropagation();
    hapticSelect();
    const added = cinemaService.toggleSaved(id);
    setSaved(cinemaService.getSavedIds());
    showToast?.(added ? t("cinema.action.savedOn") : t("cinema.action.savedOff"), "info");
  }, [showToast, t]);

  const toggleLiked = useCallback((id, event) => {
    event?.stopPropagation();
    hapticSelect();
    cinemaService.toggleLiked(id);
    setLiked(cinemaService.getLikedIds());
  }, []);

  const shareMovie = async (movie) => {
    const url = movie.sourceUrl || window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: movie.title, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast?.(t("cinema.action.linkCopied"), "success");
      }
    } catch {
      // Người xem đóng bảng chia sẻ — không phải lỗi.
    }
  };

  const tokenPanel = (
    <div className="px-4">
      <RadioTokenStatus status={tokenStatus} loading={tokenLoading} onBuyMore={() => setShowStore(true)} />
      <p className="mt-2 text-[13px] text-muted-foreground">{t("cinema.token.shared")}</p>
    </div>
  );

  return (
    // `dark` khoá app ở theme tối kể cả khi portal đang sáng — rạp phim thì tối.
    <div className="dark relative flex h-full flex-col bg-background text-foreground">
      <header
        className="shrink-0 border-b border-border/60 bg-background"
        style={{ paddingTop: "max(4px, env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-2 px-2">
          <BackButton onClick={onBack} label={t("cinema.back")} iconOnly />
          <p className="min-w-0 flex-1 truncate text-center text-[17px] font-black tracking-[0.14em]">
            <span className="text-rose-600">CHILL</span>
            <span className="text-foreground"> PREMIUM</span>
          </p>
          <span className="h-11 w-11" aria-hidden="true" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {isLoading && !library.length ? (
          <LibrarySkeleton />
        ) : !library.length ? (
          <EmptyShelf />
        ) : tab === "home" ? (
          <>
            {hero && (
              <Hero
                movie={hero}
                inList={saved.includes(hero.id)}
                onPlay={() => startPlaying(hero)}
                onDetail={() => openDetail(hero)}
                onToggleList={(event) => toggleSaved(hero.id, event)}
              />
            )}

            {continueWatching.length > 0 && (
              <Rail title={t("cinema.continueWatching")} movies={continueWatching} onOpen={openDetail} progress={progress} />
            )}

            {RAILS.map((item) => {
              const movies = library.filter((movie) => movie.category === item.id);
              if (!movies.length) return null;
              return (
                <Rail
                  key={item.id}
                  title={t(`cinema.cat.${item.id}`)}
                  movies={movies}
                  onOpen={openDetail}
                  progress={progress}
                />
              );
            })}

            <div className="mt-6">{tokenPanel}</div>
            <p className="mt-6 px-4 text-[13px] leading-relaxed text-muted-foreground">{t("cinema.libraryNote")}</p>
          </>
        ) : tab === "search" ? (
          <div className="px-4 pt-4">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3">
              <span className="material-symbols-outlined text-[20px] text-muted-foreground" aria-hidden="true">search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("cinema.searchPlaceholder")}
                aria-label={t("cinema.searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            {query.trim() && (
              <h2 className="mt-5 text-[15px] font-black">{t("cinema.searchResults", { query: query.trim() })}</h2>
            )}
            <Grid
              movies={results}
              emptyTitle={t("cinema.empty.searchTitle")}
              emptyDesc={t("cinema.empty.searchDesc")}
              onOpen={openDetail}
              progress={progress}
            />
          </div>
        ) : (
          <div className="px-4 pt-4">
            <h2 className="text-[15px] font-black">{t("cinema.myList")}</h2>
            <Grid
              movies={myList}
              emptyTitle={t("cinema.empty.listTitle")}
              emptyDesc={t("cinema.empty.listDesc")}
              onOpen={openDetail}
              progress={progress}
            />
          </div>
        )}
      </div>

      {/* Thanh điều hướng kiểu Netflix: ba đích đến, không có "Tải xuống" vì phim
          phát trực tiếp từ nguồn công cộng, app không giữ bản sao nào trên máy. */}
      <nav
        className="shrink-0 border-t border-border/60 bg-background"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex">
          {[
            { id: "home", icon: "home", label: t("cinema.nav.home") },
            { id: "search", icon: "search", label: t("cinema.nav.search") },
            { id: "list", icon: "bookmark", label: t("cinema.myList") },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { hapticSelect(); setTab(item.id); }}
              aria-current={tab === item.id}
              className={`flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
                tab === item.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {detail && (
        <DetailScreen
          movie={detail}
          related={library.filter((movie) => movie.category === detail.category && movie.id !== detail.id).slice(0, 8)}
          liked={liked.includes(detail.id)}
          inList={saved.includes(detail.id)}
          fullDescription={fullDescription}
          describe={describe}
          progress={progress}
          onToggleDescription={() => setFullDescription((value) => !value)}
          onPlay={() => startPlaying(detail)}
          onToggleList={(event) => toggleSaved(detail.id, event)}
          onToggleLike={(event) => toggleLiked(detail.id, event)}
          onShare={() => shareMovie(detail)}
          onOpen={openDetail}
          onClose={() => setDetail(null)}
          tokenPanel={tokenPanel}
        />
      )}

      {playing && (
        <div className="fixed inset-0 z-[120] flex flex-col bg-black">
          <div className="flex items-center justify-between px-3 py-2 bg-black/80 backdrop-blur-md z-10" style={{ paddingTop: "max(6px, env(safe-area-inset-top, 0px))" }}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <BackButton onClick={stopPlaying} label={t("cinema.close")} tone="onDark" iconOnly />
              <p className="truncate text-xs font-bold text-white">{playing.title}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Network Bandwidth Speed Badge */}
              <div className="flex items-center gap-1 bg-black/60 border border-emerald-500/40 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-300">
                <span className="material-symbols-outlined text-[13px] text-emerald-400">wifi</span>
                <span>{network.type} ({network.speed})</span>
                <span className="opacity-70 font-normal hidden sm:inline">• Gợi ý {network.recommended}</span>
              </div>

              {/* GPU Hardware Resolution Switcher */}
              {qualityLevels.length > 0 && (
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[11px] font-bold text-white shrink-0 border border-white/15">
                  <span className="material-symbols-outlined text-xs text-rose-400">memory</span>
                  <select
                    value={currentQualityIndex}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value, 10);
                      setCurrentQualityIndex(idx);
                      if (hlsRef.current) {
                        hlsRef.current.currentLevel = idx;
                      }
                    }}
                    className="bg-transparent text-white focus:outline-none cursor-pointer font-bold text-[11px]"
                  >
                    <option value={-1} className="bg-slate-900 text-white">⚡ Tự động (GPU Local)</option>
                    {qualityLevels.map((q) => (
                      <option key={q.index} value={q.index} className="bg-slate-900 text-white">
                        🎬 {q.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <video
            ref={videoRef}
            className="min-h-0 w-full flex-1 bg-black"
            style={{
              transform: "translateZ(0)",
              willChange: "transform",
              filter: "contrast(1.02) saturate(1.04)",
            }}
            poster={mediaUrl(playing.poster)}
            controls
            autoPlay
            playsInline
            preload="auto"
            onPlaying={() => { lastProgressRef.current = Date.now(); setIsPlaying(true); }}
            onWaiting={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onProgress={() => { lastProgressRef.current = Date.now(); }}
            onTimeUpdate={handleTimeUpdate}
            onError={nextSource}
            onEnded={handleEnded}
          />

          {videoFailed && (
            <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-2xl bg-black/85 p-5 text-center">
              <span className="material-symbols-outlined text-[32px] text-rose-500" aria-hidden="true">wifi_off</span>
              <p className="mt-2 text-[15px] font-bold text-white">{t("cinema.videoFailed.title")}</p>
              <p className="mt-1 text-[13px] text-white/70">{t("cinema.videoFailed.desc")}</p>
              <button
                type="button"
                onClick={() => { setSourceIndex(0); setVideoFailed(false); }}
                className="mt-3 h-11 w-full rounded-xl bg-rose-600 text-[15px] font-black text-white"
              >
                {t("cinema.retry")}
              </button>
            </div>
          )}
        </div>
      )}

      {showStore && (
        <RadioStoreModal
          bio={bio}
          showToast={showToast}
          onClose={() => setShowStore(false)}
          onPurchased={refetchTokens}
        />
      )}
    </div>
  );
}

/**
 * Hero. Ảnh tĩnh 12KB lên trước để màn hình không trống, ảnh động cắt từ chính
 * bộ phim (khi Internet Archive có) chỉ hiện khi tải xong — mạng yếu thì người
 * xem không phải chờ 400KB mới thấy gì.
 */
function Hero({ movie, inList, onPlay, onDetail, onToggleList }) {
  const { t } = useTranslation();
  const [previewReady, setPreviewReady] = useState(false);

  return (
    <section className="relative">
      {/* Ảnh của Internet Archive sặc 5xx từng lúc. Tấm nào hỏng thì ẩn đi để lộ
          nền bên dưới, thay vì để trình duyệt vẽ biểu tượng ảnh vỡ giữa trang. */}
      <img
        src={mediaUrl(movie.poster)}
        alt=""
        loading="eager"
        decoding="async"
        onError={(event) => handleImageFallback(event, movie.poster)}
        className="aspect-[4/5] w-full object-cover sm:aspect-[16/9]"
      />
      {movie.preview && (
        <img
          src={mediaUrl(movie.preview)}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setPreviewReady(true)}
          onError={() => setPreviewReady(false)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${previewReady ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {/* Lớp tối này để chữ đọc được trên ảnh, không phải để trang trí. */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4">
        <h2 className="text-[24px] font-black leading-tight text-white drop-shadow">{movie.title}</h2>
        <p className="mt-1 text-[13px] text-white/80">
          {[movie.year || null, movie.duration || null, qualityLabel(movie.height) || null].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onPlay}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 text-[15px] font-black text-white transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">play_arrow</span>
            {t("cinema.play")}
          </button>
          <button
            type="button"
            onClick={onToggleList}
            aria-pressed={inList}
            aria-label={t(inList ? "cinema.action.saved" : "cinema.action.save")}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-black/40 text-white"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{inList ? "check" : "add"}</span>
          </button>
          <button
            type="button"
            onClick={onDetail}
            aria-label={t("cinema.info")}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/25 bg-black/40 text-white"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">info</span>
          </button>
        </div>
      </div>
    </section>
  );
}

/** Một hàng ngang kiểu Netflix. */
const Rail = memo(function Rail({ title, movies, onOpen, progress }) {
  return (
    <section className="mt-6">
      <h2 className="px-4 text-[15px] font-black">{title}</h2>
      <div className="mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {movies.map((movie) => (
          <div key={movie.id} className="w-[168px] shrink-0 snap-start">
            <PosterCard movie={movie} onOpen={onOpen} watched={progress[movie.id]?.seconds || 0} />
          </div>
        ))}
      </div>
    </section>
  );
});

const Grid = memo(function Grid({ movies, emptyTitle, emptyDesc, onOpen, progress }) {
  if (!movies.length) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-card px-6 py-12 text-center">
        <span className="material-symbols-outlined text-[40px] text-muted-foreground" aria-hidden="true">movie</span>
        <p className="mt-2 text-[15px] font-bold text-foreground">{emptyTitle}</p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted-foreground">{emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {movies.map((movie) => (
        <PosterCard key={movie.id} movie={movie} onOpen={onOpen} watched={progress[movie.id]?.seconds || 0} />
      ))}
    </div>
  );
});

/**
 * Thẻ phim. Ảnh của Internet Archive là khung hình ngang 180px, nên thẻ giữ
 * đúng tỉ lệ 16:9 — bó vào khung dọc kiểu poster thì phải phóng gấp đôi và cắt
 * mất hai bên. `memo` để cuộn một hàng không vẽ lại cả kệ.
 */
const PosterCard = memo(function PosterCard({ movie, onOpen, watched = 0 }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(movie)}
      className="w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
    >
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        <img
          src={mediaUrl(movie.poster)}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={(event) => handleImageFallback(event, movie.poster)}
        />
        {movie.duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">
            {movie.duration}
          </span>
        )}
        {qualityLabel(movie.height) && (
          <span className="absolute left-1 top-1 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white">
            {qualityLabel(movie.height)}
          </span>
        )}
        {watched > 0 && movie.durationSeconds > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/50">
            <div
              className="h-full bg-rose-600"
              style={{ width: `${Math.min(100, (watched / movie.durationSeconds) * 100)}%` }}
            />
          </div>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] font-bold leading-snug text-foreground">{movie.title}</p>
    </button>
  );
});

function DetailScreen({
  movie, related, liked, inList, fullDescription, describe, progress,
  onToggleDescription, onPlay, onToggleList, onToggleLike, onShare, onOpen, onClose, tokenPanel,
}) {
  const { t } = useTranslation();
  const description = movie.description || "";
  const isLong = description.length > 240;

  return (
    <div className="absolute inset-0 z-[110] flex flex-col overflow-y-auto bg-background gpu-scroll transform-gpu">
      <div className="relative shrink-0">
        <img
          src={mediaUrl(movie.preview || movie.poster)}
          alt=""
          decoding="async"
          onError={(event) => handleImageFallback(event, movie.preview || movie.poster)}
          className="aspect-video w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-black/40" />
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-between px-2"
          style={{ paddingTop: "max(4px, env(safe-area-inset-top, 0px))" }}
        >
          <BackButton onClick={onClose} label={t("cinema.back")} tone="onDark" iconOnly />
          <button
            type="button"
            onClick={onToggleLike}
            aria-pressed={liked}
            aria-label={t("cinema.action.like")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white"
          >
            <span className={`material-symbols-outlined ${liked ? "text-rose-500" : ""}`} aria-hidden="true">
              {liked ? "favorite" : "favorite_border"}
            </span>
          </button>
        </div>
      </div>

      <div className="px-4 pb-10">
        <h1 className="text-[20px] font-black leading-snug text-foreground">{movie.title}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{describe(movie)}</p>
        {movie.creator && <p className="mt-0.5 text-[13px] text-muted-foreground">{movie.creator}</p>}

        {movie.rating > 0 && (
          <div className="mt-2 flex items-center gap-1" aria-label={t("cinema.ratingLabel", { rating: movie.rating.toFixed(1) })}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                aria-hidden="true"
                className={`material-symbols-outlined text-[18px] ${star <= Math.round(movie.rating) ? "text-amber-400" : "text-muted-foreground/40"}`}
              >
                star
              </span>
            ))}
            <span className="ml-1 text-[13px] text-muted-foreground">{movie.rating.toFixed(1)}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onPlay}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 text-[15px] font-black text-white transition-transform active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">play_arrow</span>
          {progress[movie.id]?.seconds > 0 ? t("cinema.resume") : t("cinema.play")}
        </button>

        <div className="mt-3 flex justify-around">
          <IconAction
            icon={inList ? "check" : "add"}
            label={t(inList ? "cinema.action.saved" : "cinema.action.save")}
            onClick={onToggleList}
          />
          <IconAction icon="ios_share" label={t("cinema.action.share")} onClick={onShare} />
        </div>

        {description && (
          <>
            <p className={`mt-4 whitespace-pre-line text-[14px] leading-relaxed text-foreground/90 ${!fullDescription && isLong ? "line-clamp-5" : ""}`}>
              {description}
            </p>
            {isLong && (
              <button type="button" onClick={onToggleDescription} className="h-11 text-[14px] font-bold text-rose-500">
                {fullDescription ? t("cinema.showLess") : t("cinema.showMore")}
              </button>
            )}
          </>
        )}

        <div className="-mx-4 mt-4">{tokenPanel}</div>

        <SourceNote movie={movie} />

        {related.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[15px] font-black">{t("cinema.upNext")}</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {related.map((item) => (
                <PosterCard key={item.id} movie={item} onOpen={onOpen} watched={progress[item.id]?.seconds || 0} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function IconAction({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 min-w-[72px] flex-col items-center justify-center gap-0.5 text-[12px] font-bold text-muted-foreground"
    >
      <span className="material-symbols-outlined text-[24px] text-foreground" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

/** Nguồn và giấy phép của bản phim: điều kiện để xem hợp pháp, không phải chú thích trang trí. */
function SourceNote({ movie }) {
  const { t } = useTranslation();
  if (!movie.sourceUrl && !movie.license) return null;

  return (
    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-border bg-card p-4">
      <span className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground" aria-hidden="true">gavel</span>
      <div className="min-w-0 text-[13px] leading-relaxed text-muted-foreground">
        <p className="font-bold text-foreground">{t("cinema.source.title")}</p>
        <p className="mt-1">{t("cinema.source.body")}</p>
        {movie.license && (
          <a href={movie.license} target="_blank" rel="noreferrer noopener" className="mt-1 block break-all underline">
            {movie.license}
          </a>
        )}
        {movie.sourceUrl && (
          <a href={movie.sourceUrl} target="_blank" rel="noreferrer noopener" className="mt-1 block break-all underline">
            {movie.sourceUrl}
          </a>
        )}
      </div>
    </div>
  );
}

function LibrarySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] w-full bg-muted sm:aspect-[16/9]" />
      <div className="mt-6 flex gap-3 px-4">
        {[0, 1, 2].map((slot) => (
          <div key={slot} className="h-[110px] w-[168px] shrink-0 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function EmptyShelf() {
  const { t } = useTranslation();
  return (
    <div className="mx-4 mt-10 rounded-2xl border border-border bg-card px-6 py-14 text-center">
      <span className="material-symbols-outlined text-[44px] text-muted-foreground" aria-hidden="true">movie</span>
      <p className="mt-2 text-[15px] font-bold text-foreground">{t("cinema.empty.title")}</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted-foreground">{t("cinema.empty.desc")}</p>
    </div>
  );
}
