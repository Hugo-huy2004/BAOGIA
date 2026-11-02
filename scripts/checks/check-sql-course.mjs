// Khoá SQL: mọi ô `sql` (ví dụ + lời giải bài tập) phải chạy được trên dữ liệu mẫu quán Hạt,
// và lời giải phải trả về bảng. Bắt lỗi soạn bài trước khi học viên gặp.
import { readFileSync } from "node:fs";
import initSqlJs from "sql.js";
import { HAT_SEED } from "../../packages/courses/sql/seed.js";
import { WEB_COURSES } from "../../packages/courses/sql/index.js";

const SQL = await initSqlJs();
const issues = [];
let cells = 0;
for (const step of WEB_COURSES.filter((s) => !s.draft)) {
  step.slides.forEach((slide, i) => {
    if (!slide.sql) return;
    for (const [field, text] of [["query", slide.sql.query], ["solution", slide.sql.solution]]) {
      if (!text?.trim() || /^\s*--[^\n]*\s*$/.test(text)) continue;
      cells += 1;
      const db = new SQL.Database();
      db.exec(HAT_SEED + (slide.sql.setup || ""));
      try {
        const out = db.exec(text);
        if (field === "solution" && !out.length) issues.push(`${step.id}.slides[${i}] lời giải không trả bảng nào.`);
      } catch (error) {
        // Ô ví dụ "cố ý sai" phải nói rõ trong bài.
        if (!(field === "query" && /cố ý sai/.test(slide.body))) issues.push(`${step.id}.slides[${i}].${field}: ${error.message}`);
      } finally { db.close(); }
    }
    if (slide.sql.solution && !slide.sql.hints?.length) issues.push(`${step.id}.slides[${i}]: bài tập thiếu gợi ý.`);
  });
}
// Bản dịch en/zh (locales/*.json): đoạn mã giữ nguyên như bản gốc, không thêm khoá lạ.
const CODE = /~~~[\s\S]*?~~~|`[^`\n]+`/g;
const codeOf = (text) => (String(text).match(CODE) || []).sort().join("\n");
const byId = new Map(WEB_COURSES.map((s) => [s.id, s]));
let translated = 0;
for (const lang of ["en", "zh"]) {
  let locale;
  try { locale = JSON.parse(readFileSync(new URL(`../../packages/courses/sql/locales/${lang}.json`, import.meta.url), "utf8")); } catch { continue; }
  const walk = (base, tr, where) => {
    if (typeof tr === "string") {
      if (typeof base !== "string") return issues.push(`${lang} ${where}: bản dịch là chữ nhưng gốc không phải.`);
      translated += 1;
      if (codeOf(base) !== codeOf(tr)) issues.push(`${lang} ${where}: đoạn mã trong bản dịch khác bản gốc.`);
      return undefined;
    }
    if (!tr || typeof tr !== "object") return undefined;
    for (const key of Object.keys(tr)) {
      if (!base || typeof base !== "object" || !(key in base)) issues.push(`${lang} ${where}.${key}: khoá không có trong bản gốc.`);
      else walk(base[key], tr[key], `${where}.${key}`);
    }
    return undefined;
  };
  for (const [id, tr] of Object.entries(locale)) walk(byId.get(id), tr, id);
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`✓ Khoá SQL: ${cells} ô SQL chạy được trên dữ liệu mẫu · ${translated} đoạn dịch giữ nguyên mã.`);
