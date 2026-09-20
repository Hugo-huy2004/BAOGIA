import { readFile, readdir, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import path from "node:path";
import process from "node:process";

/**
 * Ngân sách theo BYTE ĐÃ NÉN cho những tệp mà con số thô không nói lên gì.
 *
 * Vì sao: frontend do Vercel chạy và Vercel nén ở biên (đây cũng là lý do repo
 * đã bỏ `vite-plugin-compression` — xem chú thích trong vite.config.js). Trình
 * duyệt không bao giờ tải tệp thô, nên canh byte thô là canh một con số không ai
 * trải nghiệm. Với Tailwind thì khoảng cách rất lớn: tệp CSS toàn cục 385 KB thô
 * chỉ còn ~56 KB qua dây — gấp gần 7 lần.
 *
 * Budget nào khai `maxGzipBytes` thì CHẶN theo số nén, và số thô chỉ in ra để
 * tham khảo. Budget không khai thì giữ nguyên cách cũ, không phải chỉnh lại cả
 * 12 con số đang đúng.
 */

const root = process.cwd();
const config = JSON.parse(
  await readFile(path.join(root, "performance-budgets.json"), "utf8"),
);
const assetsDir = path.join(root, config.assetsDirectory);
const files = await readdir(assetsDir);
const html = await readFile(path.join(root, "dist/index.html"), "utf8");

function assetFromHtml(type) {
  const expression = type === "html-script"
    ? /<script[^>]+src="\/assets\/([^"]+\.js)"/
    : /<link[^>]+href="\/assets\/([^"]+\.css)"/;
  return html.match(expression)?.[1] || null;
}

function resolveAsset(budget) {
  if (budget.source) return assetFromHtml(budget.source);
  const matcher = new RegExp(budget.pattern);
  return files.find((file) => matcher.test(file)) || null;
}

const failures = [];
for (const forbidden of config.forbiddenAssets || []) {
  const matcher = new RegExp(forbidden.pattern);
  const match = files.find((file) => matcher.test(file));
  if (match) failures.push(`${forbidden.message} Found: ${match}`);
}

for (const budget of config.budgets) {
  const file = resolveAsset(budget);
  if (!file) {
    failures.push(`${budget.name}: matching asset was not found`);
    continue;
  }
  const full = path.join(assetsDir, file);
  const rawSize = (await stat(full)).size;
  const gzipBudget = typeof budget.maxGzipBytes === "number";
  const size = gzipBudget ? gzipSync(await readFile(full)).length : rawSize;
  const max = gzipBudget ? budget.maxGzipBytes : budget.maxBytes;
  const percent = ((size / max) * 100).toFixed(1);
  const marker = size <= max ? "PASS" : "FAIL";
  const unit = gzipBudget ? " gzip" : "";
  const aside = gzipBudget ? ` [thô ${(rawSize / 1000).toFixed(1)} kB]` : "";
  console.log(`${marker} ${budget.name}: ${(size / 1000).toFixed(1)}${unit} kB / ${(max / 1000).toFixed(1)} kB (${percent}%)${aside}`);
  if (size > max) {
    failures.push(`${budget.name}: ${size} bytes${unit} exceeds ${max} bytes (${file})`);
  }
}

if (failures.length) {
  console.error("\nPerformance budget failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("\nAll performance budgets passed.");
