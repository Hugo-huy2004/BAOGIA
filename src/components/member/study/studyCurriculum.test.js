import { describe, expect, it } from "vitest";
import { STUDY_COLLECTIONS, STUDY_COPY } from "./studyCurriculum";

describe("Study with Hugo curriculum contract", () => {
  it("groups 135 lessons into 2 collections and 10 meaningful parts", () => {
    const parts = STUDY_COLLECTIONS.flatMap((collection) => collection.parts);
    const lessonCount = parts.reduce((sum, item) => sum + item.lessonCount, 0);

    expect(STUDY_COLLECTIONS).toHaveLength(2);
    expect(parts).toHaveLength(10);
    expect(lessonCount).toBe(135);
  });

  it("provides complete Vietnamese and English learning information", () => {
    STUDY_COLLECTIONS.forEach((collection) => {
      ["vi", "en"].forEach((locale) => {
        expect(collection.title[locale]).toBeTruthy();
        expect(collection.summary[locale]).toBeTruthy();
        expect(collection.duration[locale]).toBeTruthy();
      });

      collection.parts.forEach((part) => {
        ["vi", "en"].forEach((locale) => {
          expect(part.title[locale]).toBeTruthy();
          expect(part.summary[locale]).toBeTruthy();
          expect(part.knowledge[locale].length).toBeGreaterThanOrEqual(3);
          expect(part.guidance[locale].length).toBeGreaterThanOrEqual(3);
          expect(part.outcomes[locale].length).toBeGreaterThanOrEqual(3);
          expect(part.deliverable[locale]).toBeTruthy();
        });
      });
    });
  });

  it("uses the same product name and original-content mark in both locales", () => {
    expect(STUDY_COPY.vi.appName).toBe("Study with Hugo");
    expect(STUDY_COPY.en.appName).toBe("Study with Hugo");
    expect(STUDY_COPY.vi.original).toBe("Hugo Studio Original");
    expect(STUDY_COPY.en.original).toBe("Hugo Studio Original");
  });
});
