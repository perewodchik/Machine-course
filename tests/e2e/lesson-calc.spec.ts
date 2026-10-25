// Модуль II (S4.L2): урок II.1 — поле градиентов с клавиатуры (седло, критическая точка, D_u f), разбор частной
// производной, итоговая проверка ставит «знаю». Урок II.2 — вычислительный граф по шагам до ∇θL, разбор порядка
// якобианов, итоговая проверка. Урок II.3 — ссылка на «Тетрис размерностей», «найди ошибку» в выводе нормальных
// уравнений, итоговая проверка. axe.
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
  // вытянутая чаша A = [[2, 0.6], [0.6, 0.5]], x₀ = (1, 0.5): ∇f = Ax₀ = (2.3, 0.85)
  await expect(fig.locator("[aria-live]")).toContainText("∇f = (2.30, 0.85)");
  await fig.getByRole("button", { name: "седло" }).press("Enter");
  // x₀ = (1, 0.5) → (0, 0) шагами 0.1
  for (const [name, steps] of [["x1", 10], ["x2", 5]] as const) {
    const s = fig.getByRole("slider", { name });
    await s.focus();
    for (let k = 0; k < steps; k++) await s.press("ArrowLeft");
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

test("урок II.2: вычислительный граф вперёд и назад, порядок якобианов, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/chain-rule-jacobian/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Многомерное правило цепочки и якобиан");

  const fig = page.locator(".comp-graph").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  const next = fig.getByRole("button", { name: "Шаг вперёд" });
  for (let k = 0; k < 5; k++) await next.press("Enter");
  await expect(fig.locator(".comp-graph__fact")).toContainText("L = r² = 1");
  for (let k = 0; k < 6; k++) await next.press("Enter");
  // θ = (0.5, 1), x = (2, 1), y = 3: ∇θL = 2(θᵀx − y)x = (−4, −2) — то же печатает ячейка Python
  await expect(fig.locator(".comp-graph__fact")).toContainText("∂L/∂θ₂ = ∂L/∂p₂ · x₂ = −2 · 1 = −2");
  await expect(next).toBeDisabled();

  const jo = page.locator("[data-exercise][data-item='calc.jacobian-order']");
  const task = generator("calc.jacobian-order").make(1);
  if (task.kind !== "choice") throw new Error("ожидался выбор");
  await jo.locator("[data-variant]:not([hidden]) [data-option]").nth(task.options.findIndex((o) => o.text.startsWith("$J_h = J_f J_g"))).click();
  await expect(jo.locator("[data-feedback]")).toContainText("сначала действует");

  const final = page.locator("#final-check");
  const spec = generator("calc.backprop").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок II.3: игра, найди ошибку в выводе, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/matrix-calculus/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Матричное дифференцирование");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/dim-tetris/");
  await expect(page.locator("[data-exercise][data-item='ii3.derive-steps']")).toBeVisible();

  const fe = page.locator("[data-exercise][data-item='ii3.find-error']");
  await fe.locator("[data-option]").filter({ hasText: "В строке 2" }).click();
  await expect(fe.locator("[data-feedback]")).toContainText("Эта строка верна");
  await fe.locator("[data-option]").filter({ hasText: "В строке 3" }).click();
  await expect(fe.locator("[data-feedback]")).toContainText("Множители переставлены");

  const final = page.locator("#final-check");
  const spec = generator("calc.matrix-grad").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
