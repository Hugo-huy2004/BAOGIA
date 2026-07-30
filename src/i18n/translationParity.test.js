import { describe, expect, it } from "vitest";
import en from "./locales/en/translation.json";
import vi from "./locales/vi/translation.json";

const flatten = (value, prefix = "", result = {}) => {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, path, result);
    } else {
      result[path] = child;
    }
  }
  return result;
};

const interpolationNames = (value) => [
  ...String(value).matchAll(/\{\{\s*([^},\s]+)[^}]*\}\}/g),
].map((match) => match[1]).sort();

describe("translation parity", () => {
  const vietnamese = flatten(vi);
  const english = flatten(en);

  it("vi và en có cùng tập khóa", () => {
    expect(Object.keys(english).sort()).toEqual(Object.keys(vietnamese).sort());
  });

  it("không có bản dịch rỗng", () => {
    for (const [locale, messages] of Object.entries({ vi: vietnamese, en: english })) {
      for (const [key, value] of Object.entries(messages)) {
        if (typeof value === "string") {
          expect(value.trim(), `${locale}:${key}`).not.toBe("");
        }
      }
    }
  });

  it("hai ngôn ngữ dùng cùng biến nội suy", () => {
    for (const key of Object.keys(vietnamese)) {
      expect(interpolationNames(english[key]), key).toEqual(
        interpolationNames(vietnamese[key]),
      );
    }
  });
});
