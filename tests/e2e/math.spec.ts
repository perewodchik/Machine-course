// Формулы и подсветка символов (S1.07): роли из frontmatter, подсветка мышью и с легенды клавиатурой.
import { expect, test } from "@playwright/test";
import { layoutPages } from "./support";

const page_ = layoutPages.math;

test("символы в формулах окрашены по ролям", async ({ page }) => {
  await page.goto(page_);
  await expect(page.locator('[data-sym="X"] .sym.s1').first()).toBeVisible();
  await expect(page.locator('[data-sym="theta"] .sym.s2').first()).toBeVisible();
  await expect(page.locator('[data-sym="y"] .sym.s3').first()).toBeVisible();
  await expect(page.locator('[data-sym="eps"] .sym.s4').first()).toBeVisible();
  await expect(page.locator(".changed")).toHaveCount(1);
});

test("наведение мышью подсвечивает все вхождения символа", async ({ page }, info) => {
  test.skip(info.project.name === "mobile", "наведение — только с мышью");
  await page.goto(page_);
  const theta = page.locator('[data-sym="theta"] .sym');
  const count = await theta.count();
  expect(count).toBeGreaterThan(3);
  await theta.first().hover();
  await expect(page.locator('[data-sym="theta"] .sym.is-lit')).toHaveCount(count);
  await expect(page.locator('[data-sym="X"] .sym.is-lit')).toHaveCount(0);
  await expect(page.locator('[data-sym-key="theta"]')).toHaveClass(/is-lit/);
  await page.mouse.move(5, 5);
  await expect(page.locator(".is-lit")).toHaveCount(0);
});

test("фокус на кнопке легенды подсвечивает символ, Escape снимает", async ({ page }) => {
  await page.goto(page_);
  const key = page.getByRole("button", { name: /вектор ответов/ });
  await key.focus();
  await expect(key).toBeFocused();
  const y = page.locator('[data-sym="y"] .sym');
  await expect(page.locator('[data-sym="y"] .sym.is-lit')).toHaveCount(await y.count());
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-sym="y"] .sym.is-lit')).toHaveCount(0);
  await expect(page.locator('[data-sym="eps"] .sym.is-lit').first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".is-lit")).toHaveCount(0);
});

// axe и отсутствие горизонтальной прокрутки на этой странице — в layout.spec.ts (layoutPages.math)
