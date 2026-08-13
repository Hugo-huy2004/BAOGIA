import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// HugoKit không có chuỗi riêng: nó dùng lại đúng các khoá dịch của bốn công cụ
// cũ. Bộ locale lại đang được sinh bằng script (scripts/sync-member-locales-*),
// nên chỉ cần một lần chạy hụt là app mất chữ ở một ngôn ngữ mà không ai biết.
// Bài kiểm tra này bắt đúng việc đó: mọi khoá HugoKit gọi phải có ở cả 9 file.
const LOCALES = ["vi", "en", "zh", "th", "ja", "ko", "id", "es", "fr"];
const HERE = path.dirname(new URL(import.meta.url).pathname);
const LOCALE_DIR = path.resolve(HERE, "../../../i18n/locales");

// Khoá dựng động trong mã (`levels.${id}`) phải liệt kê tay.
const DYNAMIC_KEYS = [
  "utilities.signature.templates.modern",
  "utilities.signature.templates.minimal",
  "utilities.signature.colors.gold",
  "utilities.signature.colors.blue",
  "utilities.signature.colors.violet",
  "utilities.signature.colors.black",
  "utilities.fileTools.compress.levels.light",
  "utilities.fileTools.compress.levels.medium",
  "utilities.fileTools.compress.levels.strong",
];

const collectKeys = () => {
  const keys = new Set(DYNAMIC_KEYS);
  for (const file of fs.readdirSync(HERE).filter((name) => name.endsWith(".jsx"))) {
    const source = fs.readFileSync(path.join(HERE, file), "utf8");
    // `(?<![\w.])` để "createElement(" hay "getContext(" không bị nhận nhầm là t(.
    for (const match of source.matchAll(/(?<![\w.])t\(\s*["']([\w.]+)["']/g)) keys.add(match[1]);
    for (const match of source.matchAll(/(?:titleKey|descKey):\s*["']([\w.]+)["']/g)) keys.add(match[1]);
  }
  return [...keys];
};

const lookup = (dict, key) => key.split(".").reduce((node, part) => (node ? node[part] : undefined), dict);

describe("HugoKit i18n", () => {
  const keys = collectKeys();

  it("tìm thấy khoá dịch trong mã nguồn", () => {
    expect(keys.length).toBeGreaterThan(20);
  });

  it.each(LOCALES)("ngôn ngữ %s có đủ mọi khoá HugoKit", (locale) => {
    const dict = JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, locale, "translation.json"), "utf8"));
    const missing = keys.filter((key) => typeof lookup(dict, key) !== "string");
    expect(missing).toEqual([]);
  });
});
