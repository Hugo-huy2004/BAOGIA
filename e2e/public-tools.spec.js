import { test, expect } from "@playwright/test";
import { PUBLIC_TOOLS, resolvePublicTool } from "../src/config/publicTools.js";

const MEMBER_SESSION_KEY = "price-doc-member-session";

// Chạy không cần backend: mọi /api/* trả JSON rỗng, trang phải tự đứng vững.
async function stubApi(page) {
  await page.route("**/api/**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "{}" }),
  );
}

const allSlugs = Object.entries(PUBLIC_TOOLS).flatMap(([slug, tool]) => [
  slug,
  ...(tool.aliases ?? []),
]);

for (const slug of allSlugs) {
  const config = resolvePublicTool(slug);
  test(`public tool /${slug} renders as guest`, async ({ page }) => {
    await stubApi(page);
    await page.goto(`/${slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: config.heading }).first(),
    ).toBeVisible();
    // Khách luôn thấy CTA xác thực trên hero.
    await expect(
      page.getByRole("button", { name: /Xác thực hoặc đăng ký bằng Google/ }).first(),
    ).toBeVisible();
  });
}

test("guest → login carries ?redirect back to the tool", async ({ page }) => {
  await stubApi(page);
  await page.goto("/aura");
  await page
    .getByRole("button", { name: /Xác thực hoặc đăng ký bằng Google/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login\?redirect=%2Faura/);
});

test("safe redirect resolves the tool path and rejects external URLs", async ({ page }) => {
  await stubApi(page);
  await page.goto("/login?redirect=%2Faura");
  const resolve = (search) =>
    page.evaluate(
      (s) =>
        import("/src/utils/safeRedirect.js").then((m) =>
          m.getSafeMemberRedirect(s),
        ),
      search,
    );
  expect(await resolve("?redirect=%2Faura")).toBe("/aura");
  expect(await resolve("?redirect=//evil.com")).toBe("/member");
  expect(await resolve("?redirect=https://evil.com")).toBe("/member");
  expect(await resolve("?redirect=%2Flogin")).toBe("/member");
});

test("logged-in member returns to the tool without the auth CTA", async ({ page }) => {
  await stubApi(page);
  await page.addInitScript(
    ([key]) =>
      localStorage.setItem(
        key,
        JSON.stringify({ email: "e2e@example.edu", token: "e2e-token" }),
      ),
    [MEMBER_SESSION_KEY],
  );
  await page.goto("/aura");
  await expect(
    page.getByRole("heading", { level: 1, name: resolvePublicTool("aura").heading }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Xác thực hoặc đăng ký bằng Google/ }),
  ).toHaveCount(0);
});
