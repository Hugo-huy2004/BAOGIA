import { apiFetch } from "./api";

class TodayFeedApi {
  async getFeed({
    language = "vi",
    category = "all",
    country,
    timeZone,
    page = 1,
    limit = 12,
    signal,
  } = {}) {
    const params = new URLSearchParams({
      lang: language === "en" ? "en" : "vi",
      category,
      page: String(page),
      limit: String(limit),
    });
    if (country) params.set("country", country);
    if (timeZone) params.set("timezone", timeZone);
    return apiFetch(`/today/feed?${params}`, { auth: false, signal });
  }
}

export const todayFeedApi = new TodayFeedApi();
