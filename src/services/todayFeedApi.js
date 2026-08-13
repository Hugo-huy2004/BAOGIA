import { apiFetch } from "./api";
import { languageCode } from "../i18n/languages";

export const TODAY_NEWS_EDITIONS = Object.freeze({
  vi: "VN",
  en: "US",
  zh: "CN",
  th: "TH",
  ja: "JP",
  ko: "KR",
  id: "ID",
  es: "ES",
  fr: "FR",
});

const normalizedEdition = (language) => {
  const code = languageCode(language);
  return { language: code, country: TODAY_NEWS_EDITIONS[code] || "US" };
};

export function isTodayFeedForLanguage(feed, language) {
  const expected = normalizedEdition(language);
  if (!feed || !Array.isArray(feed.items)) return false;
  if (feed.meta?.language !== expected.language || feed.meta?.country !== expected.country) return false;
  return feed.items.every((article) => (
    (!article.language || article.language === expected.language)
    && (!article.country || article.country === expected.country)
  ));
}

function assertTodayFeedEdition(feed, language) {
  if (isTodayFeedForLanguage(feed, language)) return feed;
  const expected = normalizedEdition(language);
  const error = new Error(
    `Today edition mismatch: expected ${expected.language}-${expected.country}, received ${feed?.meta?.language || "?"}-${feed?.meta?.country || "?"}`,
  );
  error.code = "TODAY_EDITION_MISMATCH";
  throw error;
}

export function isTodayArticleForLanguage(payload, language) {
  const expected = normalizedEdition(language);
  const article = payload?.article;
  return Boolean(
    article
    && article.language === expected.language
    && article.country === expected.country,
  );
}

// 404 nghĩa là backend đang chạy chưa có route đọc bài (chưa deploy). Chrome tự
// log mọi phản hồi 4xx nên không nuốt được từ JS — cách duy nhất cho console
// sạch là đừng gọi nữa. Nhớ trong phiên này, tới khi người dùng bấm "Thử lại".
let readerEndpointMissing = false;
export const retryReaderEndpoint = () => { readerEndpointMissing = false; };

export const todayFeedApi = {
  // Ngôn ngữ quyết định luôn thị trường tin và múi giờ ấn bản ở phía server.
  getFeed({ language = "vi", category = "all", page = 1, limit = 12, signal } = {}) {
    const edition = normalizedEdition(language);
    const params = new URLSearchParams({
      lang: edition.language,
      edition: edition.country,
      feedVersion: "3",
      category,
      page: String(page),
      limit: String(limit),
    });
    return apiFetch(`/today/feed?${params}`, { auth: false, signal, cache: "no-store" })
      .then((feed) => assertTodayFeedEdition(feed, edition.language));
  },

  // Trang đọc: server tra bài theo id (client không gửi URL) rồi trả tóm tắt;
  // toàn văn chỉ có với nguồn được cấp quyền rõ ràng.
  getArticle({ id, language = "vi", category = "all", signal } = {}) {
    const params = new URLSearchParams({ lang: languageCode(language), category });
    // Trang đọc đã có sẵn dữ liệu bài từ cache feed để dựng tạm, nên hỏng ở
    // đây KHÔNG phải lỗi chặn người dùng — trả null thay vì ném stack đỏ.
    if (readerEndpointMissing) return Promise.resolve(null);
    return apiFetch(`/today/article/${encodeURIComponent(id)}?${params}`, { signal, cache: "no-store" })
      .then((payload) => {
        if (!isTodayArticleForLanguage(payload, language)) {
          throw new Error("Today article edition mismatch");
        }
        return payload;
      })
      .catch((error) => {
        readerEndpointMissing = error.message.includes("404");
        console.warn("[today] chưa đọc được toàn văn:", error.message);
        return null;
      });
  },
};
