/**
 * categoryStyles.js
 * Định nghĩa phong cách Squircle 3D gradient và icon cho từng chuyên mục bài viết
 */

export const CATEGORY_STYLES = Object.freeze({
  technology: {
    icon: "memory",
    name: "Công nghệ",
    gradient: "linear-gradient(135deg, #0284c7, #2563eb)",
    glowColor: "rgba(37, 99, 235, 0.25)",
    tagBg: "rgba(2, 132, 199, 0.12)",
    tagColor: "#0284c7",
  },
  academic: {
    icon: "school",
    name: "Học thuật",
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    glowColor: "rgba(139, 92, 246, 0.25)",
    tagBg: "rgba(139, 92, 246, 0.12)",
    tagColor: "#8b5cf6",
  },
  community: {
    icon: "groups",
    name: "Cộng đồng",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    glowColor: "rgba(16, 185, 129, 0.25)",
    tagBg: "rgba(16, 185, 129, 0.12)",
    tagColor: "#059669",
  },
  world: {
    icon: "public",
    name: "Thời sự",
    gradient: "linear-gradient(135deg, #f59e0b, #ea580c)",
    glowColor: "rgba(245, 158, 11, 0.25)",
    tagBg: "rgba(245, 158, 11, 0.12)",
    tagColor: "#ea580c",
  },
  catholic: {
    icon: "church",
    name: "Công giáo",
    gradient: "linear-gradient(135deg, #e11d48, #9333ea)",
    glowColor: "rgba(225, 29, 72, 0.25)",
    tagBg: "rgba(225, 29, 72, 0.12)",
    tagColor: "#e11d48",
  },
  saved: {
    icon: "bookmark",
    name: "Đã lưu",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    glowColor: "rgba(245, 158, 11, 0.25)",
    tagBg: "rgba(245, 158, 11, 0.12)",
    tagColor: "#d97706",
  },
  all: {
    icon: "newspaper",
    name: "Tổng hợp",
    gradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    glowColor: "rgba(99, 102, 241, 0.25)",
    tagBg: "rgba(99, 102, 241, 0.12)",
    tagColor: "#6366f1",
  },
});

export function getCategoryMeta(categoryKey) {
  return CATEGORY_STYLES[categoryKey] || CATEGORY_STYLES.all;
}

/**
 * Tính ước lượng thời gian đọc theo số từ
 */
export function estimateReadingMinutes(text) {
  if (!text) return 2;
  const wordCount = text.trim().split(/\s+/).length;
  return Math.max(1, Math.min(10, Math.ceil(wordCount / 160)));
}
