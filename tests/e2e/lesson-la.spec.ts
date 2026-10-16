// Модуль I (S3.L1): урок I.1 — оболочка на рисунке переключается между плоскостью и прямой с клавиатуры,
// задача «лежит ли вектор в оболочке» разбирает параллельные векторы, итоговая проверка ставит «знаю».
// Урок I.2 — шары норм и проекция управляются с клавиатуры, задача на норму разбирает ошибку, итоговая проверка. axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

test("урок I.1: оболочка — плоскость или прямая, разбор задачи, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/vectors-span/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Векторы, линейные комбинации, оболочка");

  const fig = page.locator(".span-widget").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await fig.getByRole("button", { name: "Показать оболочку" }).press("Enter");
  await expect(fig.locator(".span-widget__fact")).toContainText("вся плоскость");
  await fig.getByRole("button", { name: "параллельны", exact: true }).press("Enter");
  await expect(fig.locator(".span-widget__fact")).toContainText("прямая: a и b параллельны");

  const inspan = page.locator("[data-exercise][data-item='la.in-span']");
  const task = generator("la.in-span").make(1);
  if (task.kind !== "choice") throw new Error("ожидался выбор");
  await inspan.locator("[data-variant]:not([hidden]) [data-option]").nth(task.options.findIndex((o) => o.text.startsWith("Нет"))).click();
  await expect(inspan.locator("[data-feedback]")).toContainText("Попробуйте подобрать коэффициенты");

  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/span-hit/");
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.lincomb").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок I.2: шары норм и проекция с клавиатуры, разбор нормы, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/dot-product-norms/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Скалярное произведение и нормы");

  const balls = page.locator(".norm-balls").first();
  await balls.scrollIntoViewIfNeeded();
  await expect(balls.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await balls.getByRole("slider", { name: "x1" }).press("End");
  await balls.getByRole("slider", { name: "x2" }).press("Home");
  // x = (1.5, −1.5): ‖x‖₁ = 3, ‖x‖∞ = 1.5 — снаружи всех трёх шаров
  await expect(balls.locator(".kit-readout").nth(0)).toContainText("3.00");
  await expect(balls.locator(".kit-readout").nth(2)).toContainText("1.50снаружи квадрата");

  const proj = page.locator(".projection-widget").first();
  await proj.scrollIntoViewIfNeeded();
  await expect(proj.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await proj.getByRole("slider", { name: "φ" }).press("End");
  // φ = 180°: b = (−2.5, 0), aᵀb = 3 · (−2.5)
  await expect(proj.locator(".kit-readout").first()).toContainText("\u22127.50");

  const norms = page.locator("[data-exercise][data-item='la.norms']");
  await norms.locator("[data-variant]:not([hidden]) input").first().fill("0");
  await norms.getByRole("button", { name: "Проверить" }).click();
  await expect(norms.locator("[data-feedback]")).toContainText("Складываются модули");

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.projection").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});
