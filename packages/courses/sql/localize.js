// Phủ bản dịch (locales/<lang>.json, do scripts/translate-course.mjs sinh) lên step gốc tiếng Việt.
// Cùng cách với ../coding/localize.js, không có slide riêng nước sở tại. Thiếu tệp/mục thì giữ bản gốc.
import { readFileSync } from "node:fs";

const LOCALES = Object.fromEntries(["en", "zh"].map((lang) => {
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

export const localizeCourse = (course, lang) => overlay(course, LOCALES[lang]?.[course.id]);
