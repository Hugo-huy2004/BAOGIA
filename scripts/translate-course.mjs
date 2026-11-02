import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
// Dịch một khoá trong packages/courses/<COURSE>/ (mặc định coding) sang en/zh:
//   npm run course:translate                 # khoá coding
//   COURSE=quan npm run course:translate     # khoá khác, cùng cấu trúc thư mục
const COURSE = process.env.COURSE || "coding";
const ROOT = path.resolve(import.meta.dirname, "..");
const { WEB_COURSES } = await import(`../packages/courses/${COURSE}/index.js`);
const CHECKPOINT_DIR = path.join(os.tmpdir(), COURSE === "coding" ? "hugo-edu-lessons-i18n" : `hugo-course-${COURSE}-i18n`);
const OUT_DIR = path.join(ROOT, `packages/courses/${COURSE}/locales`);
const SUBJECT = { coding: "an introductory web-development course", sql: "an SQL and relational database course (SQLite)" }[COURSE] || "a programming course";
const LANGUAGES = {
  en: `natural English for ${SUBJECT}`,
  zh: `natural Simplified Chinese for Mainland China for ${SUBJECT}`,
};
// Tên nút phpMyAdmin 5.2 / XAMPP đúng như giao diện thật ở từng ngôn ngữ — người học
// phải bấm được đúng chữ trên màn hình, không phải bản dịch "gần nghĩa".
const UI_LABELS = [
  ["Cơ sở dữ liệu (tab)", "Databases", "数据库"], ["Tạo cơ sở dữ liệu", "Create database", "新建数据库"],
  ["Tạo (nút)", "Create", "创建"], ["Bảng mã (Collation)", "Collation", "排序规则"],
  ["Nhập", "Import", "导入"], ["Xuất", "Export", "导出"], ["Nhanh (kiểu xuất)", "Quick", "快速"],
  ["Thực hiện", "Go", "执行"], ["Thêm (menu)", "More", "更多"], ["Bộ thiết kế", "Designer", "设计器"],
  ["Chỉ mục", "Indexes", "索引"], ["Cấu trúc", "Structure", "结构"], ["Thao tác", "Operations", "操作"],
  ["Lưu", "Save", "保存"], ["Ngôn ngữ", "Language", "语言 - Language"],
  ["MySQL trả về kết quả là trống rỗng", "MySQL returned an empty result set", "MySQL 返回的查询结果为空"],
];
const labelRule = (col, name) => `When the text names a phpMyAdmin button or tab, use the exact ${name} phpMyAdmin label: ${UI_LABELS.map((row) => `"${row[0]}" → "${row[col]}"`).join("; ")}. Where the Vietnamese says the interface is in Vietnamese, say it is in ${name}.`;
const MAX_CHARS = 6_000;
const MAX_ENTRIES = 100;
const GLOSSARY = { [LANGUAGES.en]: labelRule(1, "English"), [LANGUAGES.zh]: labelRule(2, "Simplified Chinese") };
const run = promisify(execFile);
// Model đôi khi bọc JSON trong ```json … ``` dù đã dặn không — bóc khung trước khi đọc.
const parseJson = (text) => JSON.parse(String(text).trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));

// hints: gợi ý bài tập trong ô SQL (slide.sql.hints) — query/solution là mã, không dịch.
const translatedFields = new Set(["duration", "summary", "title", "body", "alt", "caption", "q", "o", "why", "items", "pairs", "hints"]);

function collect(value, parts = [], entries = []) {
  if (typeof value === "string") {
    entries.push({ path: parts.join("."), text: value });
    return entries;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collect(item, [...parts, index], entries));
    return entries;
  }
  if (!value || typeof value !== "object") return entries;
  for (const [key, item] of Object.entries(value)) {
    if (translatedFields.has(key)) collect(item, [...parts, key], entries);
    else if (key === "slides" || key === "quiz" || key === "image" || key === "sql") collect(item, [...parts, key], entries);
  }
  return entries;
}

function chunks(entries) {
  const result = [];
  let batch = [];
  let size = 0;
  for (const entry of entries) {
    const next = JSON.stringify(entry.text).length;
    if (batch.length && (batch.length >= MAX_ENTRIES || size + next > MAX_CHARS)) {
      result.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(entry);
    size += next;
  }
  if (batch.length) result.push(batch);
  return result;
}

const PROTECTED = /~~~[\s\S]*?~~~|```[\s\S]*?```|`[^`\n]+`|https?:\/\/[^\s)>]+|\b(?:Nhịp|Hugo Studio|Hugo|JOY|HTML|CSS|JavaScript|PHP|MySQL|SQL|PDO|XAMPP|Apache|phpMyAdmin|HTTP|HTTPS|DNS|DOM|API|JSON|CRUD|OWASP|CSRF|XSS|MVC|Git|Fetch|README|SQLite|PostgreSQL|SELECT|FROM|WHERE|JOIN|GROUP BY|HAVING|ORDER BY|LIMIT|OFFSET|NULL|CTE|FTS4|FTS5|B-tree|ACID|Hạt)\b|\d+(?:[.,]\d+)*(?:%|\+)?/g;

function mask(text) {
  const tokens = [];
  return {
    text: text.replace(PROTECTED, (token) => {
      const marker = `__KEEP_${tokens.length}__`;
      tokens.push(token);
      return marker;
    }),
    tokens,
  };
}

function restore(text, tokens) {
  return tokens.reduce((result, token, index) => result.replaceAll(`__KEEP_${index}__`, () => token), String(text));
}

function markers(text) {
  return [...String(text).matchAll(/__KEEP_\d+__/g)].map(([marker]) => marker).sort();
}

async function translateBatch(batch, language) {
  const prepared = batch.map(({ text }) => mask(text));
  const prompt = [
    `Translate Vietnamese course material into ${language}.`,
    `Return ONLY a valid JSON array of exactly ${prepared.length} translated strings in the same order. No Markdown fence or commentary.`,
    "Preserve Markdown structure, paragraph breaks, tables, blockquotes, emphasis and list numbering.",
    "Copy every __KEEP_N__ marker exactly and do not add, remove, reorder or translate markers.",
    "Keep programming terminology accurate and concise. Do not add explanations or facts.",
    GLOSSARY[language] || "",
    JSON.stringify(prepared.map((item) => item.text)),
  ].join("\n");
  const { stdout: response } = await run("claude", ["-p", "--model", "haiku", "--output-format", "text", prompt], {
    maxBuffer: 5 * 1024 * 1024,
    timeout: 180_000,
  });
  try {
    const parsed = parseJson(response);
    if (!Array.isArray(parsed) || parsed.length !== batch.length) throw new Error(`expected ${batch.length}, got ${parsed?.length}`);
    return parsed.map((text, index) => {
      if (JSON.stringify(markers(text)) !== JSON.stringify(markers(prepared[index].text))) throw new Error(`markers changed at ${index}`);
      return restore(text, prepared[index].tokens);
    });
  } catch (error) {
    if (batch.length > 1) {
      const middle = Math.ceil(batch.length / 2);
      return [
        ...await translateBatch(batch.slice(0, middle), language),
        ...await translateBatch(batch.slice(middle), language),
      ];
    }
    const { stdout } = await run("claude", [
      "-p", "--model", "haiku", "--output-format", "text",
      `Translate Vietnamese course material into ${language}. Return ONLY a JSON array with one string. Copy every __KEEP_N__ marker exactly. Preserve Markdown.\n${JSON.stringify([prepared[0].text])}`,
    ], { maxBuffer: 1024 * 1024, timeout: 180_000 });
    const fallback = parseJson(stdout);
    if (!Array.isArray(fallback) || fallback.length !== 1
      || JSON.stringify(markers(fallback[0])) !== JSON.stringify(markers(prepared[0].text))) {
      throw new Error(`${batch[0].path}: ${error.message}`);
    }
    return [restore(fallback[0], prepared[0].tokens)];
  }
}

function setAtPath(target, dottedPath, value) {
  const parts = dottedPath.split(".");
  let node = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    const nextIsIndex = /^\d+$/.test(parts[index + 1]);
    node[part] ??= nextIsIndex ? [] : {};
    node = node[part];
  }
  node[parts.at(-1)] = value;
}

const allEntries = WEB_COURSES.flatMap((course) => collect(course, [course.id]));
const canonicalByText = new Map();
const canonicalForPath = new Map();
for (const entry of allEntries) {
  const canonical = canonicalByText.get(entry.text) || entry;
  canonicalByText.set(entry.text, canonical);
  canonicalForPath.set(entry.path, canonical.path);
}
const canonicalEntries = [...canonicalByText.values()];
const work = chunks(canonicalEntries);

await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
await fs.mkdir(OUT_DIR, { recursive: true });
console.log(`${allEntries.length} fields / ${canonicalEntries.length} unique / ${work.length} batches per language`);

for (const [code, language] of Object.entries(LANGUAGES)) {
  // Chạy song song nhiều tiến trình: WORKER=tên FROM=0.6 TO=0.75 (phần của danh sách lô).
  // Mỗi tiến trình ghi checkpoint riêng `${code}.<WORKER>.json`; khi đọc thì gộp mọi tệp của ngôn ngữ đó.
  const worker = process.env.WORKER;
  if (worker && !process.env.LANG_ONLY?.split(",").includes(code) && process.env.LANG_ONLY) continue;
  const checkpointPath = path.join(CHECKPOINT_DIR, worker ? `${code}.${worker}.json` : `${code}.json`);
  let done = {};
  for (const file of (await fs.readdir(CHECKPOINT_DIR)).filter((name) => name === `${code}.json` || name.startsWith(`${code}.`))) {
    try { Object.assign(done, JSON.parse(await fs.readFile(path.join(CHECKPOINT_DIR, file), "utf8"))); } catch { /* bỏ qua tệp đang ghi dở */ }
  }
  const from = Math.floor(work.length * Number(process.env.FROM || 0));
  const to = Math.ceil(work.length * Number(process.env.TO || 1));
  for (let index = from; index < to; index += 3) {
    const group = work.slice(index, Math.min(index + 3, to));
    const translated = await Promise.all(group.map(async (batch) => {
      const missing = batch.filter((entry) => done[entry.path] == null);
      return missing.length ? { missing, values: await translateBatch(missing, language) } : null;
    }));
    translated.filter(Boolean).forEach(({ missing, values }) => {
      missing.forEach((entry, itemIndex) => { done[entry.path] = values[itemIndex]; });
    });
    await fs.writeFile(checkpointPath, JSON.stringify(done), "utf8");
    console.log(`[${code}${worker ? `:${worker}` : ""}] ${Math.min(index + 3, to)}/${work.length}`);
  }
  if (worker) continue; // tiến trình phụ không ghi tệp kết quả — lần chạy chính gộp lại
  const output = {};
  for (const entry of allEntries) setAtPath(output, entry.path, done[canonicalForPath.get(entry.path)]);
  await fs.writeFile(path.join(OUT_DIR, `${code}.json`), `${JSON.stringify(output, null, 2)}\n`, "utf8");
}
