import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isTodayFeedForLanguage, todayFeedApi } from "../services/todayFeedApi";
import { isEcoOn } from "../Save_E/ecoMode";
import { cacheFeed, readFeedCache, recordFeedHit } from "../Save_E/ecoStore";
import { languageCode } from "../i18n/languages";

export const todayFeedKey = (language, category) => [
  "today-feed",
  languageCode(language),
  category,
  "v3",
];

export function useTodayFeed(language, category = "all") {
  // Chế độ Bảo vệ môi trường: tải một lượt rồi thôi. Không hẹn giờ làm mới,
  // không gọi lại khi quay lại tab, và lấy ít bài hơn — mỗi request là điện
  // tiêu thụ ở phía máy chủ.
  const eco = isEcoOn();
  const key = todayFeedKey(language, category);
  const cacheKey = key.join(":");
  // Bộ nhớ đệm sống qua cả lần đóng app: mở lại trong 6 tiếng là KHÔNG gọi máy
  // chủ lần nào. react-query chỉ nhớ trong RAM nên đóng app là mất sạch.
  const cached = useMemo(() => {
    if (!eco) return null;
    const stored = readFeedCache(cacheKey);
    return stored && isTodayFeedForLanguage(stored.data, language) ? stored : null;
  }, [cacheKey, eco, language]);

  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => todayFeedApi.getFeed({
      language,
      category,
      limit: eco ? 36 : 180,
      signal,
    }),
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.at,
    staleTime: eco ? Infinity : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: eco ? 0 : 2,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (eco && cached) recordFeedHit(cached.bytes);
  }, [eco, cached]);

  const data = query.data;
  useEffect(() => {
    if (!eco || !data) return;
    // `initialData` chính là object trong đệm — so sánh tham chiếu để khỏi ghi
    // lại y nguyên thứ vừa đọc ra. Người dùng bấm "Làm mới" thì data là object
    // mới, và đệm được thay bằng bản vừa tải.
    if (cached && data === cached.data) return;
    cacheFeed(cacheKey, data);
  }, [eco, cached, cacheKey, data]);

  return query;
}
