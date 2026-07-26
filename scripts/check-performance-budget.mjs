import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

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
  const size = (await stat(path.join(assetsDir, file))).size;
  const max = budget.maxBytes;
  const percent = ((size / max) * 100).toFixed(1);
  const marker = size <= max ? "PASS" : "FAIL";
  console.log(`${marker} ${budget.name}: ${(size / 1000).toFixed(1)} kB / ${(max / 1000).toFixed(1)} kB (${percent}%)`);
  if (size > max) {
    failures.push(`${budget.name}: ${size} bytes exceeds ${max} bytes (${file})`);
  }
}

if (failures.length) {
  console.error("\nPerformance budget failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("\nAll performance budgets passed.");
