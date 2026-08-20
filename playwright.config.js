import { defineConfig } from "@playwright/test";

/**
 * E2E cho các trang public tool. Chỉ cần Vite (port 3000) — mọi /api/* được
 * spec stub lại nên không đụng tới backend hay MongoDB.
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev:frontend",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 90_000,
  },
});
