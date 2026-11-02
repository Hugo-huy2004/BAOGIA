import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchLesson, fetchLessonPage } from "../services/api/modules/coderLessonsApi";
import { localizeStage, localizeStepTitle, useEduText } from "../education/eduText";

/** Khoá của một step: id "sqlN" thuộc khoá SQL, còn lại là Coding. */
export const courseOfStep = (id) => (/^sql\d+$/.test(String(id || "")) ? "sql" : "coding");

export function useCoderLessons(activeCourseId, { enabled = true, program = "coding", course: wanted } = {}) {
  const course = wanted || courseOfStep(activeCourseId);
  // Tên chặng/step và nội dung slide theo ngôn ngữ app (máy chủ phủ bản dịch lên).
  const { lang } = useEduText();
  const catalogQuery = useInfiniteQuery({
    queryKey: ["coder-lessons", "catalog", course],
    queryFn: ({ pageParam, signal }) => fetchLessonPage(pageParam, signal, course),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (
      lastPage.pagination?.hasNextPage ? lastPage.pagination.page + 1 : undefined
    ),
    staleTime: 10 * 60_000,
    enabled,
  });

  // The lightweight catalog is paginated at the API boundary. Fetch remaining
  // summary pages progressively; full lesson bodies stay strictly on-demand.
  useEffect(() => {
    if (
      enabled
      && catalogQuery.hasNextPage
      && !catalogQuery.isFetchingNextPage
      && !catalogQuery.isLoading
    ) {
      catalogQuery.fetchNextPage();
    }
  }, [
    enabled,
    catalogQuery.hasNextPage,
    catalogQuery.isFetchingNextPage,
    catalogQuery.isLoading,
    catalogQuery.fetchNextPage,
  ]);

  const summaries = useMemo(
    () => catalogQuery.data?.pages.flatMap((page) => page.items || []) || [],
    [catalogQuery.data],
  );
  const rawStages = catalogQuery.data?.pages[0]?.stages;
  const stages = useMemo(() => (rawStages || []).map((stage) => localizeStage(stage, lang)), [rawStages, lang]);
  const selectedId = activeCourseId || summaries[0]?.id || null;
  const summary = summaries.find((item) => item.id === selectedId);

  const detailQuery = useQuery({
    queryKey: ["coder-lessons", "detail", selectedId, program, lang],
    queryFn: ({ signal }) => fetchLesson(selectedId, signal, program, lang),
    enabled: enabled && Boolean(selectedId),
    placeholderData: summary ? { lesson: summary } : undefined,
    staleTime: 10 * 60_000,
    // 401 (chưa đăng nhập) / 403 (Hugo Team hết hạn) là câu trả lời cuối, thử lại vô ích.
    retry: (count, error) => ![401, 403].includes(error?.status) && count < 3,
  });

  const selectedLesson = detailQuery.data?.lesson || summary || null;
  const courses = useMemo(
    () => summaries.map((item, index) => {
      const course = item.id === selectedLesson?.id ? { ...item, ...selectedLesson } : item;
      return { ...course, title: localizeStepTitle(course.title, index, lang, item.id.startsWith("sql") ? "sql" : "coding") };
    }),
    [summaries, selectedLesson, lang],
  );

  return {
    courses,
    stages,
    selectedLesson,
    // Chi tiết đã tải xong (có slide) — bản tóm tắt trong danh mục thì chưa.
    detailReady: Boolean(detailQuery.data?.lesson?.slides),
    loading: catalogQuery.isLoading || (Boolean(selectedId) && detailQuery.isLoading),
    error: catalogQuery.error || detailQuery.error,
    // 401/403 từ máy chủ: hub hiện lời nhắc đăng nhập thay cho bài.
    detailError: detailQuery.error,
  };
}
