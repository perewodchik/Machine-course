// Урок I.4 (S2.08): виджет «Деформация сетки» (готовые матрицы, бегунки, режим композиции), итоговая проверка, axe.
import { expect, test, type Locator } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

const url = "/foundations/linear-algebra/matrix-as-map/";

/** Остров client:visible оживает, когда виден: ждём гидратации, иначе клик уйдёт в статичную разметку. */
async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("деформация сетки: готовая матрица меняет det и описание; бегунок — с клавиатуры", async ({ page }) => {
  await page.goto(url);
  const fig = page.locator(".grid-map").first();
  await hydrated(fig);
  await fig.getByRole("button", { name: "Отражение", exact: true }).click();
  await expect(fig.locator(".kit-readout")).toContainText("−1.00");
  await expect(fig.locator("[aria-live]")).toContainText("ориентация меняется: плоскость отражена");
  await fig.getByRole("button", { name: "Вырожденная", exact: true }).click();
  await expect(fig.locator("[aria-live]")).toContainText("det A = 0");
  const a11 = fig.getByRole("slider", { name: "a11" });
  await a11.focus();
  await page.keyboard.press("ArrowRight");
  await expect(a11).toHaveAttribute("aria-valuetext", "a11 = 1.1");
  await expectNoAxeViolations(page);
});

test("композиция: порядок меняет матрицу (SR ≠ RS)", async ({ page }) => {
  await page.goto(url);
  const fig = page.locator(".grid-map").nth(1);
  await hydrated(fig);
  await expect(fig.locator(".grid-map__matrix")).toContainText("(0 −2; 1 0)");
  await fig.getByRole("radio", { name: /сначала S, потом R/ }).check();
  await expect(fig.locator(".grid-map__matrix")).toContainText("(0 −1; 2 0)");
});

test("итоговая проверка: матрица по образам базиса ставит «знаю»", async ({ page }) => {
  await page.goto(url);
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.from-images").make(21);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) await final.locator(`[data-variant]:not([hidden]) input[data-cell="${i},${j}"]`).fill(String(spec.answer[i]![j]));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.getByRole("status")).toContainText("Урок отмечен: «знаю».");
  await expect(page.getByRole("checkbox", { name: "Знаю эту тему" })).toBeChecked();
});

test("без горизонтальной прокрутки", async ({ page }) => {
  await page.goto(url);
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
});
