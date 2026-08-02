import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useTodayArticle } from "../../hooks/useTodayArticle";
import { retryReaderEndpoint } from "../../services/todayFeedApi";
import BackButton from "./shared/BackButton";

const FONT_KEY = "today.readerFontSize";
const FONT_MIN = 16;
const FONT_MAX = 26;

export default function TodayArticleReader({ articleId, onBack }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "en" ? "en" : "vi";
  // Phải tra cứu trong đúng ấn bản đã sinh ra id này (VI hay EN) và đúng
  // chuyên mục mà người đọc vừa bấm từ đó.
  const category = new URLSearchParams(window.location.search).get("c") || "all";
  const { data, isLoading, refetch } = useTodayArticle(articleId, language, category);
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(localStorage.getItem(FONT_KEY));
    return saved >= FONT_MIN && saved <= FONT_MAX ? saved : 18;
  });

  useEffect(() => {
    localStorage.setItem(FONT_KEY, String(fontSize));
  }, [fontSize]);

  // Mở bài khác thì phải đọc từ đầu, không giữ vị trí cuộn của bài trước.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [articleId]);

  // Endpoint đọc bài có thể chưa deploy / Render đang ngủ / hết hạn mức. Bài
  // vừa bấm đã nằm sẵn trong cache feed, nên vẫn dựng được đầu bài + sapo thay
  // vì ném người đọc vào màn hình lỗi.
  const queryClient = useQueryClient();
  const cachedArticle = useMemo(() => {
    for (const [, feed] of queryClient.getQueriesData({ queryKey: ["today-feed"] })) {
      const hit = feed?.items?.find((item) => item.id === articleId);
      if (hit) return hit;
    }
    return null;
  }, [queryClient, articleId]);

  const article = data?.article || cachedArticle;
  const summary = data?.summary
    || (article?.description ? { points: [article.description] } : null);
  const content = data?.content;

  const dateLabel = article?.publishedAt
    ? new Intl.DateTimeFormat(language, { day: "numeric", month: "short", year: "numeric" })
      .format(new Date(article.publishedAt))
    : "";

  return (
    <section className="today-article-page">
      <header className="today-article-topbar">
        <BackButton onClick={onBack} label={t("memberPortal.today.backToFeed")} />
        {article ? (
          <a
            className="today-article-origin"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer external"
          >
            {t("memberPortal.today.openSource")}
            <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
          </a>
        ) : null}
      </header>

      {isLoading ? (
        <div className="today-article-skeleton" aria-label={t("memberPortal.today.loading")}>
          <span /><span /><span /><span />
        </div>
      ) : !article ? (
        <div className="portal-card portal-empty">
          <span className="material-symbols-outlined" aria-hidden="true">cloud_off</span>
          <p>{t("memberPortal.today.articleUnavailable")}</p>
          <button type="button" onClick={() => refetch()}>{t("memberPortal.today.tryAgain")}</button>
        </div>
      ) : (
        <>
          <div className="today-article-head">
            <p className="today-article-kicker">
              <span>{article.source}</span>
              {dateLabel ? <span>· {dateLabel}</span> : null}
              {content?.readMinutes ? (
                <span>· {t("memberPortal.today.readMinutes", { n: content.readMinutes })}</span>
              ) : null}
            </p>
            <h1 className="today-article-title">{article.title}</h1>

            <div className="today-article-fontsize" role="group" aria-label={t("memberPortal.today.fontSize")}>
              <span className="material-symbols-outlined" aria-hidden="true">format_size</span>
              <button
                type="button"
                onClick={() => setFontSize((size) => Math.max(FONT_MIN, size - 2))}
                disabled={fontSize <= FONT_MIN}
                aria-label={`${t("memberPortal.today.fontSize")} −`}
              >
                A
              </button>
              <button
                type="button"
                className="is-large"
                onClick={() => setFontSize((size) => Math.min(FONT_MAX, size + 2))}
                disabled={fontSize >= FONT_MAX}
                aria-label={`${t("memberPortal.today.fontSize")} +`}
              >
                A
              </button>
            </div>
          </div>

          {article.imageUrl ? (
            <img
              className="today-article-image"
              src={article.imageUrl}
              alt=""
              loading="eager"
              referrerPolicy="no-referrer"
              onError={(event) => { event.currentTarget.hidden = true; }}
            />
          ) : null}

          {/* ── PHẦN 1: TÓM TẮT NGẮN ── */}
          <section className="today-article-summary" aria-labelledby="today-article-summary-title">
            <h2 id="today-article-summary-title">
              <span className="material-symbols-outlined" aria-hidden="true">summarize</span>
              {t("memberPortal.today.summaryTitle")}
            </h2>
            <ul>
              {(summary?.points || []).map((point, index) => <li key={index}>{point}</li>)}
            </ul>
            <p className="today-article-summary-by">
              {t("memberPortal.today.summaryBySource", { source: article.source })}
            </p>
          </section>

          {/* ── PHẦN 2: NỘI DUNG BÀI BÁO ── */}
          <section className="today-article-body" aria-labelledby="today-article-body-title">
            <h2 id="today-article-body-title">{t("memberPortal.today.contentTitle")}</h2>

            {content?.available ? (
              <div className="today-article-text" style={{ fontSize: `${fontSize}px` }}>
                {content.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            ) : (
              <div className="today-article-locked">
                <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                <p>{t("memberPortal.today.contentUnavailable")}</p>
                <button
                  type="button"
                  onClick={() => { retryReaderEndpoint(); refetch(); }}
                >
                  {t("memberPortal.today.tryAgain")}
                </button>
              </div>
            )}

            <p className="today-article-attribution">
              {t("memberPortal.today.attribution", { source: article.source })}
              {" "}
              <a href={article.url} target="_blank" rel="noopener noreferrer external">
                {t("memberPortal.today.readOriginal")}
                <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
              </a>
            </p>
          </section>
        </>
      )}
    </section>
  );
}
