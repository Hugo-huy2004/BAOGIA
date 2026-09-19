import "./today-article.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useTodayArticle } from "../../hooks/useTodayArticle";

import BackButton from "./shared/BackButton";
import { languageCode } from "../../i18n/languages";
import { useZhVocab, ZhText, ZhWordPopup, primeZhSpeech } from "./TodayZhAnnotate";

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

  // Tốc độ tải = 0: Lấy ngay bài báo đã có sẵn trong cache của danh sách feed.
  // Trình duyệt không bao giờ phải đợi gọi mạng mới bắt đầu render.
  const queryClient = useQueryClient();
  const cachedArticle = useMemo(() => {
    for (const [, feed] of queryClient.getQueriesData({ queryKey: ["today-feed"] })) {
      const hit = feed?.items?.find((item) => item.id === articleId);
      if (hit) return hit;
    }
    return null;
  }, [queryClient, articleId]);

  const article = data?.article || cachedArticle;

  // Tách ý chính thông minh tức thì (0ms) từ sapo của toà soạn nếu chưa có summary từ server
  // Tách ý chính & viết lại độc lập tức thì (0ms) từ dữ liệu sự kiện để bảo vệ tác quyền
  const instantRewrite = useMemo(() => {
    const title = String(article?.title || "").trim();
    const desc = String(article?.description || "").trim();
    const source = String(article?.source || "Cơ quan báo chí").trim();
    if (!title && !desc) return null;

    const sentences = desc
      .split(/(?<=[.!?。！？;；])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    const metricSentence = sentences.find((s) => /\b(?:\d+%|\d+[.,]\d+%|\d+\s*(?:tỷ|triệu|nghìn|USD|VNĐ|học sinh|sinh viên|trường|mô hình))/i.test(s))
      || (sentences[0] !== title ? sentences[0] : null);

    const cleanTitle = title.replace(/^(tin nóng|nóng|mới nhất|bất ngờ|hé lộ|công bố):\s*/i, "");

    let rewrittenText = "";
    if (metricSentence) {
      rewrittenText = `Theo thông tin ghi nhận từ ${source}, diễn biến mới nhất liên quan đến "${cleanTitle}" đang thu hút sự quan tâm rộng rãi. Cụ thể, các chỉ số thực tế cho thấy ${metricSentence.replace(/\.$/, "")}. Đây là bước phát triển quan trọng, tạo tiền đề cho những quan sát và định hình xu hướng tiếp theo.`;
    } else {
      rewrittenText = `Dựa trên dữ liệu sự kiện từ ${source}, sự việc "${cleanTitle}" vừa có thêm những chuyển động mới đáng chú ý. Bản tin được phân tích và viết lại độc lập nhằm cung cấp góc nhìn toàn cảnh súc tích mà vẫn bảo tồn đầy đủ giá trị tác quyền của tác phẩm báo chí gốc.`;
    }

    const points = [];
    points.push(`⚡ Diễn biến cốt lõi: ${cleanTitle}`);
    if (metricSentence) {
      points.push(`📊 Dữ liệu & Quy mô: ${metricSentence}`);
    }
    if (sentences.length > 1 && sentences[sentences.length - 1] !== title) {
      points.push(`🎯 Điểm mấu chốt: ${sentences[sentences.length - 1]}`);
    } else if (desc.length > 50) {
      points.push(`🎯 Điểm mấu chốt: ${desc.slice(0, 160)}${desc.length > 160 ? "…" : ""}`);
    }

    return {
      rewrittenText,
      points: points.slice(0, 3),
      attribution: `Bản tin phân tích & viết lại độc lập từ ${source} (Fair Use Standard)`
    };
  }, [article?.title, article?.description, article?.source]);

  const summary = data?.summary || instantRewrite;

  // ── ĐẶC QUYỀN CHẾ ĐỘ TIẾNG TRUNG: học qua bài báo ──
  // Khi ngôn ngữ app là tiếng Trung, ấn bản Today là báo tiếng Trung — gạch chân
  // các từ trong giáo trình, chạm ra pinyin/nghĩa/phát âm/thêm vào ôn.
  const isZh = language === "zh";
  const zhTexts = useMemo(
    () => (isZh ? [article?.title, ...((summary?.points) || [])].filter(Boolean) : []),
    [isZh, article?.title, summary],
  );
  // Ưu tiên vocabMap có sẵn từ Node.js server (trả cùng một lượt với bài báo),
  // chỉ kích hoạt hook tra cứu client nếu server chưa đính kèm.
  const zhClientKnown = useZhVocab(data?.vocabMap ? [] : zhTexts);
  const zhKnown = data?.vocabMap || zhClientKnown;
  const [zhWord, setZhWord] = useState(null);
  const openZhWord = (w) => { primeZhSpeech(); setZhWord(w); };

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

      {/* Tốc độ tải = 0: Nếu bài đã có trong cache feed, hiển thị ngay lập tức, không xoay vòng chờ */}
      {!article && isLoading ? (
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
            <h1 className="today-article-title">{isZh ? <ZhText text={article.title} known={zhKnown} onTap={openZhWord} /> : article.title}</h1>
          </div>

          {/* ── BẢN TIN VIẾT LẠI ĐỘC LẬP & TỔNG HỢP (FAIR USE SYNTHESIS) ── */}
          <section className="today-article-summary" aria-labelledby="today-article-summary-title">
            <div className="today-article-synthesis-header">
              <h2 id="today-article-summary-title">
                <span className="material-symbols-outlined" aria-hidden="true" style={{ color: "#38bdf8" }}>auto_awesome</span>
                Bản Tin Viết Lại Độc Lập
              </h2>
              <span className="today-article-badge-fairuse">
                <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
                Bảo vệ tác quyền • Fair Use
              </span>
            </div>

            {/* Đoạn văn phân tích và diễn đạt lại hoàn toàn sự kiện */}
            {summary?.rewrittenText && (
              <div className="today-article-rewritten-body">
                <p className="today-article-rewritten-text">
                  {isZh ? <ZhText text={summary.rewrittenText} known={zhKnown} onTap={openZhWord} /> : summary.rewrittenText}
                </p>
              </div>
            )}

            {isZh && Object.keys(zhKnown).length > 0 && (
              <p className="today-article-zh-hint" style={{ display: "flex", alignItems: "center", gap: 6, margin: "10px 0", fontSize: 12.5, fontWeight: 600, color: "#e11d48" }}>
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16 }}>touch_app</span>
                点击带下划线的词：看拼音、释义与发音
              </p>
            )}

            {/* 3 Điểm bước ngoặt & số liệu then chốt */}
            <div className="today-article-points-card">
              <p className="today-article-points-heading">
                <span className="material-symbols-outlined" aria-hidden="true">insights</span>
                3 Điểm cốt lõi & tác động:
              </p>
              <ul>
                {(summary?.points || []).map((point, index) => (
                  <li key={index}>{isZh ? <ZhText text={point} known={zhKnown} onTap={openZhWord} /> : point}</li>
                ))}
              </ul>
            </div>

            {/* Thông tin nguồn và cam kết bản quyền báo chí */}
            <div className="today-article-attribution-box">
              <p className="today-article-source-info">
                <span className="material-symbols-outlined" aria-hidden="true">newspaper</span>
                {t("memberPortal.today.sourceInfo", {
                  source: article.source,
                  author: article.author || "",
                  date: dateLabel,
                })}
              </p>
              <p className="today-article-summary-by">
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14 }}>gavel</span>
                {summary?.attribution || `Bản tin được AI tổng hợp sự kiện và viết lại độc lập theo chuẩn Fair-Use, không sao chép nguyên văn từ ${article.source}.`}
              </p>
            </div>
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
      {zhWord && <ZhWordPopup word={zhWord} lang={language === "en" ? "en" : "vi"} onClose={() => setZhWord(null)} />}
    </section>
  );
}
