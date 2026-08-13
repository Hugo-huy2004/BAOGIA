import { describe, expect, it } from "vitest";
import {
  AURA_THEMES,
  getAuraTheme,
  isAuraThemeFree,
  isAuraThemeId,
  resolveActivePortalTheme,
} from "./auraThemes.js";

describe("shared Member Portal theme contract", () => {
  it("keeps the default theme plain and free", () => {
    expect(getAuraTheme("default")).toMatchObject({
      id: "default",
      pattern: "plain",
      free: true,
      price: 0,
    });
  });

  it("recognizes exactly the themes exposed by the gallery", () => {
    for (const theme of AURA_THEMES) {
      expect(isAuraThemeId(theme.id)).toBe(true);
      expect(isAuraThemeFree(theme.id)).toBe(Boolean(theme.free));
    }
    expect(isAuraThemeId("unknown-theme")).toBe(false);
    expect(isAuraThemeFree("unknown-theme")).toBe(false);
  });

  it("restores a valid legacy theme during the field migration", () => {
    expect(resolveActivePortalTheme({
      activePortalTheme: "default",
      activeAuraTheme: "ocean",
    })).toBe("ocean");
    expect(resolveActivePortalTheme({ activePortalTheme: "ios27" })).toBe("ios27");
    expect(resolveActivePortalTheme({ activeAuraTheme: "invalid" })).toBe("default");
  });
});
