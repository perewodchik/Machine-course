// Уроки модуля IV «Статистика»: виджеты, разборы ошибок, итоговые проверки, axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

test("урок IV.1: выброс уводит среднее, медиана стоит; итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/statistics/descriptive/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Выборка и описательная статистика");

  const fig = page.locator(".outlier-widget").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // двенадцатая цена 10: среднее (105.8 + 10)/12 = 9.65, медиана (9.3 + 9.8)/2 = 9.55
  await expect(fig.locator("[aria-live]")).toContainText("среднее 9.65, медиана 9.55");
  await fig.getByRole("slider", { name: "x12" }).press("End");
  // 60: среднее (105.8 + 60)/12 = 13.82, медиана та же
  await expect(fig.locator("[aria-live]")).toContainText("среднее 13.82, медиана 9.55");

  const shift = page.locator("[data-exercise][data-item='stat.outlier-shift']").first();
  await shift.locator("[data-variant]:not([hidden]) input").first().fill("1000");
  await shift.getByRole("button", { name: "Проверить" }).click();
  await expect(shift.locator("[data-feedback]")).not.toContainText("Верно");

  const final = page.locator("#final-check");
  const spec = generator("stat.iqr").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок IV.2: ссылка на игру, разбор Бесселя, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/statistics/estimators/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Оценки: смещение, разброс, MSE");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/estimator-range/");

  const bessel = page.locator("[data-exercise][data-item='stat.bessel']").first();
  const task = generator("stat.bessel").make(1);
  if (task.kind !== "numeric") throw new Error("ожидалось число");
  // seed 1 — несмещённая оценка; ответ с делением на n — типичная ошибка
  const n = Number(/n = (\d+)\$/.exec(task.prompt)![1]);
  await bessel.locator("[data-variant]:not([hidden]) input").first().fill(String((task.answer * (n - 1)) / n));
  await bessel.getByRole("button", { name: "Проверить" }).click();
  await expect(bessel.locator("[data-feedback]")).not.toContainText("Верно");

  const final = page.locator("#final-check");
  const spec = generator("stat.shrink-mse").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок IV.3: ссылки на игру и лабораторную, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/statistics/mle/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Метод максимального правдоподобия");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/likelihood-machine/");
  await expect(page.locator("a[href*='notebooks/stats/mle_by_hand.ipynb']").first()).toBeAttached();

  const final = page.locator("#final-check");
  const spec = generator("stat.mle-family").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  // seed 31 — показательное: типичная ошибка — x̄ вместо 1/x̄
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(Math.round((1 / spec.answer) * 1000) / 1000));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).not.toContainText("Урок отмечен");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок IV.4: найди ошибку — деление на n − 1, итоговая проверка матрицей", async ({ page }) => {
  await page.goto("/foundations/statistics/multivariate-mle/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Многомерный MLE");

  const err = page.locator("[data-exercise]").filter({ hasText: "В какой строке вывода ошибка?" }).first();
  await err.locator("[data-option]").nth(1).click();
  await expect(err.locator("[data-feedback]")).toContainText("Строка верна");
  await err.locator("[data-option]").nth(2).click();
  await expect(err.locator("[data-feedback]")).toContainText("Деление на");

  const final = page.locator("#final-check");
  const spec = generator("stat.cov-mle").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  const cells = final.locator("[data-variant]:not([hidden]) input");
  for (const [k, v] of spec.answer.flat().entries()) await cells.nth(k).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок IV.5: предсказание натурального параметра, лабораторная, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/statistics/exponential-family/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Экспоненциальное семейство");
  await expect(page.locator("a[href*='notebooks/stats/logistic_mle.ipynb']").first()).toBeAttached();

  const final = page.locator("#final-check");
  const spec = generator("stat.natural-param").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  // seed 31 — Бернулли: типичная ошибка — ответить самим φ
  const phi = Number(/phi = ([\d.]+)\$/.exec(spec.prompt)![1]);
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(phi));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).not.toContainText("Урок отмечен");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок IV.6: ссылка на игру, разбор ridge, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/statistics/bayes-map/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Байесовский подход и MAP");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/prior-vs-coin/");

  const final = page.locator("#final-check");
  const spec = generator("stat.beta-update").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  // типичная ошибка — ответить долей k/n без приора
  const [n, k] = /бросили \$(\d+)\$ раз, орлов — \$(\d+)\$/.exec(spec.prompt)!.slice(1).map(Number) as [number, number];
  if (Math.abs(k / n - spec.answer) > 0.01) {
    await final.locator("[data-variant]:not([hidden]) input").first().fill(String(Math.round((k / n) * 1000) / 1000));
    await final.getByRole("button", { name: "Проверить" }).click();
    await expect(final.locator("[data-feedback]")).not.toContainText("Урок отмечен");
  }
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок IV.7: предсказание, ссылка на игру, разбор ошибки, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/statistics/risk-generalization/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Риск, обобщение, кросс-валидация");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/overfit/");

  const pr = page.locator("[data-exercise][data-item='iv7.predict-degree-11']");
  await pr.locator("[data-option]").filter({ hasText: "Обе почти ноль" }).click();
  await expect(pr.locator("[data-feedback]")).toContainText("выучить и шум");

  const final = page.locator("#final-check");
  const spec = generator("stat.pred-error").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  // типичная ошибка — забыть шум: ответ без σ²
  const nums = [...spec.prompt.matchAll(/= (0\.\d+)\$/g)].map((m) => Number(m[1]));
  const wrong = Math.round((nums[1]! + nums[2]!) * 10000) / 10000;
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(wrong));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).not.toContainText("Урок отмечен");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("итоговая проверка модуля IV: семь задач по урокам IV.1–IV.7", async ({ page }) => {
  await page.goto("/foundations/statistics/risk-generalization/");
  const set = page.locator("[data-exercise-set]");
  await set.scrollIntoViewIfNeeded();
  const summary = set.locator("[data-summary]");
  await expect(summary).toHaveText(/Решено верно: 0 из\s7\./);
  for (const ex of await set.locator("[data-exercise]").all()) {
    const gen = (await ex.getAttribute("data-item"))!;
    const seed = Number(await ex.locator("[data-variant]").getAttribute("data-seed"));
    const task = generator(gen).make(seed);
    if (task.kind === "numeric") {
      await ex.locator("input[data-input]").fill(String(task.answer));
      await ex.getByRole("button", { name: "Проверить" }).click();
    } else if (task.kind === "choice") {
      await ex.locator("[data-option]").nth(task.options.findIndex((o) => o.correct)).click();
    } else if (task.kind === "matrix") {
      for (const [i, row] of task.answer.entries()) for (const [j, v] of row.entries()) await ex.locator(`[data-cell="${i},${j}"]`).fill(String(v));
      await ex.getByRole("button", { name: "Проверить" }).click();
    } else throw new Error(`задача ${gen}: вид ${task.kind}`);
  }
  await expect(summary).toHaveText(/Решено верно: 7 из\s7\./);
});

test("урок IV.8★: смысл интервала, ссылка на игру, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/statistics/intervals-tests/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Доверительные интервалы и проверка гипотез");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/cover-truth/");

  const pr = page.locator("[data-exercise][data-item='iv8.predict-meaning']");
  await pr.locator("[data-option]").filter({ hasText: /лежит в/ }).click();
  await expect(pr.locator("[data-feedback]")).toContainText("в частотном подходе");

  const final = page.locator("#final-check");
  const spec = generator("stat.ci-mean").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  // типичная ошибка — делить σ на n, а не на √n
  const [n, mean, sigma] = /n = (\d+)\$ наблюдений \$\\bar x = ([\d.]+)\$, стандартное отклонение известно: \$\\sigma = (\d+)/.exec(spec.prompt)!.slice(1).map(Number) as [number, number, number];
  const z = Number(/z = ([\d.]+)/.exec(spec.prompt)![1]);
  const wrong = Math.round((mean + Math.sign(spec.answer - mean) * (z * sigma) / n) * 10000) / 10000;
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(wrong));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).not.toContainText("Урок отмечен");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
