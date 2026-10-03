import "./today-article.css";
import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useTodayArticle } from "../../hooks/useTodayArticle";
import { languageCode } from "../../i18n/languages";
import { triggerHaptic } from "../../utils/haptics";
import { HugeIcon } from "../ui/HugeIcon";

export default function TodayArticleReader({ articleId, onBack }) {
  const { t, i18n } = useTranslation();
  const language = languageCode(i18n.resolvedLanguage || i18n.language);
  const category = new URLSearchParams(window.location.search).get("c") || "all";
  const { data, isLoading, refetch } = useTodayArticle(articleId, language, category);

  const rootRef = useRef(null);
  useEffect(() => {
    rootRef.current?.closest(".mobile-portal-content")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [articleId]);

  const queryClient = useQueryClient();
  const cachedArticle = useMemo(() => {
    for (const [, feed] of queryClient.getQueriesData({ queryKey: ["today-feed"] })) {
      const hit = feed?.items?.find((item) => item.id === articleId);
      if (hit) return hit;
    }
    return null;
  }, [queryClient, articleId]);

  const article = data?.article || cachedArticle;

  // Tổng hợp ý chính tự nhiên, loại bỏ các cụm từ pháp lý rườm rà
  const articleInsight = useMemo(() => {
    const title = String(article?.title || "").trim();
    const desc = String(article?.description || "").trim();
    if (!title && !desc) return null;

    const sentences = desc
      .split(/(?<=[.!?。！？;；])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const metricSentence = sentences.find((s) =>
      /\b(?:\d+%|\d+[.,]\d+%|\d+\s*(?:tỷ|triệu|nghìn|USD|VNĐ|học sinh|sinh viên|trường|mô hình))/i.test(s)
    ) || (sentences[0] !== title ? sentences[0] : null);

    const cleanTitle = title.replace(/^(tin nóng|nóng|mới nhất|bất ngờ|hé lộ|công bố):\s*/i, "");

    const points = [];
    points.push(`Diễn biến chính: ${cleanTitle}`);
    if (metricSentence) {
      points.push(`Số liệu & quy mô: ${metricSentence}`);
    }
    if (sentences.length > 1 && sentences[sentences.length - 1] !== title) {
      points.push(`Điểm đáng chú ý: ${sentences[sentences.length - 1]}`);
    } else if (desc.length > 50) {
      points.push(`Nội dung chi tiết: ${desc.slice(0, 160)}${desc.length > 160 ? "…" : ""}`);
    }

    return {
      leadText: desc || `Thông tin mới nhất về "${cleanTitle}" vừa được cập nhật và ghi nhận từ cơ quan báo chí.`,
      points: points.slice(0, 3),
    };
  }, [article?.title, article?.description]);

  const dateLabel = article?.publishedAt
    ? new Intl.DateTimeFormat(language, { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(article.publishedAt)
      )
    : "";

  const handleBack = () => {
    triggerHaptic(10);
    onBack();
  };

  return (
    <section className="today-article-page" data-lang={language} ref={rootRef}>
      {/* ── TOPBAR: Nút quay lại chuẩn iOS + Nút mở bài gốc ── */}
      <header className="today-article-topbar">
        <button
          type="button"
          onClick={handleBack}
          className="today-article-back-btn swiftui-glass"
          aria-label={t("memberPortal.today.backToFeed", "Quay lại danh sách")}
        >
          <HugeIcon name="arrow_back" size={16} />
          <span>{t("memberPortal.today.backToFeed", "Bản tin")}</span>
        </button>

        {article ? (
          <a
            className="today-article-origin-btn swiftui-glass"
            href={article.url}
            target="_blank"
            rel="noopener noreferrer external"
          >
            <span>{t("memberPortal.today.openSource", "Mở nguồn")}</span>
            <HugeIcon name="open_in_new" size={14} />
          </a>
        ) : null}
      </header>

      {!article && isLoading ? (
        <div className="today-article-skeleton" aria-label={t("memberPortal.today.loading")}>
          <span /><span /><span /><span />
        </div>
      ) : !article ? (
        <div className="portal-card portal-empty">
          <HugeIcon name="cloud_off" size={32} />
          <p>{t("memberPortal.today.articleUnavailable", "Không tải được bài viết.")}</p>
          <button type="button" onClick={() => refetch()}>
            {t("memberPortal.today.tryAgain", "Thử lại")}
          </button>
        </div>
      ) : (
        <article className="today-article-content-wrapper">
          {/* Thông tin xuất bản & Tiêu đề bài báo */}
          <div className="today-article-head">
            <div className="today-article-meta-row">
              <span className="today-article-source-tag">{article.source}</span>
              {dateLabel && <span className="today-article-date">{dateLabel}</span>}
              {article.author && <span className="today-article-author">· {article.author}</span>}
            </div>

            <h1 className="today-article-title">{article.title}</h1>
          </div>

          {/* Đoạn văn tóm tắt mở đầu chuẩn phong cách tạp chí thoáng đãng */}
          <div className="today-article-lead-section">
            <p className="today-article-lead-text">
              {data?.summary?.rewrittenText || articleInsight?.leadText}
            </p>
          </div>

          {/* 3 Điểm cốt lõi súc tích */}
          {articleInsight?.points?.length > 0 && (
            <div className="today-article-highlights swiftui-liquid-glass">
              <h2 className="today-article-highlights-title">
                <HugeIcon name="insights" size={18} className="text-primary" />
                <span>Điểm tin cốt lõi</span>
              </h2>
              <ul className="today-article-highlights-list">
                {articleInsight.points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Chân trang bài viết: Ghi nhỏ gọn, phẳng hoàn toàn, KHÔNG DÙNG CARD */}
          <footer className="today-article-footer-compact">
            <div className="today-article-compact-attribution">
              <HugeIcon name="check_circle" size={13} className="text-blue-500 shrink-0" />
              <span>
                Toàn văn bài viết thuộc bản quyền của <strong>{article.source}</strong>.
              </span>
            </div>

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer external"
                className="today-article-compact-source-link"
              >
                <span>Đọc bài gốc tại {article.source}</span>
                <HugeIcon name="open_in_new" size={12} />
              </a>
            )}
          </footer>
        </article>
      )}
    </section>
  );
}
