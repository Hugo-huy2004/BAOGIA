import "./member-today.css";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTodayFeed } from "../../hooks/useTodayFeed";
import { useIsMobile } from "../../hooks/useIsMobile";
import { matchesQuery } from "../../lib/todayTopics";
import { givenName } from "./memberName";
import EditionMark from "./today/EditionMark";
import { getCulturalTheme } from "../../i18n/culturalThemes";
import { languageCode } from "../../i18n/languages";
import { sensory } from "../../lib/sensory";

import TodayCheckinCapsule from "./today/TodayCheckinCapsule";
import TodayHeroSpotlight from "./today/TodayHeroSpotlight";
import TodayArticleCard from "./today/TodayArticleCard";
import { AnimulaAvatar } from "./banhocduong/AnimulaAvatar";
import { HugeIcon } from "../ui/HugeIcon";

const CATEGORIES = ["all", "saved", "technology", "academic", "world", "community", "catholic"];
const PAGE_SIZE = 16;

const CATEGORY_ICONS = Object.freeze({
  all: "newspaper",
  saved: "bookmark",
  technology: "memory",
  academic: "school",
  world: "public",
  community: "groups",
  catholic: "church",
});

const CATEGORY_LABELS = Object.freeze({
  all: "Tất cả",
  saved: "Đã lưu",
  technology: "Công nghệ",
  academic: "Học thuật",
  world: "Thế giới",
  community: "Cộng đồng",
  catholic: "Công giáo",
});

const BOOKMARKS_KEY = "today_bookmarks_v1";
const SAVED_ARTICLES_KEY = "today_saved_articles_cache_v1";

function readStoredBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readStoredSavedArticles() {
  try {
    const raw = localStorage.getItem(SAVED_ARTICLES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function MemberTodayTab({
  bio,
  onNavigate,
  showToast,
}) {
  const { t, i18n } = useTranslation();
  const language = languageCode(i18n.resolvedLanguage || i18n.language);
  const isMobile = useIsMobile();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Hugo Animula companion state
  const [companionType, setCompanionType] = useState(() => {
    try {
      return localStorage.getItem("hugo_animula_type") || "clover";
    } catch {
      return "clover";
    }
  });


  // Quản lý danh sách bài viết đã lưu (Bookmarks)
  const [bookmarkedIds, setBookmarkedIds] = useState(readStoredBookmarks);
  const [savedArticlesCache, setSavedArticlesCache] = useState(readStoredSavedArticles);

  // Khi chọn tab "saved", gọi feed "all" ở backend để tránh lỗi 400
  const apiCategory = category === "saved" ? "all" : category;
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useTodayFeed(language, apiCategory);

  const feed = useMemo(() => data?.items || [], [data?.items]);

  // Cập nhật bộ nhớ đệm bài viết
  useEffect(() => {
    if (!feed.length) return;
    setSavedArticlesCache((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of feed) {
        if (!next[item.id]) {
          next[item.id] = item;
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      }
      return prev;
    });
  }, [feed]);

  // Bật/tắt lưu bài viết
  const handleToggleBookmark = useCallback((articleId) => {
    sensory.tap();
    setBookmarkedIds((prev) => {
      const next = prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [articleId, ...prev];
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  // Đổi linh vật Animula
  const cycleCompanionType = useCallback(() => {
    const types = ["clover", "star", "cloud", "cat", "flower"];
    setCompanionType((prev) => {
      const nextIdx = (types.indexOf(prev) + 1) % types.length;
      const next = types[nextIdx];
      try {
        localStorage.setItem("hugo_animula_type", next);
        sensory.pop();
        sensory.vibrate("light");
      } catch {}
      return next;
    });
  }, []);

  // Lọc bài viết theo danh mục và từ khóa tìm kiếm
  const articles = useMemo(() => {
    let sourceList = feed;

    if (category === "saved") {
      sourceList = bookmarkedIds
        .map((id) => savedArticlesCache[id] || feed.find((f) => f.id === id))
        .filter(Boolean);
    }

    return sourceList.filter((article) => matchesQuery(article, query));
  }, [category, feed, bookmarkedIds, savedArticlesCache, query]);

  const shown = articles.slice(0, visible);
  const remaining = articles.length - shown.length;

  // Đổi danh mục hoặc tìm kiếm thì reset số bài
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [category, query]);

  // Chống nhầm lướt cuộn màn hình thành click
  const pressRef = useRef(null);
  const onPressStart = (event) => {
    pressRef.current = { x: event.clientX, y: event.clientY, at: Date.now() };
  };
  const isTap = (event) => {
    const start = pressRef.current;
    pressRef.current = null;
    if (!start) return true;
    return (
      Math.hypot(event.clientX - start.x, event.clientY - start.y) < 10 &&
      Date.now() - start.at < 700
    );
  };

  const openArticle = (event, article) => {
    if (isTap(event)) {
      sensory.tap();
      onNavigate(`/member/today/${article.id}?c=${category === "saved" ? "all" : category}`);
    }
  };

  // Kích hoạt tóm tắt thông minh từ Hugo Animula - Chuyển sang trang riêng biệt
  const handleOpenSummary = useCallback((article) => {
    sensory.pop();
    if (!article?.id) return;
    onNavigate(`/member/today?summary=${encodeURIComponent(article.id)}`);
  }, [onNavigate]);

  // Tự động tải thêm khi lướt tới cuối
  const moreRef = useRef(null);
  useEffect(() => {
    const node = moreRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible((count) => count + PAGE_SIZE);
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, articles.length]);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [language]
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { day: "numeric", month: "short" }),
    [language]
  );

  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { hour: "2-digit", minute: "2-digit" }),
    [language]
  );

  const countryLabel = useMemo(() => {
    const country = data?.meta?.country;
    if (!country) return "";
    try {
      return new Intl.DisplayNames([language], { type: "region" }).of(country) || country;
    } catch {
      return country;
    }
  }, [data?.meta?.country, language]);

  const theme = useMemo(() => getCulturalTheme(language), [language]);

  // Phân tách bài tiêu điểm (Spotlight) và danh sách bài bento grid
  const hasHeroSpotlight = category !== "saved" && !query && shown.length > 0;
  const leadArticle = hasHeroSpotlight ? shown[0] : null;
  const gridArticles = hasHeroSpotlight ? shown.slice(1) : shown;

  return (
    <section
      className="today-news-shell w-full max-w-full min-w-0 flex flex-col space-y-3 sm:space-y-4 md:space-y-6 pb-36 sm:pb-24 box-border overflow-x-hidden"
      aria-labelledby="portal-today-title"
      data-lang={language}
      style={{
        "--edition-accent": theme.accent,
        "--edition-accent-fg": theme.accentFg,
        "--edition-surface": theme.surface,
        "--edition-surface-alt": theme.surfaceAlt,
        "--edition-hero": theme.heroGradient,
        "--edition-pattern": `url("data:image/svg+xml,${theme.pattern}")`,
        "--edition-pattern-opacity": theme.heroOpacity,
        "--edition-font": theme.fontFamily,
      }}
    >
      {/* ── 1. HEADER NGHỆ THUẬT: CHÀO BUỔI SÁNG, ĐIỂM DANH & MASCOT HUGO ANIMULA ── */}
      {isMobile ? (
        <header className="p-1 sm:p-3 bg-transparent border-0 shadow-none space-y-2">
          {/* Hàng 1: Ngày tháng & Capsule Chuỗi điểm danh */}
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground truncate">
              <span className="text-foreground font-black">{dateLabel}</span>
              {countryLabel && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[9.5px]">
                    {countryLabel}
                  </span>
                </>
              )}
            </div>

            <div className="shrink-0">
              <TodayCheckinCapsule showToast={showToast} compact={true} />
            </div>
          </div>

          {/* Hàng 2: Lời chào thân thiện */}
          <h1 id="portal-today-title" className="text-[18px] sm:text-2xl font-black text-foreground tracking-tight leading-snug px-0.5">
            {t("memberPortal.navigation.todayGreeting", {
              name: givenName(bio?.displayName, language) || t("memberPortal.navigation.memberFallback"),
            })}
          </h1>

          {/* Hàng 3: Khối Trợ Lý Hugo Animula Mini Tương Tác - Pure Liquid Glass Pill Banner */}
          <div className="flex items-center justify-between gap-2.5 p-2 px-3 rounded-2xl backdrop-blur-2xl bg-white/50 dark:bg-white/[0.05] border border-white/60 dark:border-white/10 shadow-xs">
            <div
              className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0"
              onClick={() => {
                const target = leadArticle || shown[0];
                if (target) handleOpenSummary(target);
                else cycleCompanionType();
              }}
              title="Nhấn để Animula phóng to và đúc kết tin tức!"
            >
              <div className="relative">
                <AnimulaAvatar
                  size={30}
                  type={companionType}
                  state="default"
                  face="mouth"
                  shading="fabric"
                  interactive={true}
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-white dark:border-[#13131c] flex items-center justify-center text-[6px] text-white font-bold">
                  ✓
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black text-foreground">Hugo Animula</span>
                  <span className="text-[7.5px] px-1 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold uppercase">AI</span>
                </div>
                <p className="text-[9px] text-muted-foreground truncate">Chạm để đúc kết tri thức</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const target = leadArticle || shown[0];
                if (target) handleOpenSummary(target);
              }}
              className="shrink-0 px-2.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center gap-1 shadow-xs transition-all"
            >
              <HugeIcon name="bolt" size={11} className="inline-block" />
              <span>Tóm tắt</span>
            </button>
          </div>
        </header>
      ) : (
        <header className="relative overflow-hidden rounded-[26px] sm:rounded-[30px] p-3.5 sm:p-5 md:p-6 bg-gradient-to-br from-white/95 via-white/80 to-blue-50/60 dark:from-[#13131c]/95 dark:via-[#13131c]/80 dark:to-[#1a1926]/60 border border-white/60 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-5 relative z-10">
            {/* Lời chào & metadata */}
            <div className="space-y-1 sm:space-y-2 max-w-xl">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[12px] sm:text-[13px] font-bold text-muted-foreground">
                <span className="text-foreground font-extrabold">{dateLabel}</span>
                {countryLabel && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                      {countryLabel}
                    </span>
                  </>
                )}
                {dataUpdatedAt && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="text-[11px] sm:text-[12px] opacity-75">
                      {timeFormatter.format(new Date(dataUpdatedAt))}
                    </span>
                  </>
                )}
              </div>

              <h1 id="portal-today-title" className="text-xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
                {t("memberPortal.navigation.todayGreeting", {
                  name: givenName(bio?.displayName, language) || t("memberPortal.navigation.memberFallback"),
                })}
              </h1>

              {/* Dải Capsule Điểm Danh */}
              <div className="pt-0.5">
                <TodayCheckinCapsule showToast={showToast} />
              </div>
            </div>

            {/* Khối Trợ Lý Hugo Animula Tương Tác */}
            <div className="w-full md:w-auto">
              <div className="flex items-center gap-3 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-white/[0.06] border border-white/70 dark:border-white/10 shadow-sm backdrop-blur-xl w-full">
                <div
                  className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
                  onClick={() => {
                    if (leadArticle || shown[0]) {
                      handleOpenSummary(leadArticle || shown[0]);
                    } else {
                      cycleCompanionType();
                    }
                  }}
                  title="Nhấn để Animula phóng to và đúc kết tin tức!"
                >
                  <AnimulaAvatar
                    size={46}
                    type={companionType}
                    state="default"
                    face="mouth"
                    shading="fabric"
                    interactive={true}
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#13131c] shadow-sm flex items-center justify-center text-[7px] text-white font-bold">
                    ✓
                  </span>
                </div>

                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-foreground tracking-tight whitespace-nowrap">
                      Hugo Animula
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                      AI Companion
                    </span>
                  </div>

                  <p className="text-[11px] sm:text-[12px] text-muted-foreground font-medium truncate">
                    Linh vật đúc kết tri thức
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const target = leadArticle || shown[0];
                      if (target) handleOpenSummary(target);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-sm transition-all"
                  >
                    <HugeIcon name="bolt" size={13} className="inline-block" />
                    <span>Tóm tắt hôm nay</span>
                  </button>
                </div>

                <div className="hidden sm:block pl-2 border-l border-zinc-200 dark:border-zinc-800 shrink-0">
                  <EditionMark language={language} />
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ── 2. BỘ ĐIỀU HƯỚNG LIQUID GLASS UNIFIED (CHUYÊN MỤC + CHỦ ĐỀ + TÌM KIẾM) ── */}
      <div className="sticky top-2 z-20 w-full max-w-full min-w-0 box-border px-0.5 sm:px-0">
        <div className="relative overflow-hidden rounded-[24px] backdrop-blur-3xl bg-white/70 dark:bg-white/[0.06] border border-white/70 dark:border-white/12 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-1 sm:p-1.5 transition-all">
            {/* Specular highlight lớp kính trên cùng */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/35 to-transparent pointer-events-none" />

            {/* Khi mở tìm kiếm: Bung ra thanh tìm kiếm toàn màn hình */}
            {isSearchOpen ? (
              <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200 px-1 py-0.5">
                <div className="relative flex-1">
                  <HugeIcon
                    name="search"
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm bài viết..."
                    className="w-full pl-9 pr-8 py-1.5 rounded-full text-[13px] bg-zinc-100/90 dark:bg-white/[0.08] border border-white/60 dark:border-white/10 focus:border-blue-500/60 focus:bg-white dark:focus:bg-[#181824] text-foreground placeholder-muted-foreground outline-none transition-all shadow-inner"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        sensory.tap();
                        setQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <HugeIcon name="close" size={14} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sensory.tap();
                    setIsSearchOpen(false);
                    setQuery("");
                  }}
                  className="text-[12px] font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 active:scale-95 transition-all shrink-0"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-1.5 w-full max-w-full min-w-0">
                  <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide py-0.5">
                    {isMobile ? (
                      <div className="flex items-center gap-1 w-max min-w-0">
                        {CATEGORIES.map((cat) => {
                          const active = category === cat;
                          const icon = CATEGORY_ICONS[cat] || "tag";
                          const label = CATEGORY_LABELS[cat] || cat;
                          const isSaved = cat === "saved";

                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                sensory.tap();
                                setCategory(cat);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold transition-all flex items-center gap-1 active:scale-95 whitespace-nowrap shadow-xs ${
                                active
                                  ? "bg-foreground text-background shadow-sm"
                                  : "bg-zinc-100/90 dark:bg-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-zinc-200/70 dark:hover:bg-white/[0.1]"
                              }`}
                            >
                              <HugeIcon name={icon} size={13} className="inline-block" />
                              <span>{label}</span>
                              {isSaved && bookmarkedIds.length > 0 && (
                                <span
                                  className={`px-1.5 py-0.1 rounded-full text-[9px] font-black ${
                                    active ? "bg-background text-foreground" : "bg-foreground/15 text-foreground"
                                  }`}
                                >
                                  {bookmarkedIds.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-max">
                        {CATEGORIES.map((cat) => {
                          const active = category === cat;
                          const icon = CATEGORY_ICONS[cat] || "tag";
                          const label = CATEGORY_LABELS[cat] || cat;
                          const isSaved = cat === "saved";

                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                sensory.tap();
                                setCategory(cat);
                              }}
                              className={`px-3 py-1.5 rounded-full text-[13px] font-extrabold transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap shadow-sm ${
                                active
                                  ? "bg-foreground text-background shadow-md"
                                  : "bg-zinc-100/80 dark:bg-white/[0.06] text-muted-foreground hover:text-foreground hover:bg-zinc-200/70 dark:hover:bg-white/[0.1]"
                              }`}
                            >
                              <HugeIcon name={icon} size={15} className="inline-block" />
                              <span>{label}</span>
                              {isSaved && bookmarkedIds.length > 0 && (
                                <span
                                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                    active ? "bg-background text-foreground" : "bg-foreground/15 text-foreground"
                                  }`}
                                >
                                  {bookmarkedIds.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Nút kính lúp Liquid Glass phân cách rõ ràng ở góc phải - Nút hình tròn hoàn hảo */}
                  <div className="shrink-0 pl-1.5 border-l border-zinc-200/60 dark:border-white/10 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        sensory.tap();
                        setIsSearchOpen(true);
                        setTimeout(() => searchInputRef.current?.focus(), 60);
                      }}
                      className="w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] rounded-full aspect-square bg-zinc-100/90 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.18] border border-white/60 dark:border-white/12 text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0 shadow-xs active:scale-90 transition-all p-0"
                      title="Tìm kiếm bài viết"
                      aria-label="Mở tìm kiếm"
                    >
                      <HugeIcon name="search" size={15} />
                    </button>
                  </div>
                </div>
            )}
          </div>
      </div>

      {/* ── 3. NỘI DUNG FEED: TIÊU ĐIỂM + LƯỚI BENTO THÍCH ỨNG ── */}
      <section aria-labelledby="today-feed-title" className="min-h-[400px] w-full max-w-full min-w-0 box-border">
        <h3 id="today-feed-title" className="sr-only">
          Danh sách tin tức
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-56 rounded-3xl bg-zinc-200/60 dark:bg-zinc-800/40 border border-border/20"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center rounded-3xl bg-white/60 dark:bg-white/[0.04] border border-border/40 space-y-3">
            <HugeIcon name="cloud_off" size={38} className="text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">
              {t("memberPortal.today.unavailable", "Không thể tải bảng tin lúc này.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-foreground text-background hover:opacity-90 active:scale-95 transition-all"
            >
              {t("memberPortal.today.tryAgain", "Thử lại")}
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-white/[0.04] border border-border/40 space-y-4">
            <div className="flex justify-center">
              <AnimulaAvatar size={70} type={companionType} state="default" face="mouth" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-foreground">
                {category === "saved"
                  ? "Chưa có bài viết nào được lưu"
                  : "Không tìm thấy bài viết phù hợp"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {category === "saved"
                  ? "Hãy bấm biểu tượng 🔖 trên các bài viết để lưu lại và nhờ Hugo Animula đúc kết bất cứ lúc nào!"
                  : "Thử đổi từ khóa hoặc chọn chuyên mục khác để xem thêm nội dung mới nhé."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                sensory.tap();
                setCategory("all");
                setQuery("");
              }}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 active:scale-95 transition-all shadow-md shadow-blue-500/20"
            >
              Xem tất cả bài viết
            </button>
          </div>
        ) : (
          <div className="space-y-3.5 sm:space-y-5">
            {/* Bài viết Spotlight tiêu điểm */}
            {leadArticle && (
              <TodayHeroSpotlight
                article={leadArticle}
                onOpen={openArticle}
                onSummarize={handleOpenSummary}
                isBookmarked={bookmarkedIds.includes(leadArticle.id)}
                onToggleBookmark={handleToggleBookmark}
                showToast={showToast}
                dateFormatter={dateFormatter}
                isMobile={isMobile}
              />
            )}

            {/* Lưới Bento thích ứng đa màn hình: Mobile là dòng stream siêu liền mạch, Desktop là Bento Grid */}
            <div className={isMobile ? "today-mobile-stream w-full max-w-full min-w-0 divide-y divide-border/25" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5"}>
              {gridArticles.map((article) => (
                <TodayArticleCard
                  key={article.id}
                  article={article}
                  onOpen={openArticle}
                  onSummarize={handleOpenSummary}
                  isBookmarked={bookmarkedIds.includes(article.id)}
                  onToggleBookmark={handleToggleBookmark}
                  showToast={showToast}
                  dateFormatter={dateFormatter}
                  onPressStart={onPressStart}
                  isMobile={isMobile}
                />
              ))}
            </div>

            {/* Nút xem thêm */}
            {remaining > 0 && (
              <div className="pt-2 sm:pt-4 text-center">
                <button
                  ref={moreRef}
                  type="button"
                  onClick={() => setVisible((count) => count + PAGE_SIZE)}
                  className="px-4 py-2 sm:px-6 sm:py-3 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-white/80 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.12] text-foreground border border-border/60 shadow-sm active:scale-95 transition-all"
                >
                  Tải thêm {Math.min(remaining, PAGE_SIZE)} bài viết nữa
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 3.5. BANNER HỢP TÁC TRUYỀN THÔNG & TÀI TRỢ TODAY ── */}
        <div className="mt-6 sm:mt-14 rounded-2xl sm:rounded-3xl border border-white/50 dark:border-white/10 bg-white/45 dark:bg-card/40 p-3 sm:p-7 backdrop-blur-xl shadow-none">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                <HugeIcon name="campaign" size={13} className="inline-block" />
                Tài trợ & Quảng cáo nội dung
              </span>
              <h3 className="text-[13.5px] sm:text-base font-bold text-foreground tracking-tight">
                Lan toả giải pháp hoặc thương hiệu của bạn trên Hugo Today
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed max-w-xl">
                Không gian cập nhật công nghệ và thiết kế dành riêng cho cộng đồng lập trình viên và sinh viên. Nhận Media Kit và báo giá tài trợ qua <strong className="text-foreground font-semibold">adv@hugowishpax.studio</strong>.
              </p>
            </div>
            <a
              href="mailto:adv@hugowishpax.studio?subject=%5BQu%E1%BA%A3ng%20c%C3%A1o%5D%20Y%C3%AAu%20c%E1%BA%A7u%20Media%20Kit%20%26%20B%C3%A1o%20gi%C3%A1%20T%C3%A0i%20tr%E1%BB%A3%20Today"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 font-semibold text-[11px] sm:text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <HugeIcon name="mail" size={14} className="inline-block" />
              Liên hệ adv@
            </a>
          </div>
        </div>
      </section>
    </section>
  );
}
