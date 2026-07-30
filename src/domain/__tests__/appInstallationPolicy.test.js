import { describe, expect, it } from "vitest";
import { AppInstallationPolicy, appInstallationPolicy } from "../../../shared/appInstallationPolicy";

describe("AppInstallationPolicy", () => {
  const policy = new AppInstallationPolicy(["library", "bio", "ide"]);

  it("restores required apps when a client omits them", () => {
    expect(policy.normalizeInstalled(["arcade"])).toEqual([
      "library",
      "bio",
      "ide",
      "arcade",
    ]);
  });

  it("does not allow required apps to be removed", () => {
    expect(policy.canUninstall("bio")).toBe(false);
    expect(policy.canUninstall("arcade")).toBe(true);
  });

  it("keeps the home screen limited to installed apps", () => {
    expect(policy.normalizeHomeScreen(
      ["arcade", "not-installed"],
      ["arcade"],
    )).toEqual(["library", "bio", "ide", "arcade"]);
  });

  it("preinstalls HugoSO on the PWA home screen for existing members", () => {
    expect(appInstallationPolicy.normalizeInstalled([])).toContain("hugoso");
    expect(appInstallationPolicy.normalizeHomeScreen([], [])).toContain("hugoso");
    expect(appInstallationPolicy.canUninstall("hugoso")).toBe(false);
  });
});
