/**
 * Đối chiếu mọi .env từng lọt vào lịch sử git với .env đang dùng.
 *
 * Repo này là repo CÔNG KHAI và `.env` đã từng được commit (commit 870b93c).
 * `.gitignore` chặn từ đó về sau, nhưng lịch sử thì vẫn còn — ai clone cũng đọc
 * được. Thứ duy nhất thực sự chặn được là XOAY KHOÁ, và script này chỉ ra chính
 * xác khoá nào chưa xoay.
 *
 * So bằng SHA-256 rồi cắt 16 ký tự: đủ để biết "giống hay khác" mà không in giá
 * trị bí mật ra màn hình hay vào log CI.
 *
 * Chạy: node server/scripts/check-leaked-secrets.mjs
 * Không đưa vào check:all — nó cần lịch sử git đầy đủ, mà CI thường clone nông.
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import crypto from "node:crypto";

const h = (v) => crypto.createHash("sha256").update(v).digest("hex").slice(0, 16);
const parse = (txt) => Object.fromEntries(
  txt.split("\n").filter((l) => /^[A-Z_0-9]+=/.test(l))
     .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim()]; })
);

// Mọi bản .env từng nằm trong lịch sử git
const leaked = {};
const commits = execSync("git log --all --format=%h -- .env server/.env", { encoding: "utf8" }).trim().split("\n").filter(Boolean);
for (const c of commits) {
  for (const f of [".env", "server/.env"]) {
    try { Object.assign(leaked, parse(execSync(`git show ${c}:${f} 2>/dev/null`, { encoding: "utf8" }))); } catch {}
  }
}

// .env đang dùng
const current = {};
for (const f of [".env", "server/.env", ".env.production"]) {
  if (existsSync(f)) Object.assign(current, parse(readFileSync(f, "utf8")));
}

const rows = [];
for (const [k, v] of Object.entries(leaked)) {
  if (!v) continue;
  const now = current[k];
  if (now === undefined) rows.push([k, "không còn dùng", "—"]);
  else if (h(now) === h(v))  rows.push([k, "⚠️  CHƯA XOAY", "phải xoay"]);
  else rows.push([k, "đã xoay", "ok"]);
}
rows.sort((a, b) => a[1].localeCompare(b[1]));
console.log(`Lịch sử git có ${commits.length} commit đụng .env, lộ ${Object.keys(leaked).length} khoá.\n`);
for (const [k, s] of rows) console.log(`  ${s.padEnd(16)} ${k}`);
const bad = rows.filter((r) => r[2] === "phải xoay").length;
console.log(`\n=> ${bad} khoá phải xoay ngay.`);
