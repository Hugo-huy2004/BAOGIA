import { describe, expect, it } from "vitest";
import {
  isTodayArticleForLanguage,
  isTodayFeedForLanguage,
  TODAY_NEWS_EDITIONS,
} from "./todayFeedApi";

describe("Today edition guard", () => {
  it("maps every UI language to its news market", () => {
    expect(TODAY_NEWS_EDITIONS).toEqual({
      vi: "VN", en: "US", zh: "CN", th: "TH", ja: "JP",
      ko: "KR", id: "ID", es: "ES", fr: "FR",
    });
  });

  it("rejects a Vietnamese feed under the Thai UI", () => {
    const vietnamese = {
      items: [{ language: "vi", country: "VN" }],
      meta: { language: "vi", country: "VN" },
    };
    expect(isTodayFeedForLanguage(vietnamese, "th-TH")).toBe(false);
  });

  it("accepts only an internally consistent Thai feed", () => {
    const thai = {
      items: [{ language: "th", country: "TH" }],
      meta: { language: "th", country: "TH" },
    };
    expect(isTodayFeedForLanguage(thai, "th-TH")).toBe(true);
    expect(isTodayFeedForLanguage({
      ...thai,
      items: [{ language: "vi", country: "VN" }],
    }, "th")).toBe(false);
  });

  it("rejects an article from another edition", () => {
    expect(isTodayArticleForLanguage({ article: { language: "th", country: "TH" } }, "th")).toBe(true);
    expect(isTodayArticleForLanguage({ article: { language: "vi", country: "VN" } }, "th")).toBe(false);
  });
});
