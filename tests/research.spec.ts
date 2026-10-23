import { test, expect } from "@playwright/test";

test("Cairo case selection updates the drawing, text and source references, and the URL", async ({ page }) => {
  await page.goto("/research/cairo");
  const tabs = page.getByRole("tablist").first();
  await expect(tabs.getByRole("tab")).toHaveCount(4);
  const zamalek = tabs.getByRole("tab", { name: "Zamalek" });
  await zamalek.click();
  await expect(zamalek).toHaveAttribute("aria-selected", "true");
  await expect(page).toHaveURL(/case=zamalek/);
  const panel = page.getByRole("tabpanel");
  await expect(panel).toContainText("Zamalek");
  await expect(panel).toContainText("Dissertation, p.15");
  // the annotated figure for the case is one of figures 6 or 7
  await expect(panel.locator("img[alt*='Zamalek']").first()).toBeVisible();

  const ashwaiyat = tabs.getByRole("tab", { name: /Ashwa/ });
  await ashwaiyat.click();
  await expect(page).toHaveURL(/case=ashwaiyat/);
  await expect(panel).toContainText("Ashwa’iyat");
  await expect(panel.locator("img[alt*='Ashwa']").first()).toBeVisible();
});

test("theme comparison is qualitative text and switches the red annotation layer", async ({ page }) => {
  await page.goto("/research/cairo?case=west-el-balad&theme=climate-response");
  const climate = page.getByRole("button", { name: "Climate response", exact: true }).first();
  await expect(climate).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Balconies and street shading are the drawn emphasis.")).toBeVisible();
  const overlay = page.locator("svg[data-annotations]").first();
  await expect(overlay).toBeVisible();
  await page.getByRole("button", { name: "Identity", exact: true }).first().click();
  await expect(page).toHaveURL(/theme=identity/);
  // no numeric scores anywhere in the comparison
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\b\d{1,3}\s?(%|\/\s?100)\b/);
});

test("keyboard: arrow keys move between case tabs", async ({ page }) => {
  await page.goto("/research/cairo");
  const tabs = page.getByRole("tablist").first();
  await tabs.getByRole("tab").first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab").nth(1)).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(tabs.getByRole("tab").nth(1)).toHaveAttribute("aria-selected", "true");
});

test("Back and Forward restore the selected case", async ({ page }) => {
  await page.goto("/research/cairo");
  const tabs = page.getByRole("tablist").first();
  await tabs.getByRole("tab", { name: "Zamalek" }).click();
  await expect(page).toHaveURL(/case=zamalek/);
  await page.goto("/about");
  await page.goBack();
  await expect(page).toHaveURL(/case=zamalek/);
  await expect(tabs.getByRole("tab", { name: "Zamalek" })).toHaveAttribute("aria-selected", "true");
});
