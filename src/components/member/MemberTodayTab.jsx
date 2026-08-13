import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodayFeed } from "../../hooks/useTodayFeed";
import { extractTopics, matchesQuery, matchesTopic } from "../../lib/todayTopics";
import { givenName } from "./memberName";
import { languageCode } from "../../i18n/languages";

const CATEGORIES = ["all", "academic", "technology", "community", "world", "catholic"];
const PAGE_SIZE = 15;

const CATEGORY_ICONS = Object.freeze({
  academic: "school",
  technology: "memory",
  community: "groups",
  world: "public",
  catholic: "church",
  all: "newspaper",
});

export default function MemberTodayTab({
  bio,
  onNavigate,
}) {
  const { t, i18n } = useTranslation();
  const language = languageCode(i18n.resolvedLanguage || i18n.language);
  const [category, setCategory] = useState("all");
  const [topic, setTopic] = useState("");
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useTodayFeed(language, category);
  const feed = useMemo(() => data?.items || [], [data?.items]);
  // Chủ đề rút ra từ chính ấn bản đang mở, không phải một danh sách cứng: hôm
  // nào cả nước nói về "tuyển sinh" thì hôm đó có chip "tuyển sinh".
  const topics = useMemo(() => extractTopics(feed), [feed]);
  const articles = useMemo(
    () => feed.filter((article) => matchesTopic(article, topic) && matchesQuery(article, query)),
    [feed, topic, query],
  );
  const shown = articles.slice(0, visible);
  const remaining = articles.length - shown.length;
  const filterCount = (category === "all" ? 0 : 1) + (topic ? 1 : 0);

  // Đổi bộ lọc thì đọc lại từ bài đầu, không giữ 60 bài đã mở của lần trước.
  useEffect(() => { setVisible(PAGE_SIZE); }, [category, topic, query]);

  // Chủ đề được rút từ ấn bản hiện tại; đổi chuyên mục là ấn bản khác, chip cũ
  // không còn bài nào khớp nên phải bỏ.
  useEffect(() => { setTopic(""); }, [category]);

  // Từ khoá/chủ đề thuộc ngôn ngữ của ấn bản cũ. Xoá chúng ngay khi đổi ngôn
  // ngữ để bản tin mới không bị lọc rỗng bởi một cụm từ tiếng Việt/Thái cũ.
  useEffect(() => { setTopic(""); setQuery(""); }, [language]);

  // Ngón tay kéo danh sách rồi nhả ra vẫn sinh ra một click. Chỉ mở bài khi
  // ngón không đi quá 10px và không giữ quá 700ms — còn lại là lướt.
  const pressRef = useRef(null);
  const onPressStart = (event) => {
    pressRef.current = { x: event.clientX, y: event.clientY, at: Date.now() };
  };
  const isTap = (event) => {
    const start = pressRef.current;
    pressRef.current = null;
    if (!start) return true; // mở bằng bàn phím (Enter/Space) thì luôn tính là nhấn
    return Math.hypot(event.clientX - start.x, event.clientY - start.y) < 10
      && Date.now() - start.at < 700;
  };
  const openArticle = (event, article) => {
    // Kèm chuyên mục đang xem: sau khi server khởi động lại, cache feed trống
    // và đây là manh mối để nạp đúng ấn bản chứa bài này.
    if (isTap(event)) onNavigate(`/member/today/${article.id}?c=${category}`);
  };

  // Máy chủ đã trả sẵn tới 120 bài trong một lượt; nút "Xem thêm" chỉ là cái
  // van mở dần DOM. Nên tự mở khi người đọc lướt tới gần cuối — vẫn giữ nút
  // thật để bàn phím/trình đọc màn hình có thứ để bấm.
  const moreRef = useRef(null);
  useEffect(() => {
    const node = moreRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible((count) => count + PAGE_SIZE); },
      { rootMargin: "800px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, articles.length]);

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat(language, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date()),
    [language],
  );
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { day: "numeric", month: "short" }),
    [language],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(language, { hour: "2-digit", minute: "2-digit" }),
    [language],
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

  return (
    <section className="portal-stack today-news-shell" aria-labelledby="portal-today-title">
      {/* Đầu trang kiểu Apple News: ngày + lời chào + dòng ấn bản, không bọc
          trong thẻ. Bớt một lớp khung là thêm gần một bài báo trên mỗi màn. */}
      <header className="today-news-hero">
        <p className="portal-eyebrow">{dateLabel}</p>
        <h2 id="portal-today-title" className="portal-display">
          {t("memberPortal.navigation.todayGreeting", {
            name: givenName(bio?.displayName, language) || t("memberPortal.navigation.memberFallback"),
          })}
        </h2>
        <p className="today-edition-note" aria-live="polite">
          <span className="material-symbols-outlined" aria-hidden="true">language</span>
          <span>
            {t("memberPortal.today.localEdition", {
              country: countryLabel || language.toUpperCase(),
            })}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t("memberPortal.today.updatedAt", {
              time: dataUpdatedAt ? timeFormatter.format(new Date(dataUpdatedAt)) : "--:--",
            })}
          </span>
        </p>
        {data?.meta ? (
          <p className="today-edition-rights">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {t("memberPortal.today.rightsMode", {
              articles: data.meta.articleCount || 0,
              sources: data.meta.sourceCount || 0,
            })}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="today-feed-title">
        <h3 id="today-feed-title" className="sr-only">{t("memberPortal.today.topStories")}</h3>

        {/* Thanh công cụ dính đỉnh: ô tìm kiếm + một nút lọc nhỏ. Sáu chip
            chuyên mục cũ chiếm hai hàng ngay trên đầu danh sách mà phần lớn
            thời gian không ai đụng tới — chúng dọn vào bảng lọc. */}
        <div className="today-news-toolbar">
          <label className="today-news-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("memberPortal.today.searchPlaceholder")}
              aria-label={t("memberPortal.today.searchPlaceholder")}
            />
            {query ? (
              <button
                type="button"
                className="today-news-search-clear"
                onClick={() => setQuery("")}
                aria-label={t("memberPortal.today.clearSearch")}
              >
                <span className="material-symbols-outlined" aria-hidden="true">cancel</span>
              </button>
            ) : null}
          </label>
          <button
            type="button"
            className={`today-news-filter-btn ${filterCount ? "is-on" : ""}`}
            onClick={() => setFiltersOpen(true)}
            aria-label={t("memberPortal.today.filters")}
          >
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
            {filterCount ? <span className="today-news-filter-dot">{filterCount}</span> : null}
          </button>
        </div>

        {/* Nhãn của bộ lọc đang bật — để người đọc biết vì sao danh sách ngắn
            đi, và gỡ được ngay tại chỗ. */}
        {filterCount || query ? (
          <div className="today-news-active-filters">
            {category !== "all" ? (
              <button type="button" onClick={() => setCategory("all")}>
                {t(`memberPortal.today.category.${category}`)}
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            ) : null}
            {topic ? (
              <button type="button" onClick={() => setTopic("")}>
                {topic}
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            ) : null}
            <span>{t("memberPortal.today.resultCount", { n: articles.length })}</span>
          </div>
        ) : null}

        <TodayFilterSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          category={category}
          onCategory={setCategory}
          topic={topic}
          onTopic={setTopic}
          topics={topics}
          onReset={() => { setCategory("all"); setTopic(""); setQuery(""); }}
        />

        {isLoading ? (
          <div className="today-news-grid" aria-label={t("memberPortal.today.loading")}>
            {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="today-news-skeleton" />)}
          </div>
        ) : isError ? (
          <div className="portal-card portal-empty">
            <span className="material-symbols-outlined" aria-hidden="true">cloud_off</span>
            <p>{t("memberPortal.today.unavailable")}</p>
            <button type="button" onClick={() => refetch()}>{t("memberPortal.today.tryAgain")}</button>
          </div>
        ) : articles.length === 0 ? (
          <div className="portal-card portal-empty">
            <span className="material-symbols-outlined" aria-hidden="true">search_off</span>
            <p>{t("memberPortal.today.noResults")}</p>
            <button
              type="button"
              onClick={() => { setCategory("all"); setTopic(""); setQuery(""); }}
            >
              {t("memberPortal.today.clearFilters")}
            </button>
          </div>
        ) : (
          <div className="today-news-list">
            {shown.map((article, index) => (
              <button
                key={article.id}
                type="button"
                className={[
                  "today-news-card",
                  index === 0 ? "is-lead" : "",
                ].filter(Boolean).join(" ")}
                data-category={article.category}
                onPointerDown={onPressStart}
                onClick={(event) => openArticle(event, article)}
              >
                {/* Bố cục thuần chữ kiểu mục lục báo: KHÔNG dùng ảnh của toà
                    soạn (xem normalizeArticle() trong studentNewsService.js).
                    Nhận diện chuyên mục nằm ở vạch màu bên trái + icon nhỏ
                    trong dòng nguồn, và tiêu đề được thêm gần 100px bề ngang. */}
                <span className="min-w-0">
                  {/* Nhãn "nổi bật" nằm TRÊN tiêu đề như eyebrow của báo in.
                      Đặt dưới tít thì nó chen giữa tít và sapo, đọc gãy nhịp. */}
                  {index === 0 ? <em>{t("memberPortal.today.featured")}</em> : null}
                  <small>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {CATEGORY_ICONS[article.category] || CATEGORY_ICONS.all}
                    </span>
                    {article.source}
                    {article.publishedAt ? ` · ${dateFormatter.format(new Date(article.publishedAt))}` : ""}
                  </small>
                  <strong>{article.title}</strong>
                  {index === 0 && article.description ? (
                    <span className="today-news-dek">{article.description}</span>
                  ) : null}
                </span>
                <span className="material-symbols-outlined today-news-chevron" aria-hidden="true">chevron_right</span>
              </button>
            ))}
            {remaining > 0 ? (
              <button
                ref={moreRef}
                type="button"
                className="today-news-more"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
              >
                {t("memberPortal.today.loadMore", { n: Math.min(remaining, PAGE_SIZE) })}
              </button>
            ) : null}
          </div>
        )}
      </section>

    </section>
  );
}

// Bảng lọc dùng <dialog> của trình duyệt: Esc để đóng, bẫy focus và lớp nền mờ
// ::backdrop có sẵn — không cần thư viện modal nào.
function TodayFilterSheet({ open, onClose, category, onCategory, topic, onTopic, topics, onReset }) {
  const { t } = useTranslation();
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="today-filter-sheet"
      onClose={onClose}
      // Bấm ra ngoài để đóng: <dialog> tính cả vùng ::backdrop là chính nó, nên
      // chỉ đóng khi cú bấm rơi đúng lên thẻ dialog chứ không lên ruột bên trong.
      onClick={(event) => { if (event.target === ref.current) onClose(); }}
    >
      <div className="today-filter-body">
        <header>
          <h2>{t("memberPortal.today.filters")}</h2>
          <button type="button" onClick={onClose}>{t("memberPortal.today.done")}</button>
        </header>

        <p className="today-filter-label">{t("memberPortal.today.categories")}</p>
        <div className="today-filter-chips">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={category === item ? "is-active" : ""}
              onClick={() => onCategory(item)}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {CATEGORY_ICONS[item] || CATEGORY_ICONS.all}
              </span>
              {t(`memberPortal.today.category.${item}`)}
            </button>
          ))}
        </div>

        {topics.length ? (
          <>
            <p className="today-filter-label">{t("memberPortal.today.smartTopics")}</p>
            <div className="today-filter-chips">
              {topics.map((item) => (
                <button
                  key={item.topic}
                  type="button"
                  aria-pressed={topic === item.topic}
                  className={topic === item.topic ? "is-active" : ""}
                  onClick={() => onTopic(topic === item.topic ? "" : item.topic)}
                >
                  {item.topic}
                  <b>{item.count}</b>
                </button>
              ))}
            </div>
          </>
        ) : null}

        <button type="button" className="today-filter-reset" onClick={onReset}>
          {t("memberPortal.today.clearFilters")}
        </button>
      </div>
    </dialog>
  );
}
