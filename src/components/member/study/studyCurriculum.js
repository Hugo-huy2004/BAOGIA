// ── ĐỊA CHỈ APP CODING ─────────────────────────────────────────────────────
// <base>                 → trang chủ: danh sách step theo chặng
// <base>/coding          → bản đồ khoá học
// <base>/coding/<step>   → đang học một step (/study/coding/step3)
//
// Mọi màn đều có địa chỉ nên tải lại trang ở đâu thì ở nguyên đó. Liên kết cũ
// (/study/web/lesson7, /study/calendar…) trỏ vào giáo trình đã gỡ ngày
// 27/10/2026: khoá Web cũ mở bản đồ Coding, còn lại về trang chủ.
export const COURSE_MAP_ROUTE = "coding";
const LESSON_PATTERN = /^step(?:[1-9]|[1-9]\d)$/;
const LEGACY_COURSE_ROUTES = new Set(["web"]);

/**
 * Màn đang mở, suy ra chỉ từ ĐỊA CHỈ.
 *
 * @param pathname đường dẫn đầy đủ, để cắt ra `basePath`
 * @param segment  đoạn khoá (`coding`)
 * @param sub      đoạn step (tuỳ chọn)
 */
export function resolveStudyRoute(pathname, segment, sub) {
  const path = String(pathname || "").replace(/\/+$/, "");
  const cut = (base, part) => (part && base.endsWith(`/${part}`) ? base.slice(0, -(part.length + 1)) : base);
  const basePath = cut(cut(path, sub), segment) || "/study";

  if (segment === COURSE_MAP_ROUTE || LEGACY_COURSE_ROUTES.has(segment)) {
    return { view: "coder", lessonId: LESSON_PATTERN.test(sub || "") ? sub : null, basePath };
  }
  // Dạng một đoạn: /study/step3.
  if (LESSON_PATTERN.test(segment || "")) return { view: "coder", lessonId: segment, basePath: cut(path, segment) || "/study" };
  return { view: null, lessonId: null, basePath: cut(path, segment) || "/study" };
}
