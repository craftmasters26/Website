import { expect, test } from "@playwright/test";

test("BleachDex home renders with a primary Add to Discord call to action", async ({ page }) => {
  await page.goto("/bleachdex");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /add to discord/i }).first()).toBeVisible();
});

test("skip link and landmarks exist", async ({ page }) => {
  await page.goto("/bleachdex");
  await expect(page.locator("main, [role=main], #content").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /skip to main content/i })).toHaveCount(1);
});

test("catalog search narrows results and is reflected in the URL", async ({ page }) => {
  await page.goto("/bleachdex/list");
  const search = page.getByRole("searchbox", { name: /search the list/i });
  await search.fill("ichigo");
  await expect(page).toHaveURL(/q=ichigo/);
  await expect(page.getByText(/nothing matches/i)).toHaveCount(0);
});

test("catalog empty filter shows a recovery action", async ({ page }) => {
  await page.goto("/bleachdex/list?q=zzzzzzzzzz");
  await expect(page.getByRole("button", { name: /clear (filters|search)/i })).toBeVisible();
});

test("signed-out collection page explains how to sign in", async ({ page }) => {
  await page.goto("/bleachdex/owned");
  await expect(page.getByRole("button", { name: /login with discord/i })).toBeVisible();
  await expect(page.getByText(/getting started/i)).toBeVisible();
});

test("premium page states benefits, timing and support", async ({ page }) => {
  await page.goto("/bleachdex/premium");
  await expect(page.getByText(/what happens after you pay/i)).toBeVisible();
  await expect(page.getByText(/refund/i).first()).toBeVisible();
});

test("unknown route shows the intentional 404", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
});

test("legacy routes redirect under /bleachdex", async ({ request }) => {
  for (const [from, to] of [
    ["/list", "/bleachdex/list"],
    ["/premium", "/bleachdex/premium"],
    ["/leaderboard", "/bleachdex/leaderboard"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers().location).toContain(to);
  }
});

test("health, robots and sitemap respond", async ({ request }) => {
  expect((await request.get("/api/health")).status()).toBe(200);
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap:");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/bleachdex/roster/");
});

test("readiness endpoint is hidden without the secret", async ({ request }) => {
  expect((await request.get("/api/ready")).status()).toBe(404);
});

test("admin page looks like a missing page to non-admins", async ({ page }) => {
  await page.goto("/bleachdex/admin");
  await expect(page.getByText("404")).toBeVisible();
  await expect(page.getByRole("button", { name: /broadcast|give|maintenance/i })).toHaveCount(0);
});
