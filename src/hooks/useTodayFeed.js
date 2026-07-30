import { useQuery } from "@tanstack/react-query";
import { todayFeedApi } from "../services/todayFeedApi";

export const todayFeedKey = (language, category) => [
  "today-feed",
  language === "en" ? "en" : "vi",
  category,
];

const millisecondsUntilNine = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(9, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return Math.max(1000, next.getTime() - now.getTime());
};

export function useTodayFeed(language, category = "all") {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return useQuery({
    queryKey: [...todayFeedKey(language, category), timeZone],
    queryFn: ({ signal }) => todayFeedApi.getFeed({
      language,
      category,
      timeZone,
      limit: 24,
      signal,
    }),
    staleTime: millisecondsUntilNine(),
    gcTime: 30 * 60 * 1000,
    retry: 2,
    refetchInterval: () => millisecondsUntilNine() + 1000,
    refetchOnWindowFocus: false,
  });
}
