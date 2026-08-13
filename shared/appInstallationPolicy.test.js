import { describe, expect, it } from "vitest";
import { appInstallationPolicy } from "./appInstallationPolicy";

describe("Study with Hugo app migration", () => {
  it("replaces the two legacy learning icons with one required Study app", () => {
    const installed = appInstallationPolicy.normalizeInstalled(["ide", "hugoso", "radio"]);

    expect(installed).toContain("study");
    expect(installed).not.toContain("ide");
    expect(installed).not.toContain("hugoso");
    expect(installed.filter((id) => id === "study")).toHaveLength(1);
  });

  it("keeps Study pinned on the home screen after normalizing old data", () => {
    const home = appInstallationPolicy.normalizeHomeScreen(
      ["ide", "hugoso"],
      ["ide", "hugoso"],
    );

    expect(home).toContain("study");
    expect(home).not.toContain("ide");
    expect(home).not.toContain("hugoso");
  });
});
