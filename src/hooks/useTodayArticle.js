import { useQuery } from "@tanstack/react-query";
import { todayFeedApi } from "../services/todayFeedApi";
import { languageCode } from "../i18n/languages";

// Bài đã tóm tắt thì không đổi trong ngày — giữ lâu trong cache để quay lại
// trang đọc là hiện ngay, không gọi lại server (và không đốt quota AI).
export function useTodayArticle(id, language, category = "all") {
  return useQuery({
    queryKey: ["today-article", id, languageCode(language)],
    queryFn: ({ signal }) => todayFeedApi.getArticle({ id, language, category, signal }),
    enabled: Boolean(id),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
