import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodayFeed } from "../../hooks/useTodayFeed";
import { givenName } from "./memberName";

const CATEGORIES = ["all", "academic", "technology", "community", "world", "catholic"];
const PAGE_SIZE = 12;

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
  catholic: "church",
  all: "newspaper",
});

export default function MemberTodayTab({
  bio,
  onNavigate,
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "en" ? "en" : "vi";
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useTodayFeed(language, category);
  const articles = useMemo(() => data?.items || [], [data?.items]);
  const shown = articles.slice(0, visible);
  const remaining = articles.length - shown.length;

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
          <span>
            {t("memberPortal.today.updatedAt", {
              time: dataUpdatedAt ? timeFormatter.format(new Date(dataUpdatedAt)) : "--:--",
            })}
          </span>
        </div>

        <div className="today-news-categories" aria-label={t("memberPortal.today.categories")}>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={category === item ? "is-active" : ""}
              onClick={() => { setCategory(item); setVisible(PAGE_SIZE); }}
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
          <div className="today-news-list">
            {shown.map((article, index) => (
              <button
                key={article.id}
                type="button"
                className={[
                  "today-news-card",
                  index === 0 && article.imageUrl ? "is-lead" : "",
                ].filter(Boolean).join(" ")}
                onPointerDown={onPressStart}
                onClick={(event) => openArticle(event, article)}
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
            {remaining > 0 ? (
              <button
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
