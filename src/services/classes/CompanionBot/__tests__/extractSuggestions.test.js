import { describe, it, expect } from "vitest";
import { extractSuggestions } from "../AIBot";

// Regression check for the [[SUGGEST:...]] marker parser: "mmpi" used to be
// misrouted to suggestBigFive instead of the real mmpi30 screener.
describe("extractSuggestions", () => {
  it("maps each test code to its own flag", () => {
    const { flags } = extractSuggestions("Cậu thử nha [[SUGGEST:phq9,gad7,who5,bigfive,dass42,mmpi30]]");
    expect(flags.suggestPhq9).toBe(true);
    expect(flags.suggestGad7).toBe(true);
    expect(flags.suggestWho5).toBe(true);
    expect(flags.suggestBigFive).toBe(true);
    expect(flags.suggestDass42).toBe(true);
    expect(flags.suggestMmpi30).toBe(true);
  });

  it("routes 'mmpi' to the real mmpi30 screener, not Big Five", () => {
    const { flags } = extractSuggestions("Thử bài này nha [[SUGGEST:mmpi]]");
    expect(flags.suggestMmpi30).toBe(true);
    expect(flags.suggestBigFive).toBe(false);
  });

  it("strips the marker out of the visible reply text", () => {
    const { cleanText } = extractSuggestions("Làm test nha [[SUGGEST:phq9]]");
    expect(cleanText).toBe("Làm test nha");
  });
});
