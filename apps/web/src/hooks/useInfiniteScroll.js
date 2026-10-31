/**
 * Infinite-scroll hook using IntersectionObserver.
 *
 * Usage:
 *   const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(items, { pageSize: 20 });
 *
 * Attach `ref={sentinelRef}` to an empty <div> at the bottom of the list.
 * The hook loads the next page whenever that sentinel enters the viewport.
 */
import { useState, useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(allItems = [], { pageSize = 20, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const sentinelRef = useRef(null);

  // Reset to first page when the source list changes (filter/sort applied).
  // `resetKey` lets a caller opt out of that: a feed that auto-refreshes gets a
  // brand-new array every poll, and resetting there would yank the reader back
  // to the top mid-scroll. Default keeps the old behaviour.
  const reset = resetKey === undefined ? allItems : resetKey;
  useEffect(() => { setPage(1); }, [reset]);

  const visibleItems = allItems.slice(0, page * pageSize);
  const hasMore = visibleItems.length < allItems.length;

  const loadMore = useCallback(() => {
    if (hasMore) setPage((p) => p + 1);
  }, [hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return { visibleItems, sentinelRef, hasMore, page };
}
