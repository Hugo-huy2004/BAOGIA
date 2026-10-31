import { apiFetch } from "../core/apiClient";

export function fetchLessonPage(page = 1, signal) {
  return apiFetch(`/coder-lessons?page=${page}&limit=25`, { signal });
}

export function fetchLesson(lessonId, signal, program = "coding") {
  const query = program === "hugoteam" ? "?program=hugoteam" : "";
  return apiFetch(`/coder-lessons/${encodeURIComponent(lessonId)}${query}`, { signal });
}
