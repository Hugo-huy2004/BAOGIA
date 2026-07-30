import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodayFeed } from "../../hooks/useTodayFeed";

const CATEGORIES = ["all", "academic", "technology", "community", "world"];
const INITIAL_VISIBLE = 10;

const QUICK_ACTIONS = [
  { id: "apps", icon: "apps", path: "/member/apps" },
  { id: "map", icon: "explore", path: "/member/map" },
  { id: "wallet", icon: "account_balance_wallet", path: "/member/utilities/joy_wallet" },
  { id: "profile", icon: "person", path: "/member/account" },
];

const CATEGORY_ICONS = Object.freeze({
  academic: "school",
  technology: "memory",
  community: "groups",
  world: "public",
  all: "newspaper",
});

// Tên Việt đặt tên riêng ở cuối ("Nguyễn Văn Hugo"), tên Anh đặt ở đầu.
function givenName(displayName, language) {
  const parts = String(displayName || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return language === "vi" ? parts[parts.length - 1] : parts[0];
}

export default function MemberTodayTab({
  bio,
  onNavigate,
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "en" ? "en" : "vi";
  const [category, setCategory] = useState("all");
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [visible, setVisible] = useState(INITIAL_VISIBLE);
  const [compactView, setCompactView] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  const previewRef = useRef(null);
  const { data, isLoading, isError, refetch } = useTodayFeed(language, category);
  const articles = useMemo(() => data?.items || [], [data?.items]);
  const shown = articles.slice(0, visible);
  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ||
    (!compactView ? articles[0] : null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => {
      setCompactView(media.matches);
      if (media.matches) setSelectedArticleId(null);
    };
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  // Trên mobile khung đọc nằm dưới danh sách, phải tự kéo tới nơi.
  useEffect(() => {
    if (compactView && selectedArticleId) {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [compactView, selectedArticleId]);

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

  return (
    <section className="portal-stack today-news-shell" aria-labelledby="portal-today-title">
      <header className="today-news-hero">
        <div className="min-w-0">
          <p className="portal-eyebrow">{dateLabel}</p>
          <h2 id="portal-today-title" className="portal-display">
            {t("memberPortal.navigation.todayGreeting", {
              name: givenName(bio?.displayName, language) || t("memberPortal.navigation.memberFallback"),
            })}
          </h2>
          <p className="portal-supporting">{t("memberPortal.today.description")}</p>
        </div>
      </header>

      <section aria-labelledby="today-feed-title">
        <div className="portal-section-heading">
          <div>
            <p className="portal-eyebrow">{t("memberPortal.today.forStudents")}</p>
            <h3 id="today-feed-title">{t("memberPortal.today.topStories")}</h3>
          </div>
        </div>

        <div className="today-edition-note" aria-live="polite">
          <span className="material-symbols-outlined" aria-hidden="true">language</span>
          <span>
            {t("memberPortal.today.localEdition", {
              country: data?.meta?.country || (language === "vi" ? "VN" : "US"),
            })}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t("memberPortal.today.dailyReset")}</span>
        </div>

        <div className="today-news-categories" aria-label={t("memberPortal.today.categories")}>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={category === item ? "is-active" : ""}
              onClick={() => {
                setCategory(item);
                setVisible(INITIAL_VISIBLE);
                if (compactView) setSelectedArticleId(null);
              }}
            >
              {t(`memberPortal.today.category.${item}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="today-news-grid" aria-label={t("memberPortal.today.loading")}>
            {[0, 1, 2, 3].map((item) => <div key={item} className="today-news-skeleton" />)}
          </div>
        ) : isError ? (
          <div className="portal-card portal-empty">
            <span className="material-symbols-outlined" aria-hidden="true">cloud_off</span>
            <p>{t("memberPortal.today.unavailable")}</p>
            <button type="button" onClick={() => refetch()}>{t("memberPortal.today.tryAgain")}</button>
          </div>
        ) : (
          <div className="today-news-layout">
            <div className="today-news-list">
              {shown.map((article, index) => (
                <button
                  key={article.id}
                  type="button"
                  className={[
                    "today-news-card",
                    index === 0 && article.imageUrl ? "is-lead" : "",
                    selectedArticle?.id === article.id ? "is-selected" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  <span
                    className={`today-news-card-media ${article.imageUrl ? "has-image" : ""}`}
                    data-category={article.category}
                  >
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                          event.currentTarget.parentElement?.classList.remove("has-image");
                        }}
                      />
                    ) : null}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {CATEGORY_ICONS[article.category] || CATEGORY_ICONS.all}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <small>
                      {article.source}
                      {article.publishedAt ? ` · ${dateFormatter.format(new Date(article.publishedAt))}` : ""}
                    </small>
                    <strong>{article.title}</strong>
                    {index === 0 ? <em>{t("memberPortal.today.featured")}</em> : null}
                  </span>
                  <span className="material-symbols-outlined today-news-chevron" aria-hidden="true">chevron_right</span>
                </button>
              ))}
              {articles.length > visible ? (
                <button
                  type="button"
                  className="today-news-more"
                  onClick={() => setVisible(articles.length)}
                >
                  {t("memberPortal.today.loadMore", { n: articles.length - visible })}
                </button>
              ) : null}
            </div>

            {selectedArticle ? (
              <div className="today-news-preview" ref={previewRef}>
                <div className="today-news-preview-bar">
                  <span>
                    <span className="material-symbols-outlined" aria-hidden="true">shield</span>
                    {t("memberPortal.today.safePreview")}
                  </span>
                  <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer external">
                    {t("memberPortal.today.openSource")}
                    <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                  </a>
                </div>
                {selectedArticle.imageUrl ? (
                  <img
                    key={selectedArticle.id}
                    className="today-news-preview-image"
                    src={selectedArticle.imageUrl}
                    alt=""
                    loading="eager"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : null}
                <article className="today-news-preview-body">
                  <small>
                    {selectedArticle.source}
                    {" · "}
                    {t("memberPortal.today.preview")}
                  </small>
                  <h4>{selectedArticle.title}</h4>
                  <p>{selectedArticle.description || t("memberPortal.today.noSummary")}</p>
                  <span>{t("memberPortal.today.sourceNotice")}</span>
                </article>
                <div className="today-news-preview-footer">
                  <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer external">
                    {t("memberPortal.today.readOriginal")}
                    <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section>
        <div className="portal-section-heading">
          <h3>{t("memberPortal.navigation.quickActions")}</h3>
        </div>
        <div className="portal-action-grid">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className="portal-card portal-action"
              onClick={() => onNavigate(action.path)}
            >
              <span className="portal-app-icon" data-app={action.id}>
                <span className="material-symbols-outlined">{action.icon}</span>
              </span>
              <span>
                <strong>{t(`memberPortal.navigation.quick.${action.id}.title`)}</strong>
                <small>{t(`memberPortal.navigation.quick.${action.id}.description`)}</small>
              </span>
              <span className="material-symbols-outlined portal-disclosure">chevron_right</span>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
