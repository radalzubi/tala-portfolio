import { test, expect } from "@playwright/test";

test("a drawing opens in the inspector, zooms, resets, closes and returns focus", async ({ page }) => {
  await page.goto("/work/music-institution");
  const trigger = page.getByRole("button", { name: /^Inspect: Site plan/ }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const readout = dialog.locator("output");
  await expect(readout).toContainText("1.0×");
  await dialog.getByRole("button", { name: "Zoom in" }).click();
  await expect(readout).not.toContainText("1.0×");
  await page.keyboard.press("0");
  await expect(readout).toContainText("1.0×");
  await page.keyboard.press("+");
  await expect(readout).not.toContainText("1.0×");
  await dialog.getByRole("button", { name: "Reset view" }).click();
  await expect(readout).toContainText("1.0×");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
});

test("keyboard-only: Tab reaches the inspect button and the dialog traps focus", async ({ page }) => {
  await page.goto("/research/cairo");
  const trigger = page.getByRole("button", { name: /Inspect/ }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"));
    expect(inside).toBe(true);
  }
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toBeHidden();
});
