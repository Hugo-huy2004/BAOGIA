import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { BorderBeam } from "border-beam";
import { useTodayArticle } from "../../../hooks/useTodayArticle";
import { languageCode } from "../../../i18n/languages";
import { triggerHaptic, hapticSuccess } from "../../../utils/haptics";
import { sensory } from "../../../lib/sensory";
import { HugeIcon } from "../../ui/HugeIcon";
import { AnimulaAvatar } from "../banhocduong/AnimulaAvatar";
import { getCategoryMeta, estimateReadingMinutes } from "./categoryStyles";

const BOOKMARKS_KEY = "hugo_today_bookmarks_v1";

function readStoredBookmarks() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Trích xuất các điểm đúc kết thông minh theo chuẩn Hugo Animula AI
 */
function extractAnimulaSummary(article) {
  const title = String(article?.title || "").trim();
  const desc = String(article?.description || "").trim();

  const sentences = desc
    .split(/(?<=[.!?。！？;；])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const cleanTitle = title.replace(/^(tin nóng|nóng|mới nhất|bất ngờ|hé lộ|công bố):\s*/i, "");

  const metricSentence = sentences.find((s) =>
    /\b(?:\d+%|\d+[.,]\d+%|\d+\s*(?:tỷ|triệu|nghìn|USD|VNĐ|học sinh|sinh viên|trường|doanh nghiệp|mô hình|năm|tháng))/i.test(s)
  );

  const keyPoints = [];
  keyPoints.push({
    icon: "bolt",
    color: "from-blue-500 to-indigo-600",
    label: "Diễn biến cốt lõi",
    text: cleanTitle,
  });

  if (metricSentence && metricSentence !== cleanTitle) {
    keyPoints.push({
      icon: "analytics",
      color: "from-purple-500 to-pink-600",
      label: "Số liệu & Quy mô",
      text: metricSentence,
    });
  } else if (sentences[0] && sentences[0] !== cleanTitle) {
    keyPoints.push({
      icon: "feed",
      color: "from-sky-500 to-cyan-600",
      label: "Bối cảnh ghi nhận",
      text: sentences[0],
    });
  }

  const lastSentence = sentences.length > 1 ? sentences[sentences.length - 1] : null;
  if (lastSentence && lastSentence !== cleanTitle && lastSentence !== metricSentence) {
    keyPoints.push({
      icon: "sparkles",
      color: "from-amber-500 to-orange-600",
      label: "Điểm đáng lưu ý",
      text: lastSentence,
    });
  } else if (desc.length > 40) {
    keyPoints.push({
      icon: "sparkles",
      color: "from-amber-500 to-orange-600",
      label: "Đúc kết chi tiết",
      text: desc.slice(0, 160) + (desc.length > 160 ? "…" : ""),
    });
  }

  return {
    tldr: desc || `Bản tin đúc kết nhanh về "${cleanTitle}".`,
    points: keyPoints.slice(0, 3),
    takeaway: "Animula đúc kết: Nắm bắt nhanh dữ liệu quan trọng giúp cậu tiết kiệm 90% thời gian đọc mà vẫn đủ góc nhìn toàn cảnh.",
  };
}

export default function TodayArticleSummary({
  articleId,
  onBack,
  onOpenFull,
  showToast,
  companionType = "clover",
}) {
  const { t, i18n } = useTranslation();
  const language = languageCode(i18n.resolvedLanguage || i18n.language);
  const category = new URLSearchParams(window.location.search).get("c") || "all";
  const { data, isLoading, refetch } = useTodayArticle(articleId, language, category);

  const queryClient = useQueryClient();
  const cachedArticle = useMemo(() => {
    for (const [, feed] of queryClient.getQueriesData({ queryKey: ["today-feed"] })) {
      const hit = feed?.items?.find((item) => item.id === articleId);
      if (hit) return hit;
    }
    return null;
  }, [queryClient, articleId]);

  const article = data?.article || cachedArticle;

  const rootRef = useRef(null);
  useEffect(() => {
    rootRef.current?.closest(".mobile-portal-content")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [articleId]);

  // Quản lý Bookmark
  const [bookmarkedIds, setBookmarkedIds] = useState(readStoredBookmarks);
  const isBookmarked = useMemo(() => {
    return article ? bookmarkedIds.includes(article.id) : false;
  }, [article, bookmarkedIds]);

  const handleToggleBookmark = useCallback(() => {
    if (!article) return;
    triggerHaptic(15);
    setBookmarkedIds((prev) => {
      const next = prev.includes(article.id)
        ? prev.filter((id) => id !== article.id)
        : [article.id, ...prev];
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    showToast?.(
      isBookmarked ? "Đã bỏ lưu bài viết" : "Đã lưu đúc kết vào danh sách đọc sau!",
      "success"
    );
  }, [article, isBookmarked, showToast]);

  const summaryData = useMemo(() => {
    if (!article) return null;
    return extractAnimulaSummary(article);
  }, [article]);

  const meta = article ? getCategoryMeta(article.category) : getCategoryMeta("all");
  const readTime = article ? estimateReadingMinutes(`${article.title} ${article.description || ""}`) : 2;

  const dateLabel = article?.publishedAt
    ? new Intl.DateTimeFormat(language, { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(article.publishedAt)
      )
    : "";

  const handleCopySummary = async () => {
    if (!article || !summaryData) return;
    const text = `✨ Hugo Animula TL;DR: ${article.title}\n\n${summaryData.tldr}\n\nĐiểm cốt lõi:\n${summaryData.points.map((p) => `• ${p.label}: ${p.text}`).join("\n")}\n\nNguồn: ${article.source || "Bản tin Today"}`;
    try {
      await navigator.clipboard.writeText(text);
      hapticSuccess();
      showToast?.("Đã sao chép tóm tắt thông minh của Hugo Animula!", "success");
    } catch {
      showToast?.("Không thể sao chép văn bản", "error");
    }
  };

  const handleBack = () => {
    triggerHaptic(10);
    onBack();
  };

  return (
    <section
      ref={rootRef}
      className="w-full max-w-3xl mx-auto px-1.5 sm:px-4 pt-1 sm:pt-4 pb-12 sm:pb-16 select-none animate-in fade-in duration-200"
      aria-labelledby="summary-article-title"
    >
      <BorderBeam size="md" colorVariant="colorful" strength={0.85} borderRadius={28} className="w-full">
        <article className="swiftui-liquid-glass relative overflow-hidden rounded-[28px] backdrop-blur-3xl bg-white/65 dark:bg-white/[0.05] border border-white/70 dark:border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.35)] p-3.5 sm:p-7 space-y-4 sm:space-y-5 transition-all text-left">
          {/* Lớp nền hiệu ứng ánh sáng (gói gọn tuyệt đối để không bị ảnh hưởng bởi layout flow) */}
          <div className="!absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit] -z-0">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/35 to-transparent" />
            <div
              className="absolute -top-24 -right-24 size-72 rounded-full blur-3xl opacity-30"
              style={{ background: meta.gradient }}
            />
          </div>

          {/* ── 1. TOPBAR: Nút quay lại + Hugo Animula Mascot Badge ── */}
          <header className="relative z-10 flex items-center justify-between gap-3 pb-3 border-b border-zinc-200/40 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/70 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.16] border border-white/60 dark:border-white/12 text-foreground active:scale-95 transition-all shadow-xs shrink-0"
              aria-label="Quay lại danh sách bài viết"
            >
              <HugeIcon name="arrow_back" size={15} />
              <span>Bản tin</span>
            </button>

            {/* Mascot Hugo Animula Header */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative shrink-0">
                <AnimulaAvatar
                  size={30}
                  type={companionType}
                  state="default"
                  face="mouth"
                  shading="fabric"
                  interactive={true}
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border border-white dark:border-[#121422] flex items-center justify-center text-[5px] text-white font-bold">
                  ✓
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-foreground tracking-tight whitespace-nowrap">
                  Hugo Animula
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
                  AI Summary
                </span>
              </div>
            </div>
          </header>

          {/* ── 2. TRẠNG THÁI TẢI / NỘI DUNG CHÍNH ── */}
          {!article && isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <AnimulaAvatar size={70} type={companionType} state="working" face="mouth" shading="fabric" />
              <p className="text-xs text-muted-foreground font-bold tracking-wide animate-pulse uppercase">
                Hugo Animula đang đúc kết bài viết...
              </p>
            </div>
          ) : !article ? (
            <div className="py-8 text-center space-y-3">
              <HugeIcon name="cloud_off" size={36} className="text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-muted-foreground">
                Không tìm thấy nội dung bài viết cần tóm tắt.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-foreground text-background active:scale-95 transition-all"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="space-y-5 relative z-10">
              {/* Metadata: Nguồn + Chuyên mục + Thời gian */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold"
                  style={{ background: meta.tagBg, color: meta.tagColor }}
                >
                  {meta.name}
                </span>
                <span className="font-bold text-foreground/90">{article.source}</span>
                {dateLabel && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{dateLabel}</span>
                  </>
                )}
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1 text-[11px]">
                  <HugeIcon name="schedule" size={12} className="inline-block text-muted-foreground" />
                  {readTime}m đọc
                </span>
              </div>

              {/* Tiêu đề bài viết */}
              <h2
                id="summary-article-title"
                className="text-[17px] sm:text-2xl font-black text-foreground leading-[1.35] tracking-tight"
              >
                {article.title}
              </h2>

              {/* Hộp 3-Second TL;DR (Liquid Glass Gradient) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-400/25 dark:border-blue-500/20 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  <HugeIcon name="bolt" size={15} className="inline-block text-blue-500" />
                  <span>3-Second TL;DR</span>
                </div>
                <p className="text-[13px] sm:text-[14px] font-medium leading-relaxed text-foreground/95">
                  {summaryData?.tldr}
                </p>
              </div>

              {/* 3 Điểm Cốt Lõi Cần Nhớ (Danh sách mờ sang trọng, không card chồng card) */}
              <div className="space-y-2.5">
                <p className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HugeIcon name="checklist" size={14} className="text-blue-500" />
                  <span>3 Điểm Cốt Lõi Cần Nhớ</span>
                </p>
                <div className="space-y-2">
                  {summaryData?.points.map((pt, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-2xl backdrop-blur-xl bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/50 dark:border-white/[0.08] transition-all"
                    >
                      <div
                        className={`size-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white bg-gradient-to-tr ${pt.color} shadow-xs`}
                      >
                        <HugeIcon name={pt.icon} size={14} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <strong className="font-extrabold text-foreground block text-[12px] sm:text-[12.5px]">
                          {pt.label}:
                        </strong>
                        <p className="text-[12.5px] sm:text-[13px] text-foreground/85 leading-snug">
                          {pt.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lời nhắn từ Hugo Animula */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                <HugeIcon name="sparkles" size={18} className="text-emerald-500 shrink-0" />
                <p className="text-[11.5px] sm:text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-snug">
                  {summaryData?.takeaway}
                </p>
              </div>

              {/* ── 3. CHÂN TRANG BẢN QUYỀN (GHI NHỎ GỌN & TUYỆT ĐỐI KHÔNG DÙNG CARD) ── */}
              <footer className="pt-4 border-t border-zinc-200/50 dark:border-white/[0.08] space-y-3.5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left text-[11.5px] text-muted-foreground">
                  <div className="flex items-center justify-center gap-1.5">
                    <HugeIcon name="check_circle" size={13} className="text-blue-500 shrink-0" />
                    <span>
                      Toàn văn bài viết thuộc bản quyền của{" "}
                      <strong className="text-foreground/90 font-semibold">{article.source}</strong>.
                    </span>
                  </div>

                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer external"
                      className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline active:scale-95 transition-all"
                    >
                      <span>Đọc bài gốc tại {article.source}</span>
                      <HugeIcon name="open_in_new" size={12} />
                    </a>
                  )}
                </div>

                {/* Thanh công cụ hành động */}
                <div className="flex flex-col gap-2.5 pt-1">
                  {/* Nút đọc toàn văn bài viết */}
                  <button
                    type="button"
                    onClick={() => {
                      sensory.pop();
                      if (onOpenFull) onOpenFull(article);
                    }}
                    className="w-full py-3 rounded-full text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                  >
                    <span>Đọc toàn văn bài viết</span>
                    <HugeIcon name="arrow_forward" size={15} />
                  </button>

                  {/* Nút Sao chép & Lưu lại */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopySummary}
                      className="py-2.5 px-3 rounded-full text-xs font-bold bg-white/70 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.16] border border-white/60 dark:border-white/12 text-foreground active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <HugeIcon name="copy" size={14} />
                      <span>Sao chép tóm tắt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleBookmark}
                      className={`py-2.5 px-3 rounded-full text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs ${
                        isBookmarked
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-500 dark:text-amber-400"
                          : "bg-white/70 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.16] border border-white/60 dark:border-white/12 text-foreground"
                      }`}
                    >
                      <HugeIcon name={isBookmarked ? "bookmark_added" : "bookmark_border"} size={15} />
                      <span>{isBookmarked ? "Đã lưu đúc kết" : "Lưu lại"}</span>
3                    </button>
                  </div>
                </div>
              </footer>
            </div>
          )}
        </article>
      </BorderBeam>
    </section>
  );
}
