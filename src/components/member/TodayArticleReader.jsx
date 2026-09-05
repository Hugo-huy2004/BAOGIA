import "./today-article.css";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useTodayArticle } from "../../hooks/useTodayArticle";

import BackButton from "./shared/BackButton";
import { languageCode } from "../../i18n/languages";

export default function TodayArticleReader({ articleId, onBack }) {
  const { t, i18n } = useTranslation();
  const language = languageCode(i18n.resolvedLanguage || i18n.language);
  // Phải tra cứu trong đúng ấn bản đã sinh ra id này (VI hay EN) và đúng
  // chuyên mục mà người đọc vừa bấm từ đó.
  const category = new URLSearchParams(window.location.search).get("c") || "all";
  const { data, isLoading, refetch } = useTodayArticle(articleId, language, category);

  // Mở bài khác thì phải đọc từ đầu, không giữ vị trí cuộn của bài trước.
  // Trên portal mobile, thứ cuộn KHÔNG phải window mà là `.mobile-portal-content`
  // (vỏ app là fixed inset:0) — cuộn window ở đó không làm gì cả, và người đọc
  // rơi thẳng vào giữa thân bài mới.
  const rootRef = useRef(null);
  useEffect(() => {
    rootRef.current?.closest(".mobile-portal-content")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [articleId]);

  // Endpoint đọc bài có thể chưa deploy / Render đang ngủ / hết hạn mức. Bài
  // vừa bấm đã nằm sẵn trong cache feed, nên vẫn dựng được đầu bài + sapo thay
  // vì ném người đọc vào màn hình lỗi.
  const queryClient = useQueryClient();
  const cachedArticle = useMemo(() => {
    for (const [, feed] of queryClient.getQueriesData({ queryKey: ["today-feed", language] })) {
      const hit = feed?.items?.find((item) => item.id === articleId);
      if (hit) return hit;
    }
    return null;
  }, [queryClient, articleId, language]);

  const article = data?.article || cachedArticle;
  const summary = data?.summary
    || (article?.description ? { points: [article.description] } : null);

  const dateLabel = article?.publishedAt
    ? new Intl.DateTimeFormat(language, { day: "numeric", month: "short", year: "numeric" })
      .format(new Date(article.publishedAt))
    : "";

  return (
    <section className="today-article-page" data-lang={language} ref={rootRef}>
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
              {article.author ? <span>· {article.author}</span> : null}
              {dateLabel ? <span>· {dateLabel}</span> : null}
            </p>
            <h1 className="today-article-title">{article.title}</h1>
          </div>

          {/* ── PHẦN 1: TÓM TẮT NGẮN ── */}
          <section className="today-article-summary" aria-labelledby="today-article-summary-title">
            <h2 id="today-article-summary-title">
              <span className="material-symbols-outlined" aria-hidden="true">summarize</span>
              {t("memberPortal.today.summaryTitle")}
            </h2>
            <ul>
              {(summary?.points || []).map((point, index) => <li key={index}>{point}</li>)}
            </ul>
            {/* Thông tin nguồn: tên nguồn, tác giả, ngày đăng */}
            <p className="today-article-source-info">
              <span className="material-symbols-outlined" aria-hidden="true">flag</span>
              {t("memberPortal.today.sourceInfo", {
                source: article.source,
                author: article.author || "",
                date: dateLabel,
              })}
            </p>
            <p className="today-article-summary-by">
              {t("memberPortal.today.summaryByAi", { source: article.source })}
            </p>
          </section>

          {/* ── PHẦN 2: THÔNG BẢN BẢN QUYỀN + NÚT ĐỌC BÀI GỐC ── */}
          <section className="today-article-body" aria-labelledby="today-article-body-title">
            <h2 id="today-article-body-title">{t("memberPortal.today.contentTitle")}</h2>
            <div className="today-article-locked">
              <span className="material-symbols-outlined" aria-hidden="true">policy</span>
              <p>{t("memberPortal.today.copyrightNotice", { source: article.source })}</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer external"
                className="today-article-read-original"
              >
                {t("memberPortal.today.readOriginal")}
                <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
              </a>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
