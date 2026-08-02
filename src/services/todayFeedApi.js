import { apiFetch } from "./api";

export const todayFeedApi = {
  // Country do server tự phát hiện qua header CDN — client không gửi nữa, để
  // query param không trở thành cache key tuỳ ý.
  getFeed({ language = "vi", category = "all", timeZone, page = 1, limit = 12, signal } = {}) {
    const params = new URLSearchParams({
      lang: language === "en" ? "en" : "vi",
      category,
      page: String(page),
      limit: String(limit),
    });
    if (timeZone) params.set("timezone", timeZone);
    return apiFetch(`/today/feed?${params}`, { auth: false, signal });
  },

  // Trang đọc: server tra bài theo id (client không gửi URL) rồi trả tóm tắt +
  // toàn văn. `category` chỉ là gợi ý để server nạp đúng ấn bản khi cache nguội.
  getArticle({ id, language = "vi", category = "all", timeZone, signal } = {}) {
    const params = new URLSearchParams({ lang: language === "en" ? "en" : "vi", category });
    if (timeZone) params.set("timezone", timeZone);
    return apiFetch(`/today/article/${encodeURIComponent(id)}?${params}`, { signal });
  },
};
