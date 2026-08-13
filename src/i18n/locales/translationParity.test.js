import { describe, expect, it } from "vitest";
import en from "./en/translation.json";
import vi from "./vi/translation.json";
import zh from "./zh/translation.json";
import th from "./th/translation.json";
import ja from "./ja/translation.json";
import ko from "./ko/translation.json";
import id from "./id/translation.json";
import es from "./es/translation.json";
import fr from "./fr/translation.json";

const MEMBER_ROOTS = [
  "aura", "memberPortal", "memberTabs", "utilities", "companion",
  "hugoPsy", "hugoCoderLearning", "arcadeGame", "arcadeIntro",
  "navbar",
];

function flatten(value, path = "", output = {}) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(item, `${path}[${index}]`, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      flatten(item, path ? `${path}.${key}` : key, output);
    });
    return output;
  }

  output[path] = value;
  return output;
}

describe("EN/VI translation parity", () => {
  const flatEn = flatten(en);
  const flatVi = flatten(vi);

  it("keeps the same translation keys and array entries", () => {
    expect(Object.keys(flatEn).sort()).toEqual(Object.keys(flatVi).sort());
  });

  it("does not leave empty translated strings", () => {
    for (const values of [flatEn, flatVi]) {
      const emptyKeys = Object.entries(values)
        .filter(([, value]) => typeof value === "string" && !value.trim())
        .map(([key]) => key);
      expect(emptyKeys).toEqual([]);
    }
  });
});

describe("Member Portal locale parity", () => {
  const memberSource = Object.fromEntries(MEMBER_ROOTS.map((root) => [root, en[root]]));
  const flatSource = flatten(memberSource);
  const locales = { zh, th, ja, ko, id, es, fr };

  it("ships every Member Portal key in every advertised language", () => {
    for (const [code, locale] of Object.entries(locales)) {
      const memberLocale = Object.fromEntries(MEMBER_ROOTS.map((root) => [root, locale[root]]));
      const translatedKeys = new Set(Object.keys(flatten(memberLocale)));
      expect(Object.keys(flatSource).filter((key) => !translatedKeys.has(key)), code).toEqual([]);
    }
  });

  it("ships native navigation and language settings in every advertised language", () => {
    for (const [code, locale] of Object.entries(locales)) {
      for (const value of [
        locale.memberPortal?.greeting,
        locale.memberPortal?.navigation?.account,
        locale.memberPortal?.settings?.account?.language,
        locale.memberPortal?.settings?.account?.chooseLanguage,
      ]) {
        expect(value, code).toBeTruthy();
      }
    }
  });

  it("does not silently reuse the English account label shown in the UI", () => {
    for (const [code, locale] of Object.entries(locales)) {
      expect(locale.memberPortal.navigation.account, code)
        .not.toBe(en.memberPortal.navigation.account);
    }
  });

  it("preserves interpolation placeholders in every locally translated string", () => {
    const placeholders = (value) => [...String(value).matchAll(/{{[^{}]+}}/g)].map((match) => match[0]).sort();
    for (const [code, locale] of Object.entries(locales)) {
      const flatLocale = flatten(Object.fromEntries(MEMBER_ROOTS.map((root) => [root, locale[root]])));
      for (const [key, translated] of Object.entries(flatLocale)) {
        const source = flatSource[key];
        if (typeof source !== "string" || typeof translated !== "string") continue;
        expect(translated.trim(), `${code}:${key}`).toBeTruthy();
        expect(placeholders(translated), `${code}:${key}`).toEqual(placeholders(source));
      }
    }
  });

  it("does not expose internal translation markers", () => {
    for (const [code, locale] of Object.entries(locales)) {
      const values = Object.values(flatten(locale)).filter((value) => typeof value === "string");
      expect(values.filter((value) => value.includes("__HUGO_")), code).toEqual([]);
    }
  });
});
