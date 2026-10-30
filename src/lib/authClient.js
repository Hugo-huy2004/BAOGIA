import { createAuthClient } from "better-auth/client";
import { emailOTPClient, adminClient, oneTimeTokenClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { API_BASE } from "../config/apiBase";

/**
 * Hai client Better Auth, khớp hai hệ phiên ở server/auth/betterAuth.js:
 * thành viên ở `${API_BASE}/auth`, quản trị ở `${API_BASE}/admin-auth`.
 *
 * Gọi qua window.fetch (đã được authInterceptor bọc) để Bearer của app native
 * tự đi kèm. Nạp tệp này bằng import động — trang chủ không cần nó.
 */
const api = new URL(API_BASE, window.location.origin);
const base = { baseURL: api.origin, fetchOptions: { credentials: "include", customFetchImpl: (...args) => window.fetch(...args) } };

export const memberAuthClient = createAuthClient({
  ...base,
  basePath: `${api.pathname.replace(/\/$/, "")}/auth`,
  plugins: [passkeyClient(), oneTimeTokenClient()],
});

export const adminAuthClient = createAuthClient({
  ...base,
  basePath: `${api.pathname.replace(/\/$/, "")}/admin-auth`,
  plugins: [emailOTPClient(), adminClient()],
});
