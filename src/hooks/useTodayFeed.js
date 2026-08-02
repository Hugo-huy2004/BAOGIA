import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { todayFeedApi } from "../services/todayFeedApi";
import { isEcoOn } from "../Save_E/ecoMode";
import { cacheFeed, readFeedCache, recordFeedHit } from "../Save_E/ecoStore";

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
  const key = [...todayFeedKey(language, category), timeZone];
  // Bộ nhớ đệm sống qua cả lần đóng app: mở lại trong 6 tiếng là KHÔNG gọi máy
  // chủ lần nào. react-query chỉ nhớ trong RAM nên đóng app là mất sạch.
  const [cached] = useState(() => (eco ? readFeedCache(key.join(":")) : null));

  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => todayFeedApi.getFeed({
      language,
      category,
      timeZone,
      limit: eco ? 24 : 120,
      signal,
    }),
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.at,
    staleTime: eco ? Infinity : 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: eco ? 0 : 2,
    refetchInterval: eco ? false : REFRESH_MS,
    refetchOnWindowFocus: !eco,
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
    cacheFeed(key.join(":"), data);
    // key là mảng dựng lại mỗi lần render; nội dung của nó đã nằm trong deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eco, cached, data]);

  return query;
}
