// Витрина /lab (S1.10): все группы токенов с контрастом, символы, блоки, формула. axe — в layout.spec.ts.
import { expect, test } from "@playwright/test";
import { layoutPages } from "./support";

test("витрина показывает токены обеих тем с контрастом", async ({ page }) => {
  await page.goto(layoutPages.lab);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Дизайн-система «Тетрадь в клетку»");
  const ink = page.locator(".swatch", { hasText: "--ink-2" });
  await expect(ink).toContainText("#48505e");
  await expect(ink).toContainText("#c5c4bd");
  await expect(ink).toContainText("8.0:1");
  await expect(page.locator(".swatch", { hasText: "--grid" })).toContainText("фон или линия");
  await expect(page.locator(".swatch")).toHaveCount(22);
});

test("символы, блоки всех видов, формула с выводом", async ({ page }) => {
  await page.goto(layoutPages.lab);
  await expect(page.locator(".sym-card")).toHaveCount(4);
  for (const kind of ["definition", "theorem", "intuition", "pitfall", "exercise", "derivation"]) {
    await expect(page.locator(`.block--${kind}`)).toHaveCount(1);
  }
  await expect(page.locator('[data-formula="f.normal-equations"] [data-derivation]')).toBeVisible();
  await page.getByRole("button", { name: /θ — вектор весов/ }).first().focus();
  await expect(page.locator('[data-sym="theta"] .sym.is-lit').first()).toBeVisible();
});
