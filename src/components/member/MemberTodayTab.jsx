import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTodayFeed } from "../../hooks/useTodayFeed";

const CATEGORIES = ["all", "academic", "technology", "community", "world"];

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

const readSessionValue = (key, fallback) => {
  try {
    return sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function articlePreviewDocument(article, labels, darkMode) {
  if (!article) return "";
  const background = darkMode ? "#171719" : "#ffffff";
  const foreground = darkMode ? "#f5f5f7" : "#1d1d1f";
  const secondary = darkMode ? "#a1a1a6" : "#6e6e73";
  return `<!doctype html>
<html lang="${escapeHtml(labels.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{box-sizing:border-box}body{margin:0;padding:clamp(24px,6vw,56px);background:${background};color:${foreground};font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif}
    article{max-width:680px;margin:0 auto}small{display:block;color:#0071e3;font-size:12px;font-weight:650;letter-spacing:.04em;text-transform:uppercase}
    h1{margin:14px 0 18px;font-size:clamp(28px,6vw,46px);line-height:1.05;letter-spacing:-.035em}p{margin:0;color:${secondary};font-size:clamp(16px,2.6vw,20px);line-height:1.55}
    footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:34px;padding-top:20px;border-top:1px solid ${darkMode ? "#343438" : "#e5e5e7"}}
    footer span{color:${secondary};font-size:13px}a{display:inline-flex;align-items:center;min-height:40px;padding:0 17px;border-radius:999px;background:#0071e3;color:#fff;text-decoration:none;font-size:13px;font-weight:650}
  </style>
</head>
<body>
  <article>
    <small>${escapeHtml(article.source)} · ${escapeHtml(labels.preview)}</small>
    <h1>${escapeHtml(article.title)}</h1>
    <p>${escapeHtml(article.description || labels.noSummary)}</p>
    <footer>
      <span>${escapeHtml(labels.sourceNotice)}</span>
      <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(labels.readOriginal)} ↗</a>
    </footer>
  </article>
</body>
</html>`;
}

function openInSystemBrowser(url) {
  const externalWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (externalWindow) externalWindow.opener = null;
}

export default function MemberTodayTab({
  bio,
  balance = 0,
  notifications = [],
  onNavigate,
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "en" ? "en" : "vi";
  const [category, setCategory] = useState(() => {
    const saved = readSessionValue("portal.today.category", "all");
    return CATEGORIES.includes(saved) ? saved : "all";
  });
  const [selectedArticleId, setSelectedArticleId] = useState(
    () => readSessionValue("portal.today.article", null),
  );
  const [darkMode, setDarkMode] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const { data, isLoading, isFetching, isError, refetch } = useTodayFeed(language, category);
  const articles = useMemo(() => data?.items || [], [data?.items]);
  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ||
    articles[0] ||
    null;

  useEffect(() => {
    if (articles.length && !articles.some((article) => article.id === selectedArticleId)) {
      setSelectedArticleId(articles[0].id);
    }
  }, [articles, selectedArticleId]);

  useEffect(() => {
    try {
      sessionStorage.setItem("portal.today.category", category);
      if (selectedArticleId) {
        sessionStorage.setItem("portal.today.article", selectedArticleId);
      }
    } catch {
      // Session persistence is an enhancement; private mode may block it.
    }
  }, [category, selectedArticleId]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setDarkMode(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const firstName = String(bio?.displayName || "")
    .trim()
    .split(/\s+/)
    .slice(-1)[0];
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
  const previewDocument = useMemo(
    () => articlePreviewDocument(selectedArticle, {
      language,
      preview: t("memberPortal.today.preview"),
      noSummary: t("memberPortal.today.noSummary"),
      sourceNotice: t("memberPortal.today.sourceNotice"),
      readOriginal: t("memberPortal.today.readOriginal"),
    }, darkMode),
    [darkMode, language, selectedArticle, t],
  );

  return (
    <section className="portal-stack today-news-shell" aria-labelledby="portal-today-title">
      <header className="today-news-hero">
        <div className="min-w-0">
          <p className="portal-eyebrow">{dateLabel}</p>
          <h2 id="portal-today-title" className="portal-display">
            {t("memberPortal.navigation.todayGreeting", {
              name: firstName || t("memberPortal.navigation.memberFallback"),
            })}
          </h2>
          <p className="portal-supporting">{t("memberPortal.today.description")}</p>
        </div>
        <div className="today-news-snapshot" aria-label={t("memberPortal.today.snapshot")}>
          <div>
            <span className="material-symbols-outlined" aria-hidden="true">toll</span>
            <strong>{Number(balance || bio?.joyBalance || 0).toLocaleString(language)}</strong>
            <small>{t("memberPortal.navigation.joyBalance")}</small>
          </div>
          <div>
            <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
            <strong>{notifications.filter((item) => !item.read).length}</strong>
            <small>{t("memberPortal.navigation.newActivity")}</small>
          </div>
        </div>
      </header>

      <section aria-labelledby="today-feed-title">
        <div className="portal-section-heading today-news-heading">
          <div>
            <p className="portal-eyebrow">{t("memberPortal.today.forStudents")}</p>
            <h3 id="today-feed-title">{t("memberPortal.today.topStories")}</h3>
          </div>
          <button type="button" onClick={() => refetch()} disabled={isFetching}>
            <span className={`material-symbols-outlined ${isFetching ? "animate-spin" : ""}`} aria-hidden="true">refresh</span>
            {t("memberPortal.today.refresh")}
          </button>
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

        <div className="today-news-categories" role="tablist" aria-label={t("memberPortal.today.categories")}>
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              className={category === item ? "is-active" : ""}
              onClick={() => setCategory(item)}
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
              {articles.map((article, index) => (
                <button
                  key={article.id}
                  type="button"
                  className={`today-news-card ${selectedArticle?.id === article.id ? "is-selected" : ""}`}
                  onClick={() => setSelectedArticleId(article.id)}
                >
                  <span className="today-news-card-icon" data-category={article.category}>
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
            </div>

            {selectedArticle ? (
              <div className="today-news-preview">
                <div className="today-news-preview-bar">
                  <span>
                    <span className="material-symbols-outlined" aria-hidden="true">shield</span>
                    {t("memberPortal.today.safePreview")}
                  </span>
                  <button type="button" onClick={() => openInSystemBrowser(selectedArticle.url)}>
                    {t("memberPortal.today.openSource")}
                    <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                  </button>
                </div>
                <iframe
                  key={selectedArticle.id}
                  title={t("memberPortal.today.previewTitle", { title: selectedArticle.title })}
                  srcDoc={previewDocument}
                  sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  data-country={data?.meta?.country}
                />
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
