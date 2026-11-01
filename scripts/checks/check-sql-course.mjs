// Khoá SQL: mọi ô `sql` (ví dụ + lời giải bài tập) phải chạy được trên dữ liệu mẫu quán Hạt,
// và lời giải phải trả về bảng. Bắt lỗi soạn bài trước khi học viên gặp.
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
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(`✓ Khoá SQL: ${cells} ô SQL chạy được trên dữ liệu mẫu.`);
