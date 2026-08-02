import { useQuery } from "@tanstack/react-query";
import { todayFeedApi } from "../services/todayFeedApi";
import { isEcoOn } from "../Save_E/ecoMode";

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
  // Chế độ Bảo vệ môi trường: tải một lượt rồi thôi. Không hẹn giờ làm mới,
  // không gọi lại khi quay lại tab, và lấy ít bài hơn — mỗi request là điện
  // tiêu thụ ở phía máy chủ.
  const eco = isEcoOn();
  return useQuery({
    queryKey: [...todayFeedKey(language, category), timeZone],
    queryFn: ({ signal }) => todayFeedApi.getFeed({
      language,
      category,
      timeZone,
      limit: eco ? 24 : 120,
      signal,
    }),
    staleTime: eco ? Infinity : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: eco ? 0 : 2,
    refetchInterval: eco ? false : REFRESH_MS,
    refetchOnWindowFocus: !eco,
  });
}
