import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchLesson, fetchLessonPage } from "../services/coderLessonsApi";

export function getStageBenefitsFromCatalog(stageId, stages = []) {
  return stages.find((stage) => stage.id === stageId)?.benefits || [];
}

export function useCoderLessons(activeCourseId, { enabled = true } = {}) {
  const catalogQuery = useInfiniteQuery({
    queryKey: ["coder-lessons", "catalog"],
    queryFn: ({ pageParam, signal }) => fetchLessonPage(pageParam, signal),
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
  const stages = catalogQuery.data?.pages[0]?.stages || [];
  const selectedId = activeCourseId || summaries[0]?.id || null;
  const summary = summaries.find((item) => item.id === selectedId);

  const detailQuery = useQuery({
    queryKey: ["coder-lessons", "detail", selectedId],
    queryFn: ({ signal }) => fetchLesson(selectedId, signal),
    enabled: enabled && Boolean(selectedId),
    placeholderData: summary ? { lesson: summary } : undefined,
    staleTime: 10 * 60_000,
  });

  const selectedLesson = detailQuery.data?.lesson || summary || null;
  const courses = useMemo(
    () => summaries.map((item) => (
      item.id === selectedLesson?.id ? { ...item, ...selectedLesson } : item
    )),
    [summaries, selectedLesson],
  );

  return {
    courses,
    stages,
    selectedLesson,
    loading: catalogQuery.isLoading || (Boolean(selectedId) && detailQuery.isLoading),
    error: catalogQuery.error || detailQuery.error,
  };
}
