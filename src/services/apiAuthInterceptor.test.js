import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./authSession", () => ({
  getMemberToken: vi.fn(() => "member-token"),
  getAdminToken: vi.fn(() => null),
  clearMemberSession: vi.fn(),
}));

vi.mock("../utils/clientMonitoring", () => ({
  recordApiOutcome: vi.fn(),
  reportClientEvent: vi.fn(),
  SLOW_API_MS: 10_000,
}));

import {
  installApiAuthInterceptor,
  isApiRequest,
  isAuthExemptRequest,
} from "./apiAuthInterceptor";

describe("apiAuthInterceptor URL matching", () => {
  it("nhận cả API tương đối và API tuyệt đối cùng origin", () => {
    expect(isApiRequest("/api/joy/claim-info-read-bonus")).toBe(true);
    expect(isApiRequest(
      `${window.location.origin}/api/joy/claim-info-read-bonus`,
    )).toBe(true);
  });

  it("không gửi token tới origin ngoài dù URL có /api/", () => {
    expect(isApiRequest("https://example.com/api/joy/balance")).toBe(false);
    expect(isApiRequest("https://example.com/path?next=/api/joy/balance")).toBe(false);
  });

  it("không nhầm đường dẫn gần giống /api", () => {
    expect(isApiRequest("/apiary/joy/balance")).toBe(false);
  });

  it("chỉ miễn xử lý 401 cho đúng route đăng nhập công khai", () => {
    expect(isAuthExemptRequest("/api/auth/member/google")).toBe(true);
    expect(isAuthExemptRequest(
      `${window.location.origin}/api/webauthn/login-verify`,
    )).toBe(true);
    expect(isAuthExemptRequest("/api/joy/verify-pin")).toBe(false);
    expect(isAuthExemptRequest("/api/auth/member/google-fake")).toBe(false);
  });
});

describe("apiAuthInterceptor authentication", () => {
  let originalFetch;
  let fetchMock;

  beforeEach(() => {
    originalFetch = window.fetch;
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    window.fetch = fetchMock;
    installApiAuthInterceptor();
  });

  afterEach(() => {
    window.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("gắn Bearer token cho URL API tuyệt đối cùng origin", async () => {
    await window.fetch(`${window.location.origin}/api/joy/claim-info-read-bonus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe("include");
    expect(init.headers.Authorization).toBe("Bearer member-token");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("không gắn token cho URL ngoài hệ thống", async () => {
    await window.fetch("https://example.com/api/joy/balance");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/joy/balance",
      {},
    );
  });
});
