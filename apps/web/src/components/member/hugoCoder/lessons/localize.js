// Phủ bản dịch + slide riêng nước sở tại lên một step gốc tiếng Việt. Máy chủ
// (lessonController) và check:coder-content dùng chung — đuôi .js để Node import.
import { readFileSync } from "node:fs";
import { EXTRA_SLIDES } from "./locales/extra.js";

export const LESSON_LANGS = ["en", "zh"];

// Bản dịch (scripts/.translate-edu-lessons.mjs) cùng hình dạng với WEB_COURSES, chỉ
// chứa chữ. Thiếu tệp hoặc thiếu mục thì giữ bản gốc tiếng Việt.
export const LESSON_LOCALES = Object.fromEntries(LESSON_LANGS.map((lang) => {
  try {
    return [lang, JSON.parse(readFileSync(new URL(`./locales/${lang}.json`, import.meta.url), "utf8"))];
  } catch { return [lang, null]; }
}));

function overlay(base, tr) {
  if (typeof tr === "string") return typeof base === "string" ? tr : base;
  if (!tr || typeof tr !== "object" || !base || typeof base !== "object") return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(tr)) if (key in out) out[key] = overlay(out[key], tr[key]);
  return out;
}

export function localizeCourse(course, lang) {
  const text = overlay(course, LESSON_LOCALES[lang]?.[course.id]);
  const extra = EXTRA_SLIDES[lang]?.[course.id];
  if (!extra) return text;
  // Chèn từ cuối lên để chỉ số `after` vẫn là chỉ số của bản gốc.
  const slides = [...text.slides];
  [...extra].sort((a, b) => b.after - a.after).forEach(({ after, slide }) => slides.splice(after + 1, 0, slide));
  return { ...text, slides };
}
