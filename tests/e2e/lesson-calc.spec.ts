// Модуль II (S4.L2): урок II.1 — поле градиентов с клавиатуры (седло, критическая точка, D_u f), разбор частной
// производной, итоговая проверка ставит «знаю». axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

test.describe.configure({ timeout: 90_000 });

test("урок II.1: поле градиентов, частная производная, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/gradient/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Частные производные и градиент");

  const fig = page.locator(".gradient-field").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // вытянутая чаша A = [[2, 0.6], [0.6, 0.5]], x₀ = (1, 1): ∇f = (2.6, 1.1)
  await expect(fig.locator("[aria-live]")).toContainText("∇f = (2.60, 1.10)");
  await fig.getByRole("button", { name: "седло" }).press("Enter");
  for (const name of ["x_1", "x_2"]) {
    const s = fig.getByRole("slider", { name });
    await s.focus();
    for (let k = 0; k < 10; k++) await s.press("ArrowLeft");
  }
  await expect(fig.locator(".gradient-field__fact")).toContainText("Критическая точка");

  const pa = page.locator("[data-exercise][data-item='calc.partial']");
  const task = generator("calc.partial").make(1);
  if (task.kind !== "numeric") throw new Error("ожидалось число");
  await pa.locator("[data-variant]:not([hidden]) input").first().fill(String(task.answer + 1));
  await pa.getByRole("button", { name: "Проверить" }).click();
  await expect(pa.locator("[data-feedback]")).toContainText("константа");

  const final = page.locator("#final-check");
  const spec = generator("calc.gradient-point").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
