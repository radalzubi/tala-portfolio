import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["/", "/work", "/work/maison-peplum", "/work/music-institution", "/work/sound-aroma-loom", "/research/cairo", "/about"];

for (const route of routes) {
  test(`route ${route} loads directly, has one h1, no console errors, no failed requests`, async ({ page }) => {
    const errors: string[] = [];
    const failed: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400 && !r.url().includes("favicon")) failed.push(`${r.status()} ${r.url()}`);
    });
    const res = await page.goto(route);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(errors, errors.join("\n")).toEqual([]);
    expect(failed, failed.join("\n")).toEqual([]);
    // no horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "horizontal overflow").toBeLessThanOrEqual(0);
  });
}

test("homepage identifies Tala and leads to selected work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Tala Hagras" })).toBeVisible();
  await page.getByRole("link", { name: "Selected work" }).click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole("heading", { level: 1, name: "Work" })).toBeVisible();
});

test("404 state is useful", async ({ page }) => {
  const res = await page.goto("/work/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link", { name: /Research: Cairo/ })).toBeVisible();
});

test("no production notes or placeholders leak into public copy", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    const text = await page.locator("body").innerText();
    for (const banned of ["Insert original", "Awaiting source", "should become the principal", "in the final portfolio", "Full dissertation source to be incorporated"]) {
      expect(text, `${route} contains "${banned}"`).not.toContain(banned);
    }
  }
});

test("dissertation title is preserved and the editorial label is distinct", async ({ page }) => {
  await page.goto("/research/cairo");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Homogenisation of Cairo’s Urban Horizons");
  await expect(page.getByText("Beyond the Generic City").first()).toBeVisible();
});

test("research download is the 28-page reading edition, not the appendices", async ({ page, request }) => {
  await page.goto("/research/cairo");
  const href = await page.getByRole("link", { name: /Reading edition/ }).getAttribute("href");
  expect(href).toContain("reading-edition.pdf");
  const res = await request.get(href!);
  expect(res.status()).toBe(200);
  const body = await res.body();
  expect(body.length).toBeGreaterThan(100_000);
  expect(body.subarray(0, 5).toString()).toBe("%PDF-");
});

test("raw source PDFs are not reachable", async ({ request }) => {
  for (const url of ["/sources/raw/Tala_Portfolio_Preview_17_Pages.pdf", "/sources/derived/inventory.json", "/data/source-manifest.json"]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(404);
  }
});

for (const route of routes) {
  test(`axe scan ${route} has no serious or critical violations`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), JSON.stringify(serious, null, 1)).toEqual([]);
  });
}
