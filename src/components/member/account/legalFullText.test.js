import { describe, expect, it } from "vitest";
import { LEGAL_FULL_TEXT, LEGAL_LANGUAGES } from "./legalFullText";

// The nine language blocks are rendered one after another in a single document,
// so a missing article is visible as a hole in the middle of the page. These
// checks fail the moment one language drifts from the Vietnamese original.
describe("Full-text terms", () => {
  const original = LEGAL_FULL_TEXT.vi;

  it("ships every advertised language", () => {
    expect(LEGAL_LANGUAGES.map(({ code }) => code).filter((code) => !LEGAL_FULL_TEXT[code])).toEqual([]);
  });

  it("keeps the same articles and clause counts in every language", () => {
    const shape = (doc) => doc.sections.map((section) => [section.id, section.items.length]);
    for (const { code } of LEGAL_LANGUAGES) {
      expect(shape(LEGAL_FULL_TEXT[code]), code).toEqual(shape(original));
    }
  });

  it("leaves no empty title or clause", () => {
    for (const { code } of LEGAL_LANGUAGES) {
      const doc = LEGAL_FULL_TEXT[code];
      const blank = [doc.title, doc.intro, ...doc.sections.flatMap((s) => [s.title, ...s.items])]
        .filter((text) => typeof text !== "string" || !text.trim());
      expect(blank, code).toEqual([]);
    }
  });

  it("carries the contact address into every language", () => {
    for (const { code } of LEGAL_LANGUAGES) {
      const text = JSON.stringify(LEGAL_FULL_TEXT[code]);
      expect(text.includes("contact@hugowishpax.studio"), code).toBe(true);
    }
  });
});
