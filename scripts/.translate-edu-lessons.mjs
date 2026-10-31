import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { WEB_COURSES } from "../apps/web/src/components/member/hugoCoder/lessons/index.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const CHECKPOINT_DIR = path.join(os.tmpdir(), "hugo-edu-lessons-i18n");
const OUT_DIR = path.join(ROOT, "apps/web/src/components/member/hugoCoder/lessons/locales");
const LANGUAGES = {
  en: "natural English for an introductory web-development course",
  zh: "natural Simplified Chinese for Mainland China for an introductory web-development course",
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

const translatedFields = new Set(["duration", "summary", "title", "body", "alt", "caption", "q", "o", "why", "items", "pairs"]);

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
    else if (key === "slides" || key === "quiz" || key === "image") collect(item, [...parts, key], entries);
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

const PROTECTED = /~~~[\s\S]*?~~~|```[\s\S]*?```|`[^`\n]+`|https?:\/\/[^\s)>]+|\b(?:Nhịp|Hugo Studio|Hugo|JOY|HTML|CSS|JavaScript|PHP|MySQL|SQL|PDO|XAMPP|Apache|phpMyAdmin|HTTP|HTTPS|DNS|DOM|API|JSON|CRUD|OWASP|CSRF|XSS|MVC|Git|Fetch|README)\b|\d+(?:[.,]\d+)*(?:%|\+)?/g;

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
  return tokens.reduce((result, token, index) => result.replaceAll(`__KEEP_${index}__`, token), String(text));
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
    const parsed = JSON.parse(response);
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
    const fallback = JSON.parse(stdout);
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
  const checkpointPath = path.join(CHECKPOINT_DIR, `${code}.json`);
  let done = {};
  try { done = JSON.parse(await fs.readFile(checkpointPath, "utf8")); } catch { /* start */ }
  for (let index = 0; index < work.length; index += 3) {
    const group = work.slice(index, index + 3);
    const translated = await Promise.all(group.map(async (batch) => {
      const missing = batch.filter((entry) => done[entry.path] == null);
      return missing.length ? { missing, values: await translateBatch(missing, language) } : null;
    }));
    translated.filter(Boolean).forEach(({ missing, values }) => {
      missing.forEach((entry, itemIndex) => { done[entry.path] = values[itemIndex]; });
    });
    await fs.writeFile(checkpointPath, JSON.stringify(done), "utf8");
    console.log(`[${code}] ${Math.min(index + 3, work.length)}/${work.length}`);
  }
  const output = {};
  for (const entry of allEntries) setAtPath(output, entry.path, done[canonicalForPath.get(entry.path)]);
  await fs.writeFile(path.join(OUT_DIR, `${code}.json`), `${JSON.stringify(output, null, 2)}\n`, "utf8");
}
