import { afterEach, describe, expect, it, vi } from "vitest";
import { rentPortalTheme, setPortalTheme } from "./portalThemeApi.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("portal theme API", () => {
  it("returns a network fallback result instead of rejecting", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(setPortalTheme("ocean")).resolves.toMatchObject({
      ok: false,
      status: 0,
      networkUnavailable: true,
    });
  });

  it("uses the authenticated theme rental endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      balance: 100,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(rentPortalTheme("pride", "month")).resolves.toMatchObject({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("/api/joy/rent-theme", expect.objectContaining({
      method: "POST",
      credentials: "include",
      hugoNetworkFallback: true,
    }));
  });
});
