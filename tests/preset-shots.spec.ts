import { test } from "@playwright/test";

/** Direct-URL preset captures with a long settle, for composition review (docs/evidence/screenshots/presets). */
test.describe("preset shots", () => {
  test.skip(({ isMobile }) => !!isMobile);
  test.setTimeout(180_000);
  const targets: [string, string[]][] = [
    ["/work/maison-peplum", ["whole", "facade", "assembly", "section", "plan"]],
    ["/work/music-institution", ["whole", "plan", "section", "route", "assembly"]],
  ];
  for (const [route, presets] of targets) {
    for (const preset of presets) {
      test(`${route} ${preset}`, async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(`${route}#view=${preset}`);
        const viewer = page.getByRole("region", { name: /interactive study/ }).first();
        // wait for hydration (data-status appears once the client has taken over) before scrolling
        await page.waitForFunction(() => !!document.querySelector("[data-status]"), null, { timeout: 25_000 });
        await viewer.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector("[data-status]")?.getAttribute("data-status") === "interactive", null, { timeout: 25_000 });
        await page.waitForTimeout(2600);
        const name = route.split("/").pop();
        await viewer.locator("canvas").screenshot({ path: `docs/evidence/screenshots/presets/${name}-${preset}.png` });
      });
    }
  }
});
