// Модуль 0 (S3.L0): урок 0.1 — рисунок без кнопки минимума, итоговая проверка ставит «знаю»; игра «Подгони прямую»
// проходится с клавиатуры по бегункам; партия по ссылке ?seed=&level= совпадает с моделью.
// Урок 0.3 — перевод записей в обе стороны с разбором ошибок, композиция, итоговая проверка.
// Урок 0.4 — задача из правила xᵀAy с разбором перестановки индексов, вывод формулы 1 по шагам, итоговая проверка.
// Урок 0.5 — задача из правила log ∏ = Σ log, вывод производной сигмоиды в четыре шага, итоговая проверка.
// Урок 0.6 — разбор «забыта внутренняя производная», вывод производной log g, ячейка с разностями, итоговая проверка.
// Урок 0.7 — сумма прямоугольников с клавиатуры (n, точка), вывод нормировки экспоненты, итоговая проверка. axe.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations } from "./support";

test("урок 0.1: рисунок без «Показать минимум», итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/regression-by-hand/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Регрессия руками за 15 минут");
  const fig = page.locator(".fit-line").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(fig.getByRole("button", { name: /минимум/ })).toHaveCount(0);

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("basics.sse").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/fit-line/");
  await expectNoAxeViolations(page);
});

test("«Подгони прямую»: уровень «наклон» проходится стрелками на бегунке; далёкая прямая не принимается", async ({ page }) => {
  const SEED = 3;
  await page.goto(`/games/fit-line/?seed=${SEED}&level=1`);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 3: наклон/);
  // та же выборка, что в модели игры (model.ts, generate): 12 квартир из 16 по seed уровня; наклон прямой через ноль
  const data = JSON.parse(readFileSync("src/games/fit-line/data.json", "utf8")) as { area: number[]; price: number[] };
  const pick = rng(SEED * 1000 + 0)
    .shuffle(data.area.map((_, i) => i))
    .slice(0, 12);
  const sxy = pick.reduce((s, i) => s + data.area[i]! * data.price[i]!, 0);
  const sxx = pick.reduce((s, i) => s + data.area[i]! ** 2, 0);
  const STEP = 0.002;
  const slider = page.getByRole("slider", { name: "θ1" });
  await expect(slider).toBeVisible();
  // сначала сдаём стартовую прямую — не принимается
  await page.getByRole("button", { name: "Сдать прямую" }).click();
  await expect(page.locator(".game__feedback")).toContainText("Ещё не минимум");
  const steps = Math.round((sxy / sxx - 0.05) / STEP);
  await slider.focus();
  for (let k = 0; k < steps; k++) await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Сдать прямую" }).click();
  await expect(page.locator(".game__feedback")).toContainText("Принято");
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  await expectNoAxeViolations(page);
});

test("урок 0.3: перевод записей в обе стороны, разбор ошибки, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/language-of-math/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Язык математики: множества, отображения, кванторы");

  // перевод: первый вариант — от символов к словам; неверный вариант объясняет путаницу ∈ и ⊂
  const practice = page.locator("[data-exercise][data-item='basics.read-notation']");
  const visible = practice.locator("[data-variant]:not([hidden])");
  const spec = generator("basics.read-notation").make(1);
  if (spec.kind !== "choice") throw new Error("ожидался выбор");
  await expect(visible).toContainText("Как читается запись");
  await visible.locator("[data-option]").nth(spec.options.findIndex((o) => o.text.includes("множество векторов"))).click();
  await expect(practice.locator("[data-feedback]")).toContainText("подмножеством");
  await visible.locator("[data-option]").nth(spec.options.findIndex((o) => o.correct)).click();
  await expect(practice.locator("[data-feedback]")).toContainText("Верно.");
  // через восемь вариантов — те же записи в обратную сторону
  for (let k = 0; k < 8; k++) await practice.getByRole("button", { name: "Ещё задача" }).click();
  await expect(visible).toContainText("Как записать символами");

  // композиция: обратный порядок функций узнаётся по ответу
  const compose = page.locator("[data-exercise][data-item='start3.compose']");
  await compose.locator("input[data-input]").fill("7");
  await compose.getByRole("button", { name: "Проверить" }).click();
  await expect(compose.locator("[data-feedback]")).toContainText("в обратном порядке");
  await compose.locator("input[data-input]").fill("8");
  await compose.getByRole("button", { name: "Проверить" }).click();
  await expect(compose.locator("[data-feedback]")).toContainText("Верно.");

  const final = page.locator("[data-exercise][data-final]");
  const argmin = generator("basics.argmin").make(31);
  if (argmin.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(argmin.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок 0.4: xᵀAy из правила, вывод геометрического ряда по шагам, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/sums-products-indicators/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Суммы, произведения, индикатор");

  // задача из правила: перестановка индексов у A разобрана
  const rule = page.locator("[data-exercise][data-item='start4.bilinear-rule']");
  await rule.locator("[data-option]").filter({ hasText: "Aji" }).click();
  await expect(rule.locator("[data-feedback]")).toContainText("переставлены");
  await rule.locator("[data-option]").filter({ hasText: "Aijyj" }).click();
  await expect(rule.locator("[data-feedback]")).toContainText("Верно.");

  // формула 1: вывод в три шага, каждый открывается
  const formula = page.locator("[data-formula='f.geometric-series']");
  await formula.getByRole("button", { name: "Показать все шаги" }).click();
  await expect(formula.getByText("стремится к нулю.", { exact: false }).last()).toBeVisible();

  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/sum-translator/");
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("basics.indicator-sum").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок 0.5: log ∏ из правила, производная сигмоиды по шагам, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/exp-log-sigmoid/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Экспонента, логарифм, сигмоида");

  const rule = page.locator("[data-exercise][data-item='start5.log-product']");
  await rule.locator("[data-option]").filter({ hasText: "∏i=1nlogpi" }).click();
  await expect(rule.locator("[data-feedback]")).toContainText("превращает умножение в сложение");

  const formula = page.locator("[data-formula='f.sigmoid-derivative']");
  await formula.getByRole("button", { name: "Показать все шаги" }).click();
  await expect(formula.getByText("Шаг 4 из 4")).toBeVisible();

  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/underflow/");
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("basics.sigmoid").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок 0.6: разбор внутренней производной, вывод log g по шагам, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/derivative-refresher/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Производная и правило цепочки");

  const cls0 = page.locator("[data-exercise][data-item='start6.log-class0']");
  await cls0.locator("[data-option]").nth(1).click();
  await expect(cls0.locator("[data-feedback]")).toContainText("Забыта внутренняя производная");

  const formula = page.locator("[data-formula='f.log-sigmoid-derivative']");
  await formula.getByRole("button", { name: "Показать все шаги" }).click();
  await expect(formula.getByText("Шаг 4 из 4")).toBeVisible();
  await expect(page.locator("[data-py-cell]")).toHaveCount(1);

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("basics.chain-rule").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок 0.7: сумма прямоугольников приближает интеграл, вывод нормировки, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/integral/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Интеграл");

  const fig = page.locator(".riemann").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  const sum = fig.locator(".kit-readout__value").first();
  await expect(sum).toHaveText("1.7500"); // 4 левых прямоугольника под x² на [0, 2]
  await fig.getByRole("slider", { name: "n" }).focus();
  await page.keyboard.press("End");
  await fig.getByRole("button", { name: "средние" }).press("Enter");
  await expect(fig.getByRole("button", { name: "средние" })).toHaveAttribute("aria-pressed", "true");
  await expect(sum).toHaveText("2.6665"); // 64 средних: 8/3 − (b − a) h² f″ / 24 при h = 1/32
  await expect(fig.locator(".kit-readout__hint")).toHaveText("ошибка 0.0002");

  const formula = page.locator("[data-formula='f.exponential-normalization']");
  await formula.getByRole("button", { name: "Показать все шаги" }).click();
  await expect(formula.getByText("Шаг 4 из 4")).toBeVisible();

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("basics.integral").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});
