import { useTranslation } from "react-i18next";
import { sensory } from "../../../lib/sensory";

export const CATEGORY_METAS = [
  { id: "all", icon: "newspaper", labelKey: "memberPortal.today.category.all", fallback: "Tất cả" },
  { id: "saved", icon: "bookmark", labelKey: "memberPortal.today.category.saved", fallback: "Đã lưu" },
  { id: "technology", icon: "memory", labelKey: "memberPortal.today.category.technology", fallback: "Công nghệ" },
  { id: "academic", icon: "school", labelKey: "memberPortal.today.category.academic", fallback: "Học thuật" },
  { id: "world", icon: "public", labelKey: "memberPortal.today.category.world", fallback: "Thời sự" },
  { id: "community", icon: "groups", labelKey: "memberPortal.today.category.community", fallback: "Cộng đồng" },
  { id: "catholic", icon: "church", labelKey: "memberPortal.today.category.catholic", fallback: "Công giáo" },
];

export default function TodayCategoryBar({ activeCategory, onCategory, bookmarkCount = 0 }) {
  const { t } = useTranslation();

  const handleSelect = (id) => {
    sensory.tap();
    onCategory(id);
  };

  return (
    <nav className="today-category-scroller" aria-label="Chuyên mục bài viết">
      <div className="today-category-track">
        {CATEGORY_METAS.map((cat) => {
          const isActive = activeCategory === cat.id;
          const label = t(cat.labelKey, cat.fallback);

          return (
            <button
              key={cat.id}
              type="button"
              className={`today-category-pill ${
                isActive ? "is-active swiftui-btn-prominent" : "swiftui-glass"
              }`}
              onClick={() => handleSelect(cat.id)}
              aria-pressed={isActive}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {cat.icon}
              </span>
              <span>{label}</span>
              {cat.id === "saved" && bookmarkCount > 0 && (
                <span className="today-category-pill-badge">
                  {bookmarkCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
