import { useTranslation } from "react-i18next";
import { BorderBeam } from "border-beam";
import { triggerHaptic } from "../../../utils/haptics";
import { getCategoryMeta, estimateReadingMinutes } from "./categoryStyles";
import { HugeIcon } from "../../ui/HugeIcon";

export default function TodayHeroSpotlight({
  article,
  onOpen,
  onSummarize,
  isBookmarked,
  onToggleBookmark,
  showToast,
  dateFormatter,
  isMobile = false,
}) {
  const { t } = useTranslation();
  if (!article) return null;

  const meta = getCategoryMeta(article.category);
  const readTime = estimateReadingMinutes(`${article.title} ${article.description || ""}`);

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    triggerHaptic(15);
    onToggleBookmark(article.id);
    showToast?.(
      isBookmarked ? "Đã gỡ bài viết khỏi danh sách lưu" : "Đã lưu bài viết để đọc sau!",
      "success"
    );
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    triggerHaptic(10);
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description || article.title,
          url,
        });
      } catch {
        /* user dismissed share sheet */
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${article.title}\n${url}`);
        showToast?.("Đã sao chép liên kết bài viết!", "success");
      } catch {
        showToast?.("Không thể sao chép liên kết", "error");
      }
    }
  };

  const cardContent = (
    <article
      className="today-hero-spotlight today-mobile-spotlight swiftui-liquid-glass w-full max-w-full min-w-0 p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden select-none active:scale-[0.99] transition-transform box-border m-0 text-left cursor-pointer"
      onClick={(e) => onOpen(e, article)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(e, article);
        }
      }}
    >
      <div className="today-hero-ambient" style={{ background: meta.gradient }} />
      {/* Specular highlight lớp kính sắc nét */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 relative z-10 w-full max-w-full min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <span className="text-amber-500 text-[11px] sm:text-[14px]">✦</span>
          <span>{t("memberPortal.today.featured", "Tiêu điểm hôm nay")}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold"
            style={{ background: meta.tagBg, color: meta.tagColor }}
          >
            {meta.name}
          </span>
          <span className="text-[9.5px] sm:text-[11px] text-muted-foreground flex items-center gap-0.5">
            <HugeIcon name="schedule" size={12} className="inline-block text-muted-foreground" />
            <span>{readTime}m</span>
          </span>
        </div>
      </div>

      {/* Media & Metadata */}
      <div className="relative z-10 flex items-start gap-2.5 sm:gap-3.5 mb-2 sm:mb-3 w-full max-w-full min-w-0">
        <div
          className="w-8.5 h-8.5 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
          style={{
            background: meta.gradient,
            boxShadow: `0 3px 12px ${meta.glowColor}`,
          }}
          aria-hidden="true"
        >
          <HugeIcon name={meta.icon} size={18} className="text-white" />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-muted-foreground">
            <span className="font-bold text-foreground/85 truncate max-w-[140px] sm:max-w-none">{article.source}</span>
            {article.publishedAt && dateFormatter && (
              <>
                <span className="opacity-40">·</span>
                <span className="truncate">
                  {dateFormatter.format(new Date(article.publishedAt))}
                </span>
              </>
            )}
          </div>

          <h3 className="text-[14px] sm:text-lg md:text-xl font-black text-foreground leading-[1.35] line-clamp-2 break-words">
            {article.title}
          </h3>

          {article.description && (
            <p className="text-[11.5px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2 break-words">
              {article.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 sm:pt-3 border-t border-zinc-200/50 dark:border-white/[0.08] relative z-10 w-full max-w-full min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10.5px] sm:text-xs font-bold bg-foreground text-background flex items-center gap-1 active:scale-95 transition-all shadow-xs shrink-0"
            onClick={(e) => onOpen(e, article)}
          >
            <span>Đọc chi tiết</span>
            <HugeIcon name="arrow_forward" size={12} className="inline-block" />
          </button>

          {onSummarize && (
            <button
              type="button"
              className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onSummarize(article);
              }}
              title="Phóng to Animula để tóm tắt bài viết"
            >
              <HugeIcon name="bolt" size={12} className="inline-block" />
              <span>Tóm tắt</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isBookmarked ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={handleBookmarkClick}
            aria-label={isBookmarked ? "Bỏ lưu bài" : "Lưu bài"}
          >
            <HugeIcon name={isBookmarked ? "bookmark_added" : "bookmark_border"} size={16} />
          </button>
          <button
            type="button"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
            onClick={handleShareClick}
            aria-label="Chia sẻ bài viết"
          >
            <HugeIcon name="share" size={16} />
          </button>
        </div>
      </div>
    </article>
  );

  if (isMobile) {
    return cardContent;
  }

  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.85} borderRadius={24} className="w-full max-w-full min-w-0 overflow-hidden my-3">
      {cardContent}
    </BorderBeam>
  );
}
