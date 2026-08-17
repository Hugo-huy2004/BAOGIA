import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Tên thương hiệu KHÔNG được dịch, phiên âm hay bỏ đi.
//
// Bản dịch máy nội bộ (qwen2.5:3b trong scripts/sync-member-locales-local.mjs)
// đã từng bẻ "Hugo" thành "ฮูเก็ต" (đọc như Phuket), "ホグースタイル" (Hogu-style),
// "ฮูจู"; và "Hugo Studio" thành "ホグースタイル限定". Người đọc không thể nhận ra
// đó là tên sản phẩm nữa. Test này chặn mọi lần tái diễn, kể cả khi ai đó chạy
// lại script mà quên đăng ký chuỗi vào scripts/locale-overrides.json.
const BRAND = ["Hugo", "JOY"];

const LOCALES_DIR = path.resolve("src/i18n/locales");
const TARGETS = ["es", "fr", "id", "ja", "ko", "th", "zh"];

const read = (code) => JSON.parse(
  fs.readFileSync(path.join(LOCALES_DIR, code, "translation.json"), "utf8"),
);

function flatten(value, parts = [], output = []) {
  if (typeof value === "string") output.push([parts.join("."), value]);
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) flatten(item, [...parts, key], output);
  }
  return output;
}

describe("Tên thương hiệu trong bản dịch", () => {
  const source = new Map(flatten(read("en")));

  for (const token of BRAND) {
    it(`giữ nguyên "${token}" ở mọi ngôn ngữ`, () => {
      const broken = [];
      for (const code of TARGETS) {
        for (const [key, text] of flatten(read(code))) {
          const original = source.get(key);
          if (typeof original !== "string") continue;
          // Nguồn có bao nhiêu lần thì bản dịch phải có ít nhất một lần.
          if (original.includes(token) && !text.includes(token)) {
            broken.push(`${code}:${key} = ${JSON.stringify(text)} (nguồn: ${JSON.stringify(original)})`);
          }
        }
      }
      expect(broken).toEqual([]);
    });
  }

  it("không phiên âm Hugo sang chữ Thái/Nhật/Hàn", () => {
    // Các dạng phiên âm đã gặp thật. Chúng chỉ xuất hiện khi model tự "dịch"
    // tên riêng, nên coi là lỗi bất kể khoá nào.
    const TRANSLITERATIONS = ["ฮูเก็ต", "ฮูจู", "ホグー", "휴고", "雨果"];
    const found = [];
    for (const code of TARGETS) {
      for (const [key, text] of flatten(read(code))) {
        for (const bad of TRANSLITERATIONS) {
          if (text.includes(bad)) found.push(`${code}:${key} chứa "${bad}" → ${JSON.stringify(text)}`);
        }
      }
    }
    expect(found).toEqual([]);
  });
});
