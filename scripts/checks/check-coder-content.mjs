import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { auditCoderContent } from "../../packages/shared/coderContentIntegrity.js";
import { STAGES, WEB_COURSES, MAX_SLIDES } from "../../apps/web/src/components/member/hugoCoder/lessons/index.js";

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

if (result.issues.length) {
  console.error(`Coder content invalid (${result.issues.length} lỗi):`);
  result.issues.forEach((issue) => console.error(`- ${issue}`));
  process.exitCode = 1;
} else {
  console.log(
    `Coder content OK: ${result.writtenCount}/${result.courseCount} step đã soạn, `
    + `${result.slideCount} slide, ${result.questionCount} câu trắc nghiệm hợp lệ, ${visualKeys.size} hình minh hoạ.`,
  );
}
