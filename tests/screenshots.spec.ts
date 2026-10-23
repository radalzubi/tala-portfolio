import { test, expect, type Page } from "@playwright/test";

/**
 * Viewport screenshots for visual inspection (docs/evidence/screenshots). Not assertions about
 * pixels; they exist so a reviewer can look at the compositions the brief asks about.
 */
const widths = [360, 390, 768, 1440, 1920];
const routes = ["/", "/work", "/work/maison-peplum", "/work/music-institution", "/work/sound-aroma-loom", "/research/cairo", "/about"];

test.describe("screenshots", () => {
  test.skip(({ isMobile }) => !!isMobile, "run once in the desktop project; widths are set per shot");
  test.setTimeout(240_000);

  async function settle(page: Page) {
    await page.waitForLoadState("networkidle");
    const viewer = page.getByRole("region", { name: /interactive study/ }).first();
    if ((await viewer.count()) > 0) {
      await viewer.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const el = document.querySelector("[data-status]");
        return !el || el.getAttribute("data-status") !== "loading";
      }, null, { timeout: 25_000 }).catch(() => {});
      await page.waitForTimeout(1800);
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  }

  for (const w of widths) {
    test(`capture ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: w < 500 ? 780 : w < 1000 ? 1024 : 900 });
      for (const route of routes) {
        await page.goto(route);
        await settle(page);
        const name = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
        await page.screenshot({ path: `docs/evidence/screenshots/${name}-${w}.png`, fullPage: true });
      }
    });
  }

  test("short landscape viewport", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/work/maison-peplum");
    await settle(page);
    await page.screenshot({ path: "docs/evidence/screenshots/maison-peplum-844x390.png", fullPage: false });
  });

  test("viewer states and inspector", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/work/maison-peplum");
    await settle(page);
    const viewer = page.getByRole("region", { name: /interactive study/ }).first();
    await viewer.scrollIntoViewIfNeeded();
    for (const preset of ["Façade rhythm", "Assembly", "Section", "Plan"]) {
      await viewer.getByRole("button", { name: preset, exact: true }).click();
      await page.waitForTimeout(1600);
      await viewer.screenshot({ path: `docs/evidence/screenshots/viewer-peplum-${preset.toLowerCase().replace(/\s|ç/g, "-")}.png` });
    }
    await page.goto("/work/music-institution");
    await settle(page);
    const mi = page.getByRole("region", { name: /interactive study/ }).first();
    await mi.scrollIntoViewIfNeeded();
    for (const preset of ["Whole", "Plan", "Section", "Route", "Layers"]) {
      await mi.getByRole("button", { name: preset, exact: true }).click();
      await page.waitForTimeout(1600);
      await mi.screenshot({ path: `docs/evidence/screenshots/viewer-music-${preset.toLowerCase()}.png` });
    }
    await page.goto("/research/cairo?case=west-el-balad&theme=climate-response");
    await page.waitForLoadState("networkidle");
    await page.getByRole("tabpanel").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: "docs/evidence/screenshots/atlas-west-el-balad-climate.png", fullPage: false });
    await page.getByRole("button", { name: /Inspect drawing/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "docs/evidence/screenshots/inspector-open.png", fullPage: false });
  });
});
