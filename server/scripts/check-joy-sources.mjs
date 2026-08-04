#!/usr/bin/env node
// Kiểm tra danh mục nguồn JOY. Chạy: node server/scripts/check-joy-sources.mjs
//
// Có lý do rất cụ thể: `app_plan` / `app_plan_gift` từng được truyền vào
// awardJoy nhưng không nằm trong enum của JoyLedger, nên mọi lượt mua-tặng gói
// ứng dụng đều chết ở INVALID_JOY_SOURCE — không ai phát hiện vì lỗi chỉ hiện
// lúc chạy thật. Script này bắt đúng lớp lỗi đó: nguồn dùng trong code mà
// không có trong danh mục.

import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOY_SOURCES, JOY_SOURCE_KEYS, JOY_SOURCE_GROUPS } from '../utils/joySources.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function jsFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await jsFiles(full)));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) out.push(full);
  }
  return out;
}

// Lấy đối số thứ ba của mọi lời gọi awardJoy(...) là chuỗi hằng, kể cả khi lời
// gọi trải trên nhiều dòng hoặc nguồn nằm trong biểu thức ba ngôi.
function extractSources(code) {
  const found = new Set();
  for (const m of code.matchAll(/awardJoy\s*\(/g)) {
    let i = m.index + m[0].length;
    let depth = 1;
    let args = '';
    while (i < code.length && depth > 0) {
      const c = code[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      if (depth > 0) args += c;
      i++;
    }
    // Bỏ đối số 1 (email) và 2 (amount) ở mức ngoặc ngoài cùng.
    const parts = [];
    let cur = '';
    let d = 0;
    for (const c of args) {
      if ('([{'.includes(c)) d++;
      if (')]}'.includes(c)) d--;
      if (c === ',' && d === 0) { parts.push(cur); cur = ''; continue; }
      cur += c;
    }
    parts.push(cur);
    const third = parts[2] || '';
    for (const s of third.matchAll(/['"`]([a-z][a-z_0-9]*)['"`]/g)) found.add(s[1]);
  }
  return found;
}

const files = await jsFiles(serverDir);
const used = new Set();
for (const f of files) {
  if (f.endsWith('check-joy-sources.mjs')) continue;
  for (const s of extractSources(await readFile(f, 'utf8'))) used.add(s);
}

const missing = [...used].filter((s) => !JOY_SOURCES[s]);
assert.deepEqual(
  missing,
  [],
  `Nguồn JOY dùng trong awardJoy nhưng thiếu trong utils/joySources.js: ${missing.join(', ')}`
);

// Model phải soi đúng danh mục, không được có bản chép tay thứ hai.
const { default: JoyLedger } = await import('../models/JoyLedger.js');
assert.deepEqual(
  JoyLedger.schema.path('source').enumValues,
  JOY_SOURCE_KEYS,
  'enum của JoyLedger đã lệch khỏi JOY_SOURCES'
);

// Mọi nhóm phải trỏ tới nguồn có thật (joySources.js cũng tự kiểm lúc import).
for (const key of Object.keys(JOY_SOURCE_GROUPS)) {
  assert.ok(JOY_SOURCES[key], `JOY_SOURCE_GROUPS trỏ tới nguồn không tồn tại: ${key}`);
}

console.log(
  `✓ ${JOY_SOURCE_KEYS.length} nguồn JOY, ${used.size} nguồn được awardJoy dùng — khớp hết.`
);
