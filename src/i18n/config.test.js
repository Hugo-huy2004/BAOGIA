import { afterAll, beforeAll, describe, expect, it } from "vitest";

const previousWindow = globalThis.window;
const previousDocument = globalThis.document;
const previousNavigator = globalThis.navigator;

const values = new Map([
  // This is the only key written by releases before `hugo-language` existed.
  ["i18nextLng", "th"],
]);

const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
};

beforeAll(() => {
  globalThis.window = {
    localStorage: storage,
    location: { search: "?lng=en", hash: "", pathname: "/member" },
  };
  globalThis.document = {
    cookie: "i18next=en",
    documentElement: {
      lang: "en",
      getAttribute: (name) => name === "lang" ? "en" : null,
    },
  };
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { language: "en-US", languages: ["en-US"] },
  });
});

afterAll(() => {
  globalThis.window = previousWindow;
  globalThis.document = previousDocument;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: previousNavigator,
  });
});

describe("i18n persistence", () => {
  it("restores the app preference before query, cookie, and browser language", async () => {
    const { default: i18n, ensureTranslations, changeAppLanguage } = await import("./config");
    await ensureTranslations("th");

    expect({
      language: i18n.language,
      resolvedLanguage: i18n.resolvedLanguage,
      hasThai: i18n.hasResourceBundle("th", "translation"),
      stored: values.get("hugo-language"),
    }).toEqual({ language: "th", resolvedLanguage: "th", hasThai: true, stored: "th" });
    expect(document.documentElement.lang).toBe("th");

    await changeAppLanguage("zh-CN");
    expect(i18n.resolvedLanguage).toBe("zh");
    expect(values.get("hugo-language")).toBe("zh");
    expect(values.get("i18nextLng")).toBe("zh");
    expect(i18n.t("utilities.ide.confirm")).toBe("确认");
  });
});
