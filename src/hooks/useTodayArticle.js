import { useQuery } from "@tanstack/react-query";
import { todayFeedApi } from "../services/todayFeedApi";

// Bài đã tóm tắt thì không đổi trong ngày — giữ lâu trong cache để quay lại
// trang đọc là hiện ngay, không gọi lại server (và không đốt quota AI).
export function useTodayArticle(id, language, category = "all") {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: ["today-article", id, language === "en" ? "en" : "vi"],
    queryFn: ({ signal }) => todayFeedApi.getArticle({ id, language, category, timeZone, signal }),
    enabled: Boolean(id),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
