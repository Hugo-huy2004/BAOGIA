import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { auditCoderContent } from "../../packages/shared/coderContentIntegrity.js";
import { STAGES, WEB_COURSES, MAX_SLIDES } from "../../packages/courses/coding/index.js";
import { LESSON_LANGS, LESSON_LOCALES, localizeCourse } from "../../packages/courses/coding/localize.js";

// Khoá hình minh hoạ có thật: đọc thẳng từ CodingVisual.jsx (Node không nạp JSX).
const visualSource = readFileSync("apps/web/src/components/member/hugoCoder/CodingVisual.jsx", "utf8");
const visualBlock = visualSource.slice(visualSource.indexOf("const VISUALS = {"));
const visualKeys = new Set([...visualBlock.matchAll(/^ {2}"?([\w-]+)"?: \(\) =>/gm)].map((match) => match[1]));

const result = auditCoderContent(WEB_COURSES, STAGES, {
  maxSlides: MAX_SLIDES,
  visualKeys,
  imageExists: (src) => src.startsWith("/") && existsSync(join("apps/web/public", src)),
});

// Backend của dự án chạy cổng 8099; 8081 là cổng của Metro/Expo (CLAUDE.md).
// Giáo trình dạy 8081 thì học viên chép đúng cái bẫy đó về máy.
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(dir, e.name)) : /\.(jsx?|mjs|json)$/.test(e.name) ? [join(dir, e.name)] : []);
for (const file of [...walk("apps/web/src/components/member/hugoCoder"), ...walk("packages/shared")]) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (line.includes("8081")) result.issues.push(`${file}:${i + 1}: cổng 8081 — backend dự án là 8099.`);
  });
}

// Bản dịch phải khớp bài gốc: không tạo khoá lạ, giữ nguyên số đáp án và mọi đoạn mã.
// Slide riêng nước sở tại phải chèn đúng chỗ và không vượt MAX_SLIDES.
const CODE = /~~~[\s\S]*?~~~|```[\s\S]*?```|`[^`\n]+`/g;
const coverage = {};
function compare(base, tr, where, lang) {
  if (typeof tr === "string") {
    if (typeof base !== "string") return result.issues.push(`${lang} ${where}: bản dịch là chữ nhưng gốc không phải.`);
    coverage[lang].done += 1;
    const code = (text) => (text.match(CODE) || []).sort().join("\n");
    if (code(base) !== code(tr)) result.issues.push(`${lang} ${where}: đoạn mã trong bản dịch khác bản gốc.`);
    // Máy dịch không được chèn thêm HTML chạy được hay liên kết lạ vào bài.
    const prose = (text) => text.replace(CODE, "");
    if (/<\s*(script|iframe|object|embed|img|svg|a)\b|javascript:|\son\w+\s*=/i.test(prose(tr)) && !/<\s*(script|iframe|object|embed|img|svg|a)\b|javascript:|\son\w+\s*=/i.test(prose(base))) {
      result.issues.push(`${lang} ${where}: bản dịch có HTML/script mà bản gốc không có.`);
    }
    const urls = (text) => new Set(text.match(/https?:\/\/[^\s)>\]"'`]+/g) || []);
    const known = urls(base);
    for (const url of urls(tr)) if (!known.has(url)) result.issues.push(`${lang} ${where}: liên kết lạ ${url}.`);
    return;
  }
  if (!tr || typeof tr !== "object") return;
  if (!base || typeof base !== "object") return result.issues.push(`${lang} ${where}: khoá không có trong bài gốc.`);
  // Ngắn hơn thì được (mục cuối chưa dịch giữ tiếng Việt); dài hơn là lệch bài.
  if (Array.isArray(base) && (!Array.isArray(tr) || tr.length > base.length)) {
    result.issues.push(`${lang} ${where}: số phần tử ${tr.length} ≠ gốc ${base.length}.`);
  }
  for (const key of Object.keys(tr)) {
    if (!(key in base)) result.issues.push(`${lang} ${where}.${key}: khoá không có trong bài gốc.`);
    else compare(base[key], tr[key], `${where}.${key}`, lang);
  }
}
for (const lang of LESSON_LANGS) {
  coverage[lang] = { done: 0, file: Boolean(LESSON_LOCALES[lang]) };
  for (const course of WEB_COURSES) {
    compare(course, LESSON_LOCALES[lang]?.[course.id], course.id, lang);
    const shown = localizeCourse(course, lang);
    if (shown.slides.length > MAX_SLIDES) result.issues.push(`${lang} ${course.id}: ${shown.slides.length} slide > ${MAX_SLIDES}.`);
    if (shown.quiz.length !== course.quiz.length) result.issues.push(`${lang} ${course.id}: số câu trắc nghiệm đổi.`);
  }
}

if (result.issues.length) {
  console.error(`Coder content invalid (${result.issues.length} lỗi):`);
  result.issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(
    `Coder content OK: ${result.writtenCount}/${result.courseCount} step đã soạn, `
    + `${result.slideCount} slide, ${result.questionCount} câu trắc nghiệm hợp lệ, ${visualKeys.size} hình minh hoạ.`,
  );
  console.log(`Bản dịch: ${LESSON_LANGS.map((lang) => `${lang} ${coverage[lang].file ? `${coverage[lang].done} chữ` : "chưa có tệp"}`).join(" · ")}`);
}
