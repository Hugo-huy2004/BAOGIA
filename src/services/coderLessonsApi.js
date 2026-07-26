import { apiFetch } from "./api";

export function fetchLessonPage(page = 1, signal) {
  return apiFetch(`/coder-lessons?page=${page}&limit=25`, { signal });
}

export function fetchLesson(lessonId, signal) {
  return apiFetch(`/coder-lessons/${encodeURIComponent(lessonId)}`, { signal });
}

export function verifyLessonCode(lessonId, code, signal) {
  return apiFetch(`/coder-lessons/${encodeURIComponent(lessonId)}/verify`, {
    method: "POST",
    body: JSON.stringify({ code }),
    signal,
  });
}
