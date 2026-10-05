/**
 * View Transitions API Helper cho SPA (Single Page Application)
 * Tuân thủ tiêu chuẩn web hiện đại với progressive enhancement:
 * - Nếu trình duyệt hỗ trợ document.startViewTransition và người dùng không bật prefers-reduced-motion:
 *   chạy hiệu ứng morphing chuyển trang/tab/modal điện ảnh.
 * - Nếu không hỗ trợ: thực thi callback cập nhật DOM tức thì mà không gây lỗi.
 */

export function startViewTransition(updateFn) {
  if (
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  ) {
    try {
      return document.startViewTransition(() => {
        updateFn();
      });
    } catch {
      // Fallback nếu startViewTransition ném lỗi bất ngờ
      updateFn();
      return { finished: Promise.resolve(), ready: Promise.resolve() };
    }
  }

  updateFn();
  return { finished: Promise.resolve(), ready: Promise.resolve() };
}

/**
 * Hook điều hướng tích hợp View Transitions cho React Router
 */
export function useViewTransitionNavigate(navigate) {
  return (to, options) => {
    startViewTransition(() => {
      navigate(to, options);
    });
  };
}
