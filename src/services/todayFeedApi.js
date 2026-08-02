import { apiFetch } from "./api";

// 404 nghĩa là backend đang chạy chưa có route đọc bài (chưa deploy). Chrome tự
// log mọi phản hồi 4xx nên không nuốt được từ JS — cách duy nhất cho console
// sạch là đừng gọi nữa. Nhớ trong phiên này, tới khi người dùng bấm "Thử lại".
let readerEndpointMissing = false;
export const retryReaderEndpoint = () => { readerEndpointMissing = false; };

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
    // Trang đọc đã có sẵn dữ liệu bài từ cache feed để dựng tạm, nên hỏng ở
    // đây KHÔNG phải lỗi chặn người dùng — trả null thay vì ném stack đỏ.
    if (readerEndpointMissing) return Promise.resolve(null);
    return apiFetch(`/today/article/${encodeURIComponent(id)}?${params}`, { signal })
      .catch((error) => {
        readerEndpointMissing = error.message.includes("404");
        console.warn("[today] chưa đọc được toàn văn:", error.message);
        return null;
      });
  },
};
