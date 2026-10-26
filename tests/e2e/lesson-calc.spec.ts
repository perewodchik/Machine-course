// Модуль II (S4.L2): урок II.1 — поле градиентов с клавиатуры (седло, критическая точка, D_u f), разбор частной
// производной, итоговая проверка ставит «знаю». Урок II.2 — вычислительный граф по шагам до ∇θL, разбор порядка
// якобианов, итоговая проверка. Урок II.3 — ссылка на «Тетрис размерностей», «найди ошибку» в выводе нормальных
// уравнений, итоговая проверка. Урок II.4 — предсказание, ссылка на игру «Минимум, максимум или седло», разбор
// типа критической точки, итоговая проверка. Урок II.5 — хорда x³ под графиком, разбор «зависит от точки», итоговая
// проверка. axe.
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

test("урок II.4: предсказание, игра, тип критической точки, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/hessian-taylor/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Гессиан, ряд Тейлора, критические точки");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/min-max-saddle/");

  const pr = page.locator("[data-exercise][data-item='ii4.predict-critical']");
  await pr.locator("[data-option]").filter({ hasText: "ниже не спуститься" }).click();
  await expect(pr.locator("[data-feedback]")).toContainText("в первом приближении");

  const cl = page.locator("[data-exercise][data-item='calc.classify']").first();
  const task = generator("calc.classify").make(2);
  if (task.kind !== "choice") throw new Error("ожидался выбор");
  await cl.locator("[data-variant]:not([hidden]) [data-option]").nth(task.options.findIndex((o) => !o.correct)).click();
  await expect(cl.locator("[data-feedback]")).toContainText("собственн");

  const final = page.locator("#final-check");
  const spec = generator("calc.classify").make(31);
  if (spec.kind !== "choice") throw new Error("ожидался выбор");
  await final.locator("[data-variant]:not([hidden]) [data-option]").nth(spec.options.findIndex((o) => o.correct)).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок II.5: хорда x³ под графиком, выпуклость квадратичной функции, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/convexity/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Выпуклость");

  const fig = page.locator(".chord").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(fig.locator(".chord__fact")).toHaveText("Хорда целиком не ниже графика.");
  // x³, хорда от −1.5 до 0.5, t = 0.5: хорда −1.625, график −0.125, зазор −1.5
  await fig.getByRole("button", { name: "x³" }).press("Enter");
  await expect(fig.locator(".chord__fact")).toContainText("функция не выпукла");
  await expect(fig.locator("[aria-live]")).toContainText("хорда −1.63, график −0.13");

  const cf = page.locator("[data-exercise][data-item='calc.convex-form']");
  const task = generator("calc.convex-form").make(1);
  if (task.kind !== "choice") throw new Error("ожидался выбор");
  await cf.locator("[data-variant]:not([hidden]) [data-option]").nth(2).click();
  await expect(cf.locator("[data-feedback]")).toContainText("гессиан один и тот же");

  const final = page.locator("#final-check");
  const spec = generator("calc.convex-ops").make(31);
  if (spec.kind !== "choice") throw new Error("ожидался выбор");
  await final.locator("[data-variant]:not([hidden]) [data-option]").nth(spec.options.findIndex((o) => o.correct)).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок II.6: ссылки на игры и лабораторную, знак шага подъёма, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/gradient-descent/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Градиентный спуск и SGD");
  const games = page.getByRole("link", { name: "Открыть игру" });
  await expect(games.nth(0)).toHaveAttribute("href", "/games/divergence/");
  await expect(games.nth(1)).toHaveAttribute("href", "/games/foggy-descent/");

  // ответ с перепутанным знаком шага (спуск вместо подъёма и наоборот) получает разбор про знак
  const gd = page.locator("[data-exercise][data-item='calc.gd-step']");
  const v = gd.locator("[data-variant]:not([hidden])");
  const seed = Number(await v.getAttribute("data-seed"));
  const task = generator("calc.gd-step").make(seed);
  if (task.kind !== "matrix") throw new Error("ожидалась матрица");
  const [x, y] = /\\theta = \((-?\d+), (-?\d+)\)/.exec(task.prompt)!.slice(1).map(Number) as [number, number];
  const flipped = [2 * x - task.answer[0]![0]!, 2 * y - task.answer[1]![0]!];
  for (const [i, val] of flipped.entries()) await v.locator(`[data-cell="${i},0"]`).fill(String(val));
  await gd.getByRole("button", { name: "Проверить" }).click();
  await expect(gd.locator("[data-feedback]")).toContainText(seed % 2 === 0 ? "по градиенту" : "против градиента");

  const final = page.locator("#final-check");
  const spec = generator("calc.lr-threshold").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок II.7: касательные Ньютона на логистической потере, расходимость из далёкой точки, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/newton/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Метод Ньютона");

  const fig = page.locator(".newton").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  const step = fig.getByRole("button", { name: "Шаг Ньютона" });
  for (let k = 0; k < 5; k++) await step.press("Enter");
  // логистическая потеря из θ₀ = 0: пять шагов — минимум θ* ≈ 0.7274, как в model.test.ts
  await expect(fig.locator(".newton__fact")).toContainText("Минимум найден: θ* = 0.727");
  await expect(fig.locator(".newton__table tbody tr")).toHaveCount(6);
  await fig.getByRole("button", { name: "Сначала" }).press("Enter");
  const s = fig.getByRole("slider", { name: "θ₀" });
  await s.fill("3");
  await step.press("Enter");
  await expect(fig.locator(".newton__fact")).toContainText("ушла за пределы рисунка");

  const final = page.locator("#final-check");
  const spec = generator("calc.newton-logistic").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок II.8: касание на окружности — собственный вектор, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/calculus/lagrange/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Множители Лагранжа");

  const fig = page.locator(".lagrange").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(fig.locator(".lagrange__fact")).toContainText("пересекает ограничение");
  // Σ = (2 0.8; 0.8 1): главный собственный вектор под углом ≈ 29.0°, λ₁ = 1.5 + √0.89 ≈ 2.44
  await fig.getByRole("slider", { name: "φ" }).fill("29");
  await expect(fig.locator(".lagrange__fact")).toContainText("u — собственный вектор Σ, λ = uᵀΣu = 2.44");
  await fig.getByRole("button", { name: "½(x₁² + 2x₂²) на прямой" }).press("Enter");
  await fig.getByRole("slider", { name: "t" }).fill("0.67");
  await expect(fig.locator(".lagrange__fact")).toContainText("минимум f на прямой");

  const final = page.locator("#final-check");
  const spec = generator("calc.lagrange-line").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
