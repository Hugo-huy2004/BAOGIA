import { describe, expect, it } from "vitest";
import {
  APP_LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  getStoredAppLanguage,
  languageCode,
  languageLabel,
  localeForLanguage,
  persistAppLanguage,
} from "./languages";
import zh from "./locales/zh/translation.json";
import th from "./locales/th/translation.json";
import { MEMBER_TODAY_TRANSLATIONS } from "./locales/memberTodayTranslations";

describe("Member Portal languages", () => {
  it("includes the requested Chinese and Thai packs plus additional languages", () => {
    const codes = SUPPORTED_LANGUAGES.map(({ code }) => code);
    expect(codes).toEqual(["vi", "en", "zh", "th", "ja", "ko", "id", "es", "fr"]);
  });

  it("keeps an explicit app preference across reloads", () => {
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };

    persistAppLanguage("th-TH", storage);

    expect(values.get(APP_LANGUAGE_STORAGE_KEY)).toBe("th");
    expect(values.get("i18nextLng")).toBe("th");
    expect(getStoredAppLanguage(storage)).toBe("th");
  });

  it("migrates the persisted Zustand preference when i18next has no value", () => {
    const values = new Map([["ui-store", JSON.stringify({ state: { language: "zh-CN", theme: "dark" } })]]);
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    };

    expect(getStoredAppLanguage(storage)).toBe("zh");
    persistAppLanguage(getStoredAppLanguage(storage), storage);
    expect(JSON.parse(values.get("ui-store")).state).toEqual({ language: "zh", theme: "dark" });
  });

  it("normalizes regional browser language codes", () => {
    expect(languageCode("zh-CN")).toBe("zh");
    expect(languageCode("th-TH")).toBe("th");
    expect(localeForLanguage("ja")).toBe("ja-JP");
    expect(languageLabel("ko-KR")).toBe("한국어");
  });

  it("falls back unknown languages to English", () => {
    expect(languageCode("xx-YY")).toBe("en");
    expect(localeForLanguage("xx-YY")).toBe("en-US");
  });

  it("ships native Member Portal navigation for Chinese and Thai", () => {
    expect(zh.memberPortal.navigation.account).toBe("账户");
    expect(zh.memberPortal.accountHub.documents.rightsTitle).toBe("权利与访问");
    expect(th.memberPortal.navigation.account).toBe("บัญชี");
    expect(th.memberPortal.accountHub.documents.rightsTitle).toBe("สิทธิและการเข้าถึง");
  });

  it("ships a complete native Today reader for every additional language", () => {
    const required = [
      "topStories", "localEdition", "updatedAt", "loading", "unavailable",
      "summaryTitle", "contentTitle", "contentBySource", "readOriginal",
      "searchPlaceholder", "filters", "noResults", "fullAccess", "summaryAccess",
      "rightsMode",
    ];
    for (const code of ["zh", "th", "ja", "ko", "id", "es", "fr"]) {
      const copy = MEMBER_TODAY_TRANSLATIONS[code];
      required.forEach((key) => expect(copy[key], `${code}.${key}`).toBeTruthy());
      expect(Object.keys(copy.category)).toEqual([
        "all", "academic", "technology", "community", "world", "catholic",
      ]);
    }
  });
});
