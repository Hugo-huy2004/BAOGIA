import { describe, expect, it } from "vitest";
import {
  clearPendingPortalThemeSync,
  getPendingPortalThemeSync,
  getPortalThemePreference,
  setPendingPortalThemeSync,
  setPortalThemePreference,
} from "./portalThemePreference.js";

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

describe("portal theme preference", () => {
  it("persists a valid theme separately for each member", () => {
    const storage = memoryStorage();
    expect(setPortalThemePreference("member-a", "ocean", storage)).toBe(true);
    expect(setPortalThemePreference("member-b", "default", storage)).toBe(true);
    expect(getPortalThemePreference("member-a", storage)).toBe("ocean");
    expect(getPortalThemePreference("member-b", storage)).toBe("default");
  });

  it("refuses unknown theme ids", () => {
    const storage = memoryStorage();
    expect(setPortalThemePreference("member-a", "copied-brand-theme", storage)).toBe(false);
    expect(getPortalThemePreference("member-a", storage)).toBe(null);
  });

  it("queues and clears a member-scoped server sync", () => {
    const storage = memoryStorage();
    expect(setPendingPortalThemeSync("member-a", "ocean", storage)).toBe(true);
    expect(getPendingPortalThemeSync("member-a", storage)).toBe("ocean");
    expect(getPendingPortalThemeSync("member-b", storage)).toBe(null);
    expect(clearPendingPortalThemeSync("member-a", storage)).toBe(true);
    expect(getPendingPortalThemeSync("member-a", storage)).toBe(null);
  });
});
