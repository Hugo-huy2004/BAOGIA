/**
 * Đối chiếu CSP trong vercel.json với HTML đã build.
 *
 * `script-src` dùng hash cho khối <script> inline trong index.html. Sửa một ký
 * tự trong khối đó — kể cả một dấu cách — là hash đổi, trình duyệt CHẶN script,
 * và toàn site trắng màn ngay lần deploy kế tiếp. Không có lỗi build nào bắt
 * được: HTML vẫn hợp lệ, chỉ trình duyệt người dùng mới từ chối chạy.
 *
 * Script này chạy sau `vite build`, băm mọi script inline THỰC THI trong dist
 * rồi đòi CSP phải có đủ hash. Thiếu một cái là fail.
 *
 * `application/ld+json` được bỏ qua có chủ ý: trình duyệt không thực thi nó nên
 * script-src không chặn, mà nội dung lại khác nhau theo từng trang prerender.
 *
 * Chạy: node scripts/check-csp.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DIST = path.join(ROOT, "dist");

const htmlFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (entry.endsWith(".html")) htmlFiles.push(full);
  }
})(DIST);

const csp = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"))
  .headers.flatMap((g) => g.headers)
  .find((h) => h.key === "Content-Security-Policy")?.value || "";

if (!/script-src/.test(csp)) {
  console.error("✗ vercel.json không có script-src — trang admin sẽ chạy script inline tuỳ ý.");
  process.exit(1);
}

const missing = new Map();
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const [, attrs, body] = m;
    if (/\ssrc=/.test(attrs) || /ld\+json/.test(attrs)) continue;
    const hash = "sha256-" + createHash("sha256").update(body).digest("base64");
    if (!csp.includes(hash)) {
      if (!missing.has(hash)) missing.set(hash, []);
      missing.get(hash).push(path.relative(DIST, file));
    }
  }
}

if (missing.size === 0) {
  console.log(`CSP check đạt: ${htmlFiles.length} trang, mọi script inline đều có hash trong vercel.json.`);
  process.exit(0);
}

console.error(`✗ ${missing.size} script inline KHÔNG có hash trong CSP — deploy là trắng màn:\n`);
for (const [hash, files] of missing) {
  console.error(`  '${hash}'`);
  console.error(`    ${files.length} trang, ví dụ: ${files.slice(0, 3).join(", ")}\n`);
}
console.error("Cách sửa: thêm hash trên vào script-src trong vercel.json.");
process.exit(1);
