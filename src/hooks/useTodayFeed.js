import { useQuery } from "@tanstack/react-query";
import { todayFeedApi } from "../services/todayFeedApi";

export const todayFeedKey = (language, category) => [
  "today-feed",
  language === "en" ? "en" : "vi",
  category,
];

// Server làm mới kho bài mỗi 10 phút; client bám theo nhịp đó. Chỉ chạy khi
// tab đang hiện (mặc định của react-query) nên không đốt băng thông Render lúc
// máy nằm im.
const REFRESH_MS = 10 * 60 * 1000;

export function useTodayFeed(language, category = "all") {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: [...todayFeedKey(language, category), timeZone],
    queryFn: ({ signal }) => todayFeedApi.getFeed({
      language,
      category,
      timeZone,
      limit: 120,
      signal,
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}
