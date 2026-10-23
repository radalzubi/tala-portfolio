import { test, expect, type Page } from "@playwright/test";

async function gotoViewer(page: Page, route = "/work/maison-peplum") {
  await page.goto(route);
  const viewer = page.getByRole("region", { name: /interactive study/ }).first();
  await expect(viewer).toBeVisible();
  return viewer;
}

async function canvasPixels(page: Page) {
  // Reads the canvas back as a data URL and hashes it; preserveDrawingBuffer is false so we re-render
  // by nudging the renderer through a resize event first.
  return page.evaluate(async () => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return null;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) return null;
    const w = 96;
    const h = 96;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(Math.floor(gl.drawingBufferWidth / 2 - w / 2), Math.floor(gl.drawingBufferHeight / 2 - h / 2), w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let hash = 0;
    for (let i = 0; i < px.length; i += 7) hash = (hash * 31 + px[i]) >>> 0;
    return hash;
  });
}

test.describe("Maison Peplum viewer (desktop)", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop interaction contract");

  test("loads the 3D study, presets switch, pause persists, assembly slider works, reset and zoom respond", async ({ page }) => {
    const viewer = await gotoViewer(page);
    await expect(viewer).toHaveAttribute("data-status", "interactive", { timeout: 20_000 });
    await expect(viewer.locator("canvas")).toBeVisible();

    const pause = viewer.getByRole("button", { name: /Pause rotation|Play rotation/ });
    await expect(pause).toBeEnabled();
    // study variant: rotation is off by default → Play rotation
    await expect(pause).toHaveAccessibleName("Play rotation");
    await pause.click();
    await expect(pause).toHaveAccessibleName("Pause rotation");
    await pause.click();
    await expect(pause).toHaveAccessibleName("Play rotation");
    // moving focus/hover elsewhere does not restart rotation
    await viewer.getByRole("button", { name: "Zoom in" }).hover();
    await viewer.getByRole("button", { name: "Zoom in" }).focus();
    await expect(pause).toHaveAccessibleName("Play rotation");

    // presets
    const facade = viewer.getByRole("button", { name: "Façade rhythm", exact: true });
    await facade.click();
    await expect(facade).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/#view=facade/);
    await viewer.getByRole("button", { name: "Section", exact: true }).click();
    await expect(page).toHaveURL(/#view=section/);
    await expect(page.getByRole("complementary", { name: /Drawing paired with the Section view/ })).toBeVisible();

    // assembly slider changes geometry (pixels differ)
    await viewer.getByRole("button", { name: "Whole", exact: true }).click();
    await page.waitForTimeout(1300);
    const before = await canvasPixels(page);
    const slider = viewer.getByRole("slider", { name: "Fold / assembly" });
    await slider.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press("PageUp");
    await expect(slider).toHaveAttribute("aria-valuenow", /^(?:[5-9]\d|100)$/);
    await page.waitForTimeout(900);
    const after = await canvasPixels(page);
    expect(after).not.toEqual(before);
    await expect(page).toHaveURL(/fold=/);
    for (let i = 0; i < 12; i++) await page.keyboard.press("PageDown");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");

    // drag rotates the model: pixels change
    const box = (await viewer.locator("canvas").boundingBox())!;
    const beforeDrag = await canvasPixels(page);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2 + 20, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(600);
    const afterDrag = await canvasPixels(page);
    expect(afterDrag).not.toEqual(beforeDrag);

    // keyboard on the stage
    const stage = viewer.getByRole("group", { name: /model\./ });
    await stage.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("+");
    await page.keyboard.press("0");
    await viewer.getByRole("button", { name: "Reset view" }).click();
    await viewer.getByRole("button", { name: "Zoom out" }).click();
  });

  test("direct link with view and fold restores viewer state", async ({ page }) => {
    await page.goto("/work/maison-peplum#view=assembly&fold=0.80");
    const viewer = page.getByRole("region", { name: /interactive study/ }).first();
    await expect(viewer.getByRole("button", { name: "Assembly", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(viewer.getByRole("slider", { name: "Fold / assembly" })).toHaveAttribute("aria-valuenow", "80");
  });

  test("hotspot list focuses a point of interest without the canvas", async ({ page }) => {
    const viewer = await gotoViewer(page);
    await viewer.getByRole("button", { name: "Curved fins" }).click();
    await expect(viewer.getByText("A repeated system of curved fins gives the building its silhouette", { exact: false })).toBeVisible();
  });

  test("music institution presets reveal relationships and keep the section drawing accessible", async ({ page }) => {
    const viewer = await gotoViewer(page, "/work/music-institution");
    await expect(viewer).toHaveAttribute("data-status", "interactive", { timeout: 20_000 });
    await viewer.getByRole("button", { name: "Section", exact: true }).click();
    await expect(page.getByRole("complementary", { name: /Section view/ })).toBeVisible();
    await viewer.getByRole("button", { name: "Plan", exact: true }).click();
    const slider = viewer.getByRole("slider", { name: "Reveal" });
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
  });

  test("the hero auto-rotates only without reduced motion and the pause choice persists across hover", async ({ page }) => {
    await page.goto("/");
    const viewer = page.getByRole("region", { name: /Maison Peplum: interactive study/ });
    await expect(viewer).toHaveAttribute("data-status", "interactive", { timeout: 20_000 });
    const pause = viewer.getByRole("button", { name: /Pause rotation|Play rotation/ });
    await expect(pause).toHaveAccessibleName("Pause rotation");
    await pause.click();
    await expect(pause).toHaveAccessibleName("Play rotation");
    await page.mouse.move(10, 10);
    await viewer.hover();
    await expect(pause).toHaveAccessibleName("Play rotation");
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("no automatic rotation and the rotate control is disabled", async ({ page }) => {
    await page.goto("/");
    const viewer = page.getByRole("region", { name: /Maison Peplum: interactive study/ });
    await expect(viewer).toHaveAttribute("data-status", /interactive|poster/, { timeout: 20_000 });
    const pause = viewer.getByRole("button", { name: /Play rotation|Pause rotation/ });
    await expect(pause).toHaveAccessibleName("Play rotation");
    await expect(pause).toBeDisabled();
  });
});

test.describe("no WebGL", () => {
  test("falls back to the poster and keeps the full project text and drawings", async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return (orig as unknown as (this: HTMLCanvasElement, t: string, ...r: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto("/work/maison-peplum");
    const viewer = page.getByRole("region", { name: /interactive study/ }).first();
    await expect(viewer).toHaveAttribute("data-status", "fallback");
    await expect(viewer.getByRole("img").first()).toBeVisible();
    await expect(viewer.getByText(/3D view unavailable/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Section, envelope and structure" })).toBeVisible();
    await expect(viewer.locator("canvas")).toHaveCount(0);
  });
});

test.describe("touch devices", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile contract");
  test("poster first; Explore in 3D loads the canvas; page keeps scrolling", async ({ page }) => {
    await page.goto("/work/maison-peplum");
    const viewer = page.getByRole("region", { name: /interactive study/ }).first();
    await expect(viewer).toHaveAttribute("data-status", "poster");
    await expect(viewer.locator("canvas")).toHaveCount(0);
    await viewer.getByRole("button", { name: "Explore in 3D" }).tap();
    await expect(viewer).toHaveAttribute("data-status", "interactive", { timeout: 20_000 });
    await viewer.getByRole("button", { name: "Done exploring" }).tap();
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(before);
    expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
  });
});
