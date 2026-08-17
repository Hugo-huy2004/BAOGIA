import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Hls from "hls.js";
import { cinemaService } from "../../../services/classes/Cinema/CinemaService";
import { useJoy } from "../../../lib/joyDisplay";
import { hapticSelect } from "../../../utils/haptics";
import BackButton from "../shared/BackButton";
const FALLBACK_POSTER = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80";
const FALLBACK_BACKDROP = "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80";
const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";

const handleImgError = (e, fallback = FALLBACK_POSTER) => {
  if (e?.currentTarget) {
    e.currentTarget.onerror = null;
    e.currentTarget.src = fallback;
  }
};

export default function HugoCinemaTab({ bio, onBack, showToast }) {
  const { t } = useTranslation();
  const joy = useJoy();

  // 1. Quản lý Theme Light/Dark tự động theo hệ thống (không cho chọn thủ công)
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkTheme(isDark);
    };

    updateTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e) => setIsDarkTheme(e.matches);
    mediaQuery.addEventListener("change", listener);

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      mediaQuery.removeEventListener("change", listener);
      observer.disconnect();
    };
  }, []);

  // State Dữ liệu Phim
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Màn hình 2: Màn Chi Tiết Phim (Movie Detail View)
  const [detailMovie, setDetailMovie] = useState(null);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  // Màn hình 3: Màn Phát Video Fullscreen (Video Player Modal)
  const [videoModalMovie, setVideoModalMovie] = useState(null);
  const [videoSource, setVideoSource] = useState("");
  const [videoFailed, setVideoFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Danh sách Lưu & Yêu thích
  const [watchlist, setWatchlist] = useState(() => cinemaService.getWatchlistIds());
  const [likedMovies, setLikedMovies] = useState(() => cinemaService.getLikedIds());
  const [claimedRewardMovieIds, setClaimedRewardMovieIds] = useState([]);
  const [rewardToast, setRewardToast] = useState("");

  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // 1. Tải phim nổi bật & danh sách phim từ MongoDB API
  useEffect(() => {
    let isMounted = true;
    cinemaService.getFeaturedMovie().then((feat) => {
      if (isMounted) setFeaturedMovie(feat);
    });
    return () => { isMounted = false; };
  }, []);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const list = await cinemaService.getMovies({
        category: selectedCategory,
        search: searchQuery,
        limit: 100,
      });
      setMovies(list);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovies();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadMovies]);

  // Chuyển đường dẫn video qua Stream Proxy Backend nếu nguồn không gửi CORS headers (như Archive.org)
  const getStreamableUrl = (url) => {
    if (!url) return "";
    if (url.includes("archive.org/download/") || url.includes("archive.org/details/")) {
      return `/api/cinema/stream-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // 2. Xử lý mở Màn phát Video (Screen 3)
  const handlePlayMovie = (movie, e) => {
    e?.stopPropagation();
    hapticSelect();
    setVideoModalMovie(movie);
    setVideoFailed(false);
    setIsPlaying(false);
    const rawUrl = movie.videoUrl || movie.videoFallbackUrl;
    const finalUrl = getStreamableUrl(rawUrl);
    setVideoSource(finalUrl);
  };

  // Khởi tạo HLS.js / Video Player trong Fullscreen Modal
  useEffect(() => {
    if (!videoModalMovie || !videoRef.current || !videoSource) return;

    const videoEl = videoRef.current;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (videoSource.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(videoSource);
      hls.attachMedia(videoEl);
      hlsRef.current = hls;
    } else {
      videoEl.src = videoSource;
    }

    try {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            setIsPlaying(false);
            if (videoModalMovie?.videoFallbackUrl && videoSource !== videoModalMovie.videoFallbackUrl) {
              setVideoSource(videoModalMovie.videoFallbackUrl);
            }
          });
      }
    } catch {
      setIsPlaying(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoModalMovie, videoSource]);

  // Thưởng JOY khi xem trọn vẹn
  const handleVideoEnded = async () => {
    if (!videoModalMovie || claimedRewardMovieIds.includes(videoModalMovie.id)) return;
    try {
      const reward = videoModalMovie.joyReward || 100;
      await fetch('/api/joy/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: bio?.email, amount: reward, type: "cinema_watch_complete" })
      }).catch(() => {});
      setClaimedRewardMovieIds((prev) => [...prev, videoModalMovie.id]);
      const msg = `Thưởng +${joy.text(reward)} khi xem trọn vẹn phim ${videoModalMovie.title}!`;
      setRewardToast(msg);
      showToast?.(msg, "success");
      setTimeout(() => setRewardToast(""), 4000);
    } catch {
      // Bỏ qua lỗi mạng
    }
  };

  // Định dạng thời gian video (02:15:00)
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Thêm/Xóa Yêu thích bằng CinemaService OOP
  const toggleLike = (movieId, e) => {
    e?.stopPropagation();
    hapticSelect();
    cinemaService.toggleLike(movieId);
    setLikedMovies(cinemaService.getLikedIds());
  };

  // Thêm/Xóa Watchlist bằng CinemaService OOP
  const toggleWatchlist = (movieId, e) => {
    e?.stopPropagation();
    hapticSelect();
    const added = cinemaService.toggleWatchlist(movieId);
    setWatchlist(cinemaService.getWatchlistIds());
    showToast?.(
      added ? t("cinema.addedWatchlist", "Đã thêm vào danh sách xem sau") : t("cinema.removedWatchlist", "Đã xóa khỏi danh sách xem sau"),
      "info"
    );
  };

  // Danh sách Phim Tiếp Tục Xem & Phim Xu Hướng
  const continueMovies = movies.slice(0, 5);
  const trendingMovies = movies.slice(5);

  return createPortal(
    <div className={`fixed inset-0 z-[99999] w-screen h-screen overflow-y-auto ${isDarkTheme ? "bg-[#0d0e15] text-white" : "bg-[#f5f6fa] text-slate-900"} cinema-app ${!isDarkTheme ? "is-light-theme" : ""}`}>
      {/* ── MÀN HÌNH 2: DETAIL PAGE / SHEET VIEW ── */}
      {detailMovie ? (
        <div className="cinema-detail-view">
          {/* Top Hero Backdrop với Nút Back & Share */}
          <div className="cinema-detail-hero">
            <img
              src={detailMovie.backdrop || detailMovie.poster || FALLBACK_BACKDROP}
              alt={detailMovie.title}
              className="cinema-detail-poster-bg"
              onError={(e) => handleImgError(e, FALLBACK_BACKDROP)}
            />
            <div className="cinema-detail-hero-overlay" />

            <div className="cinema-detail-top-nav">
              <button type="button" className="cinema-nav-circle-btn" onClick={() => setDetailMovie(null)}>
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button type="button" className="cinema-nav-circle-btn" onClick={() => showToast?.("Đã chia sẻ liên kết phim", "info")}>
                <span className="material-symbols-outlined">ios_share</span>
              </button>
            </div>

            {/* Giant Central Play Button ▶ */}
            <div className="cinema-detail-giant-play" onClick={(e) => handlePlayMovie(detailMovie, e)}>
              <span className="material-symbols-outlined text-[44px]">play_arrow</span>
            </div>
          </div>

          {/* Chi tiết Tiêu đề, Tags, Mô tả, Cast */}
          <div className="cinema-detail-content">
            <div className="cinema-detail-header-row">
              <h1 className="cinema-detail-main-title">
                {detailMovie.title} <span>({detailMovie.year})</span>
              </h1>
              <button
                type="button"
                className={`cinema-favorite-heart-btn ${likedMovies.includes(detailMovie.id) ? "is-active" : ""}`}
                onClick={(e) => toggleLike(detailMovie.id, e)}
              >
                <span className="material-symbols-outlined">favorite</span>
              </button>
            </div>

            {/* Thể loại phim */}
            <div className="cinema-detail-genres">
              {Array.isArray(detailMovie.genres) ? detailMovie.genres.join(" • ") : "Hài • Kinh Điển • Điện Ảnh"}
            </div>

            {/* Metadata Pills Tags */}
            <div className="cinema-detail-meta-pills">
              <span className="cinema-pill-tag">⏱ {detailMovie.formattedDuration}</span>
              <span className="cinema-pill-tag is-red">{detailMovie.mpaaRating || "PG-13"}</span>
              <span className="cinema-pill-tag is-gold">⭐ IMDb {detailMovie.imdbRating || "9.0"}</span>
              <span className="cinema-pill-tag">{detailMovie.badge || "4K Ultra HD"}</span>
              <span className="cinema-pill-tag is-red">+{joy.text(detailMovie.joyReward)}</span>
            </div>

            {/* Synopsis Mô Tả Phim */}
            <p className="cinema-detail-synopsis">
              {showFullSynopsis ? detailMovie.description : `${detailMovie.description.slice(0, 140)}...`}
              <span className="cinema-read-more" onClick={() => setShowFullSynopsis(!showFullSynopsis)}>
                {showFullSynopsis ? " Thu gọn" : " Xem thêm"}
              </span>
            </p>

            {/* Cast Diễn Viên */}
            {Array.isArray(detailMovie.cast) && detailMovie.cast.length > 0 && (
              <div className="cinema-cast-section">
                <div className="cinema-section-header !p-0">
                  <h3 className="cinema-section-title">Diễn Viên (Cast)</h3>
                  <span className="cinema-see-all">Xem tất cả</span>
                </div>
                <div className="cinema-cast-row">
                  {detailMovie.cast.map((actor, idx) => (
                    <div key={idx} className="cinema-cast-item">
                      <img src={actor.avatar || FALLBACK_AVATAR} alt={actor.name} onError={(e) => handleImgError(e, FALLBACK_AVATAR)} />
                      <span className="cinema-cast-name">{actor.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phim Tương Tự (More Like This) */}
            <div className="cinema-cast-section mt-8">
              <div className="cinema-section-header !p-0">
                <h3 className="cinema-section-title">Phim Tương Tự</h3>
                <span className="cinema-see-all" onClick={() => setDetailMovie(null)}>Xem tất cả</span>
              </div>
              <div className="cinema-continue-row !p-0 !pt-3">
                {movies.filter((m) => m.id !== detailMovie.id).slice(0, 6).map((m) => (
                  <div key={m.id} className="cinema-continue-card" onClick={() => setDetailMovie(m)}>
                    <img src={m.backdrop || m.poster || FALLBACK_POSTER} alt={m.title} onError={(e) => handleImgError(e, FALLBACK_POSTER)} />
                    <div className="cinema-play-overlay">
                      <div className="cinema-play-btn-circle">
                        <span className="material-symbols-outlined">play_arrow</span>
                      </div>
                    </div>
                    <div className="cinema-continue-info">
                      <div className="cinema-continue-title">{m.title}</div>
                      <div className="cinema-continue-time">⏱ {m.formattedDuration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── MÀN HÌNH 1: HOME / FEED PAGE ── */
        <>
          {/* HEADER USER PROFILE */}
          <header className="cinema-home-header">
            <div className="cinema-user-profile">
              <BackButton onClick={onBack} className="!p-1" />
              <img
                src={bio?.avatarUrl || FALLBACK_AVATAR}
                alt="Avatar"
                className="cinema-user-avatar"
                onError={(e) => handleImgError(e, FALLBACK_AVATAR)}
              />
              <div>
                <div className="cinema-user-greeting">
                  <span>Hi Welcome</span>
                  <span>👋</span>
                </div>
                <div className="cinema-user-name">{bio?.name || "Jayme Holden"}</div>
              </div>
            </div>

            <div className="cinema-header-actions">
              <button
                type="button"
                className="cinema-icon-btn"
                onClick={() => setShowSearch(!showSearch)}
              >
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>
          </header>

          {/* SEARCH BAR EXPAND */}
          {showSearch && (
            <div className="cinema-search-bar">
              <div className="cinema-search-input-wrap">
                <span className="material-symbols-outlined">search</span>
                <input
                  type="text"
                  placeholder="Tìm kiếm phim Hài Sạc Lô, 3D, Kinh điển..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* FEATURED SPOTLIGHT CAROUSEL BANNER */}
          {featuredMovie && !searchQuery && (
            <div className="cinema-hero-banner" onClick={() => setDetailMovie(featuredMovie)}>
              <img
                src={featuredMovie.backdrop || featuredMovie.poster || FALLBACK_BACKDROP}
                alt={featuredMovie.title}
                className="cinema-hero-img"
                onError={(e) => handleImgError(e, FALLBACK_BACKDROP)}
              />
              <div className="cinema-hero-gradient" />
              <div className="cinema-hero-body">
                <span className="cinema-hero-tag">Phim Nổi Bật</span>
                <h2 className="cinema-hero-title">{featuredMovie.title}</h2>
                <div className="cinema-dots-indicator">
                  <div className="cinema-dot is-active" />
                  <div className="cinema-dot" />
                  <div className="cinema-dot" />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: CONTINUE WATCHING (TIẾP TỤC XEM) */}
          {continueMovies.length > 0 && (
            <section>
              <div className="cinema-section-header">
                <h3 className="cinema-section-title">Continue Watching</h3>
                <span className="cinema-see-all">Xem tất cả</span>
              </div>

              <div className="cinema-continue-row">
                {continueMovies.map((movie) => (
                  <div key={movie.id} className="cinema-continue-card" onClick={() => setDetailMovie(movie)}>
                    <img
                      src={movie.backdrop || movie.poster || FALLBACK_POSTER}
                      alt={movie.title}
                      onError={(e) => handleImgError(e, FALLBACK_POSTER)}
                    />
                    <div className="cinema-play-overlay">
                      <div className="cinema-play-btn-circle" onClick={(e) => handlePlayMovie(movie, e)}>
                        <span className="material-symbols-outlined">play_arrow</span>
                      </div>
                    </div>
                    <div className="cinema-continue-info">
                      <div className="cinema-continue-title">{movie.title}</div>
                      <div className="cinema-continue-time">⏱ {movie.formattedDuration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: TRENDING NOW (XU HƯỚNG HÀNG ĐẦU) */}
          <section>
            <div className="cinema-section-header">
              <h3 className="cinema-section-title">Danh Sách Phim Hệ Thống</h3>
              {movies.length > 0 && <span className="cinema-see-all">Xem tất cả</span>}
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-400">
                <p className="animate-pulse text-sm">Đang tải phim từ MongoDB API...</p>
              </div>
            ) : movies.length === 0 ? (
              <div className="py-16 text-center px-6 space-y-3 bg-black/20 rounded-3xl border border-white/10 my-4">
                <span className="material-symbols-outlined text-5xl text-rose-500">video_library</span>
                <h3 className="text-sm font-black text-white">Chưa Có Phim Trong Cơ Sở Dữ Liệu</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Dữ liệu phim do Admin trực tiếp quản lý trong bảng điều khiển Admin Panel.
                </p>
              </div>
            ) : (
              <div className="cinema-poster-grid">
                {trendingMovies.map((movie) => (
                  <div key={movie.id} className="cinema-poster-card" onClick={() => setDetailMovie(movie)}>
                    <div className="cinema-poster-thumb-box">
                      <img
                        src={movie.poster || FALLBACK_POSTER}
                        alt={movie.title}
                        loading="lazy"
                        onError={(e) => handleImgError(e, FALLBACK_POSTER)}
                      />
                      <div className="cinema-rating-badge">
                        <span className="material-symbols-outlined text-[13px]">star</span>
                        {movie.rating || "5.0"}
                      </div>
                    </div>
                    <div className="cinema-poster-title">{movie.title}</div>
                    <div className="cinema-poster-meta">⏱ {movie.formattedDuration || movie.duration}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── MÀN HÌNH 3: FULLSCREEN VIDEO PLAYER MODAL ── */}
      {videoModalMovie && (
        <div className="cinema-video-modal">
          {/* Top Bar với Nút Đóng X & Cast */}
          <div className="cinema-video-top-bar">
            <button
              type="button"
              className="cinema-nav-circle-btn"
              onClick={() => setVideoModalMovie(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-xl cursor-pointer">cast</span>
              <span className="material-symbols-outlined text-white text-xl cursor-pointer">aspect_ratio</span>
            </div>
          </div>

          {/* Frame Video */}
          <div className="cinema-video-frame-container">
            <video
              ref={videoRef}
              className="cinema-video-element"
              style={{ filter: "contrast(1.08) saturate(1.1) brightness(1.02)" }}
              poster={videoModalMovie.poster}
              controls={false}
              playsInline
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  setDuration(videoRef.current.duration || 0);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleVideoEnded}
            />

            {/* Thông báo Thưởng JOY */}
            {rewardToast && (
              <div className="cinema-reward-toast absolute top-20 left-1/2 -translate-x-1/2 z-40">
                <span className="material-symbols-outlined text-[24px]">stars</span>
                <span>{rewardToast}</span>
              </div>
            )}
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="cinema-video-bottom-bar">
            {/* Timeline Progress Bar */}
            <div
              className="cinema-progress-bar-wrap"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (videoRef.current && duration > 0) {
                  videoRef.current.currentTime = pos * duration;
                }
              }}
            >
              <div
                className="cinema-progress-bar-fill"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Play/Pause, Time, Fullscreen controls */}
            <div className="cinema-controls-row">
              <div className="cinema-controls-left">
                <button
                  type="button"
                  className="text-white hover:text-rose-500 transition-colors"
                  onClick={() => {
                    if (videoRef.current) {
                      if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                >
                  <span className="material-symbols-outlined text-[32px]">
                    {isPlaying ? "pause" : "play_arrow"}
                  </span>
                </button>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>

              <button
                type="button"
                className="text-white hover:text-rose-500 transition-colors"
                onClick={() => {
                  if (videoRef.current?.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }}
              >
                <span className="material-symbols-outlined text-[24px]">fullscreen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
