import { triggerHaptic } from "../../../utils/haptics";
import { BorderBeam } from "border-beam";
import { getCategoryMeta, estimateReadingMinutes } from "./categoryStyles";
import { HugeIcon } from "../../ui/HugeIcon";

export default function TodayArticleCard({
  article,
  onOpen,
  onSummarize,
  isBookmarked,
  onToggleBookmark,
  showToast,
  dateFormatter,
  onPressStart,
  isMobile = false,
}) {
  const meta = getCategoryMeta(article.category);
  const readTime = estimateReadingMinutes(`${article.title} ${article.description || ""}`);

  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
    triggerHaptic(15);
    onToggleBookmark(article.id);
    showToast?.(
      isBookmarked ? "Đã gỡ bài viết khỏi danh sách lưu" : "Đã lưu bài viết để đọc sau!",
      "success"
    );
  };

  if (isMobile) {
    return (
      <article
        className="today-mobile-row w-full text-left p-3.5 sm:p-4 relative select-none active:bg-foreground/[0.04] transition-colors box-border"
        data-category={article.category}
        onPointerDown={onPressStart}
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
        <div className="flex items-start gap-3 w-full min-w-0">
          {/* Squircle Icon Dễ thương & Đa màu sắc */}
          <div
            className="w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
            style={{
              background: meta.gradient,
              boxShadow: `0 3px 12px ${meta.glowColor}`,
            }}
            aria-hidden="true"
          >
            <HugeIcon name={meta.icon} size={18} className="text-white" />
          </div>

          {/* Center Info */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Meta Row: Source + Category + Read time */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] text-muted-foreground">
              <span className="font-bold text-foreground/90 truncate max-w-[140px]">
                {article.source}
              </span>
              <span className="opacity-40">·</span>
              <span
                className="px-1.5 py-0.2 rounded-md text-[9.5px] font-bold"
                style={{ background: meta.tagBg, color: meta.tagColor }}
              >
                {meta.name}
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-0.5 text-[10px]">
                <HugeIcon name="schedule" size={12} className="inline-block text-muted-foreground" />
                {readTime}m
              </span>
            </div>

            {/* Title: 2 lines max, 13.5px font-bold */}
            <h4 className="text-[13.5px] sm:text-[14px] font-bold text-foreground leading-[1.38] line-clamp-2">
              {article.title}
            </h4>

            {/* Dek: 1 line max, 11px */}
            {article.description && (
              <p className="text-[11px] sm:text-[11.5px] text-muted-foreground leading-normal line-clamp-1">
                {article.description}
              </p>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-border/25">
              <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                <span>Đọc bài</span>
                <HugeIcon name="arrow_forward" size={13} className="inline-block" />
              </span>

              <div className="flex items-center gap-2">
                {onSummarize && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSummarize(article);
                    }}
                    className="px-2.5 py-1 rounded-full text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white shadow-xs active:scale-95 transition-all flex items-center gap-1"
                    title="Hugo Animula tóm tắt nhanh"
                  >
                    <HugeIcon name="bolt" size={11} className="inline-block" />
                    <span>Tóm tắt</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    isBookmarked
                      ? "text-amber-500 bg-amber-500/10"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={isBookmarked ? "Bỏ lưu bài" : "Lưu bài viết"}
                >
                  <HugeIcon name={isBookmarked ? "bookmark_added" : "bookmark_border"} size={17} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <BorderBeam size="md" colorVariant="ocean" strength={0.65} borderRadius={24} className="h-full">
      <article
        className="today-bento-card swiftui-liquid-glass h-full m-0"
        data-category={article.category}
        onPointerDown={onPressStart}
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
        <div className="today-bento-ambient" style={{ background: meta.gradient }} aria-hidden="true" />

        <div className="today-bento-top">
          {/* Squircle Icon Badge 3D Gradient */}
          <div
            className="today-bento-squircle"
            style={{
              background: meta.gradient,
              boxShadow: `0 6px 16px ${meta.glowColor}`,
            }}
            aria-hidden="true"
          >
            <HugeIcon name={meta.icon} size={20} className="text-white" />
          </div>

          <div className="today-bento-meta">
            <div className="today-bento-meta-row">
              <span className="today-bento-source">{article.source}</span>
              <span className="today-bento-dot">·</span>
              {article.publishedAt && dateFormatter && (
                <span className="today-bento-date">
                  {dateFormatter.format(new Date(article.publishedAt))}
                </span>
              )}
            </div>
            <div className="today-bento-tags-row">
              <span
                className="today-bento-cat-tag"
                style={{ background: meta.tagBg, color: meta.tagColor }}
              >
                {meta.name}
              </span>
              <span className="today-bento-read-tag">
                <HugeIcon name="schedule" size={13} className="inline-block" />
                <span>{readTime}m</span>
              </span>
            </div>
          </div>

          {/* Quick Bookmark Button */}
          <button
            type="button"
            className={`today-bento-bookmark-btn ${isBookmarked ? "is-bookmarked" : ""}`}
            onClick={handleBookmarkToggle}
            aria-label={isBookmarked ? "Bỏ lưu bài" : "Lưu bài viết này"}
            title={isBookmarked ? "Đã lưu" : "Lưu để đọc sau"}
          >
            <HugeIcon name={isBookmarked ? "bookmark_added" : "bookmark_border"} size={18} />
          </button>
        </div>

        <div className="today-bento-body">
          <h4 className="today-bento-title">{article.title}</h4>
          {article.description && (
            <p className="today-bento-dek">{article.description}</p>
          )}
        </div>

        <div className="today-bento-footer flex items-center justify-between">
          <span className="today-bento-read-more">
            <span>Xem chi tiết</span>
            <HugeIcon name="chevron_right" size={14} className="inline-block" />
          </span>

          {onSummarize && (
            <button
              type="button"
              className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 active:scale-95 transition-all flex items-center gap-1 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onSummarize(article);
              }}
              title="Hugo Animula tóm tắt nhanh bài này"
            >
              <HugeIcon name="sparkles" size={13} />
              <span>Tóm tắt</span>
            </button>
          )}
        </div>
      </article>
    </BorderBeam>
  );
}
