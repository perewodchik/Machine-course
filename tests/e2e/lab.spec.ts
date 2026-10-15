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
    // упражнения движка — тоже блоки «exercise», считаем только витрину блоков
    await expect(page.locator(`.block--${kind}:not(.exercise)`)).toHaveCount(1);
  }
  await expect(page.locator('[data-formula="f.normal-equations"] [data-derivation]')).toBeVisible();
  await page.getByRole("button", { name: /θ — вектор весов/ }).first().focus();
  await expect(page.locator('[data-sym="theta"] .sym.is-lit').first()).toBeVisible();
});

test.describe("набор для рисунков", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(layoutPages.lab);
    await page.locator(".kit-demo").scrollIntoViewIfNeeded();
    // остров client:visible гидратирован
    await expect(page.locator("astro-island", { has: page.locator(".kit-demo") })).not.toHaveAttribute("ssr", "");
  });

  test("ползунок и «живое число» управляются с клавиатуры и связаны", async ({ page }) => {
    const demo = page.locator(".kit-demo");
    const slope = demo.getByRole("slider", { name: "θ1" });
    await slope.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slope).toHaveAttribute("aria-valuetext", "θ1 = 0.30");
    const scrub = demo.getByRole("spinbutton", { name: "наклон θ1" });
    await expect(scrub).toHaveAttribute("aria-valuenow", "0.3");
    await scrub.focus();
    await page.keyboard.press("Shift+ArrowUp");
    await expect(scrub).toHaveAttribute("aria-valuenow", "0.8");
    await page.keyboard.press("End");
    await expect(scrub).toHaveAttribute("aria-valuenow", "1.5");
    await expect(slope).toHaveAttribute("aria-valuetext", "θ1 = 1.50");
  });

  test("при крайних значениях прямая обрезана осями, а ушедшая целиком — без подписи", async ({ page }) => {
    const demo = page.locator(".kit-demo");
    const line = demo.locator(".kit-line");
    await expect(line).toHaveAttribute("data-visible", "true");
    await expect(line.locator(".kit-label")).toHaveCount(1);
    // вся отрисовка, кроме осей, — внутри группы с clipPath области графика
    await expect(demo.locator("svg > g[clip-path] .kit-line")).toHaveCount(1);
    await demo.getByRole("slider", { name: "θ0" }).focus();
    await page.keyboard.press("End");
    await demo.getByRole("slider", { name: "θ1" }).focus();
    await page.keyboard.press("End");
    await expect(line).toHaveAttribute("data-visible", "false");
    await expect(line.locator(".kit-label")).toHaveCount(0);
  });

  test("наведение на точку данных подсвечивает X в формулах", async ({ page }, info) => {
    test.skip(info.project.name === "mobile", "наведение — только с мышью");
    await page.locator(".kit-demo .kit-point circle").first().hover();
    await expect(page.locator('[data-sym="X"] .sym.is-lit').first()).toBeVisible();
    await expect(page.locator(".kit-demo .kit-point.is-lit")).toHaveCount(12);
  });
});
