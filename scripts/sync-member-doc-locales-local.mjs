import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { MEMBER_DOCS_EN } from "../src/components/member/account/memberDocs.en.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCALES_DIR = path.join(ROOT, "src/i18n/locales");
const MODEL = process.env.HUGO_TRANSLATION_MODEL || "qwen2.5:3b";
const CHECKPOINT_DIR = path.join(os.tmpdir(), `hugo-member-doc-i18n-${MODEL.replace(/[^a-z0-9.-]/gi, "-")}`);
const OLLAMA_URL = process.env.HUGO_OLLAMA_URL || "http://127.0.0.1:11434";
const TARGETS = {
  zh: "Simplified Chinese for Mainland China",
  th: "Thai",
  ja: "Japanese",
  ko: "Korean",
  id: "Indonesian",
  es: "Spanish for Spain",
  fr: "French for France",
};
const STRUCTURAL_KEYS = new Set(["id", "type", "tone"]);
const MAX_CHUNK_CHARS = 2_500;
const MAX_CHUNK_ENTRIES = 10;

const sourceDocuments = Object.fromEntries(
  Object.entries(MEMBER_DOCS_EN).map(([id, document]) => [id, {
    id: document.id,
    title: document.title,
    intro: document.intro,
    sections: document.sections(),
  }]),
);

function flatten(value, parts = [], output = []) {
  if (typeof value === "string") {
    if (!STRUCTURAL_KEYS.has(parts.at(-1))) output.push({ id: parts.join("."), text: value });
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, [...parts, String(index)], output));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => flatten(item, [...parts, key], output));
  }
  return output;
}

function setAtPath(target, dottedPath, value) {
  const parts = dottedPath.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) cursor = cursor[parts[index]];
  cursor[parts.at(-1)] = value;
}

function chunkEntries(entries) {
  const chunks = [];
  let current = [];
  let size = 0;
  for (const entry of entries) {
    const nextSize = JSON.stringify(entry).length;
    if (current.length && (size + nextSize > MAX_CHUNK_CHARS || current.length >= MAX_CHUNK_ENTRIES)) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(entry);
    size += nextSize;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

// Tên thương hiệu và con số phải được CHE, không phải nhờ vả trong prompt.
// Bản chỉ-nhờ-vả đã cho ra "ฮูจู" (Hugo đọc kiểu Thái) ngay trong văn bản chính
// sách quyền lợi — thứ mà người đọc không còn nhận ra là tên sản phẩm. Che thì
// model không có cơ hội đụng vào, và `hasSameTokens` bên dưới loại thẳng bản
// dịch nào làm rơi mất một token.
// Cụm hai chữ phải đứng trước: che mỗi "Hugo" thì model dịch nốt chữ "Studio"
// còn lại và cho ra "ホジスタ dio".
const PROTECTED = () => /Hugo\s+(?:Studio|Arcade|Team|Profile|Radio|Store)|Hugo[A-Za-z]*|JOY|Star-\w+|{{[^{}]+}}|[\w.+-]+@[\w.-]+\.\w+|\d[\d.,]*/g;
const tokens = (text) => [...String(text).matchAll(PROTECTED())].map((match) => match[0]).sort();
const hasSameTokens = (source, target) => JSON.stringify(tokens(source)) === JSON.stringify(tokens(target));

function maskProtectedTokens(text) {
  const protectedTokens = [];
  const masked = String(text).replace(PROTECTED(), (token) => {
    const marker = `__HUGO_${protectedTokens.length}__`;
    protectedTokens.push(token);
    return marker;
  });
  return { masked, protectedTokens };
}

const restoreProtectedTokens = (text, protectedTokens) => protectedTokens.reduce(
  (result, token, index) => result.replaceAll(`__HUGO_${index}__`, token),
  String(text),
);

async function askOllama(entries, language, attempt = 1) {
  const prepared = entries.map(({ text }) => maskProtectedTokens(text));
  const prompt = [
    `Translate these Hugo Studio Member Portal legal and policy texts from English to ${language}.`,
    `Return ONLY a JSON array of exactly ${entries.length} translated strings in the same order.`,
    "Preserve Hugo Studio, Hugo Arcade, Bio, JOY, Star-14, Star-18, Star-VIP, tier names, email addresses, numbers and legal meaning.",
    "Use clear natural policy language. Do not shorten, summarize, explain or add content.",
    "Copy every protected marker such as __HUGO_0__ exactly as it appears.",
    JSON.stringify(prepared.map(({ masked }) => masked)),
  ].join("\n");
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(90_000),
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        format: {
          type: "array",
          minItems: entries.length,
          maxItems: entries.length,
          items: { type: "string" },
        },
        options: { temperature: 0, num_ctx: 4_096, num_predict: 1_500 },
      }),
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const payload = await response.json();
    const parsed = JSON.parse(payload.response);
    const collectStrings = (value, output = []) => {
      if (typeof value === "string") output.push(value);
      else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
      else if (value && typeof value === "object") {
        Object.values(value).forEach((item) => collectStrings(item, output));
      }
      return output;
    };
    const translated = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.translations)
        ? parsed.translations
        : entries.length === 1 && typeof parsed?.translation === "string"
          ? [parsed.translation]
          : collectStrings(parsed);
    if (!Array.isArray(translated) || translated.length !== entries.length) {
      throw new Error(`expected ${entries.length}, received ${translated?.length}`);
    }
    if (translated.some((value) => typeof value !== "string" || !value.trim())) {
      throw new Error("empty translation");
    }
    const restored = translated.map((value, index) => restoreProtectedTokens(value, prepared[index].protectedTokens));
    const broken = restored.findIndex((value, index) => !hasSameTokens(entries[index].text, value));
    if (broken >= 0) throw new Error(`lost a protected token: ${entries[broken].id}`);
    return restored;
  } catch (error) {
    if (attempt < 2) return askOllama(entries, language, attempt + 1);
    if (entries.length > 1) {
      const middle = Math.ceil(entries.length / 2);
      return [
        ...await askOllama(entries.slice(0, middle), language),
        ...await askOllama(entries.slice(middle), language),
      ];
    }
    throw error;
  }
}

async function main() {
  const requested = process.argv.slice(2);
  const languages = requested.length ? requested : Object.keys(TARGETS);
  const entries = flatten(sourceDocuments);
  await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
  console.log(`${entries.length} strings, model ${MODEL}`);

  for (const code of languages) {
    if (!TARGETS[code]) throw new Error(`Unsupported language: ${code}`);
    const checkpointPath = path.join(CHECKPOINT_DIR, `${code}.json`);
    let translatedById = {};
    try { translatedById = JSON.parse(await fs.readFile(checkpointPath, "utf8")); } catch { /* start clean */ }

    const chunks = chunkEntries(entries.filter(({ id }) => !translatedById[id]));
    for (let index = 0; index < chunks.length; index += 1) {
      const missing = chunks[index];
      const translated = await askOllama(missing, TARGETS[code]);
      missing.forEach(({ id }, itemIndex) => { translatedById[id] = translated[itemIndex]; });
      await fs.writeFile(checkpointPath, JSON.stringify(translatedById), "utf8");
      console.log(`[${code}] ${index + 1}/${chunks.length} remaining chunks`);
    }

    const localizedDocuments = structuredClone(sourceDocuments);
    entries.forEach(({ id }) => setAtPath(localizedDocuments, id, translatedById[id]));
    const localePath = path.join(LOCALES_DIR, code, "translation.json");
    const locale = JSON.parse(await fs.readFile(localePath, "utf8"));
    locale.memberPortal.accountHub.documents.content = localizedDocuments;
    await fs.writeFile(localePath, `${JSON.stringify(locale, null, 2)}\n`, "utf8");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
