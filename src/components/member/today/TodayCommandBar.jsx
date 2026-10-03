import { useTranslation } from "react-i18next";
import { triggerHaptic } from "../../../utils/haptics";
import { CATEGORY_METAS } from "./TodayCategoryBar";

export default function TodayCommandBar({
  activeCategory,
  onCategory,
  bookmarkCount = 0,
  query,
  onQueryChange,
  onClearQuery,
  filterCount = 0,
  onOpenFilters,
}) {
  const { t } = useTranslation();

  const handleCategorySelect = (id) => {
    triggerHaptic(10);
    onCategory(id);
  };

  return (
    <div className="today-command-bar">
      {/* ── BÊN TRÁI: DẢI CHUYÊN MỤC DẠNG PILL (CATEGORY PILLS) ── */}
      <nav className="today-command-pills-nav" aria-label="Chuyên mục bài viết">
        <div className="today-command-pills-track">
          {CATEGORY_METAS.map((cat) => {
            const isActive = activeCategory === cat.id;
            const label = t(cat.labelKey, cat.fallback);

            return (
              <button
                key={cat.id}
                type="button"
                className={`today-command-pill ${
                  isActive ? "is-active swiftui-btn-prominent" : "swiftui-liquid-glass"
                }`}
                onClick={() => handleCategorySelect(cat.id)}
                aria-pressed={isActive}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {cat.icon}
                </span>
                <span>{label}</span>
                {cat.id === "saved" && bookmarkCount > 0 && (
                  <span className="today-command-pill-badge">
                    {bookmarkCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── BÊN PHẢI: Ô TÌM KIẾM TINH GỌN + NÚT FILTER CHỦ ĐỀ ── */}
      <div className="today-command-search-group">
        <label className="today-command-search swiftui-liquid-glass">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("memberPortal.today.searchPlaceholder", "Tìm bài báo, chủ đề…")}
            aria-label={t("memberPortal.today.searchPlaceholder")}
          />
          {query ? (
            <button
              type="button"
              className="today-command-search-clear"
              onClick={onClearQuery}
              aria-label={t("memberPortal.today.clearSearch")}
            >
              <span className="material-symbols-outlined" aria-hidden="true">cancel</span>
            </button>
          ) : null}
        </label>

        <button
          type="button"
          className={`today-command-filter-btn swiftui-liquid-glass ${filterCount ? "is-on" : ""}`}
          onClick={onOpenFilters}
          aria-label={t("memberPortal.today.filters")}
          title="Lọc chủ đề thông minh (NLP)"
        >
          <span className="material-symbols-outlined" aria-hidden="true">tune</span>
          {filterCount ? <span className="today-command-filter-dot">{filterCount}</span> : null}
        </button>
      </div>
    </div>
  );
}
