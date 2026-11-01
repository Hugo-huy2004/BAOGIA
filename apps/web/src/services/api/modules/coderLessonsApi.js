import { apiFetch } from "../core/apiClient";

export function fetchLessonPage(page = 1, signal, course = "coding") {
  return apiFetch(`/coder-lessons?page=${page}&limit=25${course === "coding" ? "" : `&course=${course}`}`, { signal });
}

export function fetchLesson(lessonId, signal, program = "coding", lang = "vi") {
  const params = new URLSearchParams();
  if (program === "hugoteam") params.set("program", "hugoteam");
  if (lang !== "vi") params.set("lang", lang);
  const query = params.size ? `?${params}` : "";
  return apiFetch(`/coder-lessons/${encodeURIComponent(lessonId)}${query}`, { signal });
}
