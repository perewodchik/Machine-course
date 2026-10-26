// Модуль III (S4.L3): урок III.1 — события как области на двух кубиках (объединение, несовместные события),
// разбор «сложили совместные», итоговая проверка ставит «знаю». Урок III.2 — режим «A | B», независимость,
// разбор деления не на |B|, итоговая проверка. axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

test.describe.configure({ timeout: 90_000 });

test("урок III.1: события как области, включения-исключения, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/probability-space/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Вероятностное пространство");

  const fig = page.locator(".events").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // A — сумма ≥ 8 (15), B — первый чётный (18), A ∩ B — 9: |A ∪ B| = 24, как в сниппете prob/events.py
  await expect(fig.locator(".events__facts")).toContainText("P(A ∪ B) = 15/36 + 18/36 − 9/36 = 24/36");
  await expect(fig.locator(".events__cell.is-res")).toHaveCount(24);
  await fig.getByRole("group", { name: "Событие B" }).getByRole("button", { name: "сумма ≤ 4" }).press("Enter");
  await expect(fig.locator(".events__facts")).toContainText("|A ∩ B| = 0");

  const un = page.locator("[data-exercise][data-item='prob.union']");
  const seed = Number(await un.locator("[data-variant]:not([hidden])").getAttribute("data-seed"));
  const task = generator("prob.union").make(seed);
  if (task.kind !== "numeric") throw new Error("ожидалось число");
  // ответ без вычитания пересечения: P(A) + P(B)
  const [pa, pb] = [...task.prompt.matchAll(/= ([\d.]+)\$/g)].slice(0, 2).map((m) => Number(m[1]));
  await un.locator("[data-variant]:not([hidden]) input").first().fill(String(Math.round((pa! + pb!) * 1000) / 1000));
  await un.getByRole("button", { name: "Проверить" }).click();
  await expect(un.locator("[data-feedback]")).toContainText("пересечение учтено дважды");

  const final = page.locator("#final-check");
  const spec = generator("prob.dice-event").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.2: условие сужает мир, независимость, ловушка P(B | A), итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/conditional-independence/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Условная вероятность и независимость");

  const fig = page.locator(".events").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // A — первый чётный, B — сумма ≥ 8: P(A | B) = 9/15, 21 клетка вне B погашена, события зависимы
  await expect(fig.locator(".events__facts").first()).toContainText("P(A | B) = 9/15 ≈ 0.6");
  await expect(fig.locator(".events__cell.is-out")).toHaveCount(21);
  await expect(fig.locator(".events__verdict")).toHaveText("A и B зависимы");
  await fig.getByRole("group", { name: "Событие B" }).getByRole("button", { name: "на втором 6" }).press("Enter");
  await expect(fig.locator(".events__verdict")).toHaveText("A и B независимы");

  const cd = page.locator("[data-exercise][data-item='prob.cond-dice']").first();
  await cd.locator("[data-variant]:not([hidden]) input").first().fill("0.999");
  await cd.getByRole("button", { name: "Проверить" }).click();
  await expect(cd.locator("[data-feedback]")).toContainText("Делите на число исходов условия");

  const final = page.locator("#final-check");
  const spec = generator("prob.cond-dice").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.4: площадь под плотностью равна F(t), плотность больше 1, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/random-variables/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Случайные величины: PMF, PDF, CDF");

  const fig = page.locator(".density-cdf").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // нормальное, t = 0.5: F ≈ 0.691; равномерное на [0, 0.5], t = 0.25: плотность 2, F = 0.5 — как в model.test.ts
  await expect(fig.locator("[aria-live]")).toContainText("F(t) = P(X ≤ t) = 0.691");
  await fig.getByRole("button", { name: "равномерное на [0, 0.5]" }).press("Enter");
  await expect(fig.locator("[aria-live]")).toContainText("плотность в t равна 2.000 — это не вероятность");
  await fig.getByRole("button", { name: "орлы в 4 бросках" }).press("Enter");
  // t = 2: F(2) = 11/16 = 0.6875
  await expect(fig.locator("[aria-live]")).toContainText("F(t) = P(X ≤ t) = 0.688");

  const final = page.locator("#final-check");
  const spec = generator("prob.interval-prob").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.5: центр масс и разрыв Йенсена, разбор Var(aX + b), итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/expectation-variance/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Матожидание, дисперсия, неравенство Йенсена");

  const fig = page.locator(".center-mass").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // веса (1, 3, 2, 0, 1): p = (1, 3, 2, 0, 1)/7, E X = 11/7 ≈ 1.57, Var = 27/7 − 121/49 = 68/49 ≈ 1.39
  await expect(fig.locator("[aria-live]")).toContainText("E X = 1.57, Var X = 1.39");
  // оставляем груз только в x = 1: E X = 1, Var = 0, разрыв Йенсена 0
  for (const k of [0, 2, 4]) {
    const s = fig.getByRole("slider", { name: `w${k}` });
    await s.focus();
    await s.press("Home");
  }
  await expect(fig.locator("[aria-live]")).toContainText("E X = 1.00, Var X = 0.00");

  const vl = page.locator("[data-exercise][data-item='prob.var-linear']");
  await vl.locator("[data-variant]:not([hidden]) input").first().fill("-1");
  await vl.getByRole("button", { name: "Проверить" }).click();
  await expect(vl.locator("[data-feedback]")).toContainText("не бывает отрицательной");

  const final = page.locator("#final-check");
  const spec = generator("prob.ev-var").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.6: обозреватель распределений, ссылка на игру, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/discrete-distributions/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Дискретные распределения");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/dist-zoo/");

  const fig = page.locator(".dist-explorer").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // Bin(10, 0.3): E = 3, Var = 2.1; Пуассон λ = 3: E = Var = 3
  await expect(fig.locator("[aria-live]")).toContainText("E X = 3.00, Var X = 2.10");
  await fig.getByRole("button", { name: "Пуассона" }).press("Enter");
  await expect(fig.locator("[aria-live]")).toContainText("E X = 3.00, Var X = 3.00");

  const final = page.locator("#final-check");
  const spec = generator("prob.family-moments").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.7: нормальное и 68 %, бета, разбор σ против σ², итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/continuous-distributions/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Непрерывные распределения");

  const fig = page.locator(".cont-explorer").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // N(0.5, 1): внутри μ ± σ — 68.3 %; Beta(2, 5): E = 2/7 ≈ 0.29
  await expect(fig.locator("[aria-live]")).toContainText("Внутри μ ± σ — 68.3 %");
  await fig.getByRole("button", { name: "бета" }).press("Enter");
  await expect(fig.locator("[aria-live]")).toContainText("E X = 0.29");

  const nr = page.locator("[data-exercise][data-item='prob.normal-rule']").first();
  await nr.locator("[data-variant]:not([hidden]) input").first().fill("0.5");
  await nr.getByRole("button", { name: "Проверить" }).click();
  await expect(nr.locator("[data-feedback]")).not.toContainText("Верно");

  const final = page.locator("#final-check");
  const spec = generator("prob.normal-rule").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.8: бегущее среднее, гистограмма суммы при n = 50, разбор ошибки 1/n, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/limit-theorems/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Предельные теоремы и метод Монте-Карло");

  const rm = page.locator(".running-mean").first();
  await rm.scrollIntoViewIfNeeded();
  await expect(rm.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(rm.locator("[aria-live]")).toContainText("кубик, n = 500");
  await rm.getByRole("button", { name: "Бернулли, φ = 0.2" }).press("Enter");
  await expect(rm.locator("[aria-live]")).toContainText("μ = 0.20");

  const sh = page.locator(".sum-histogram").first();
  await sh.scrollIntoViewIfNeeded();
  await expect(sh.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // одна показательная: P(|Z| ≤ 1) = 1 − e⁻² ≈ 0.86; сумма 50 — около 0.68
  await expect(sh.locator("[aria-live]")).toContainText(/n = 1: .* — 0\.8[5-7]\d/);
  await sh.getByRole("slider", { name: "n" }).press("End");
  await expect(sh.locator("[aria-live]")).toContainText(/n = 50: .* — 0\.6[6-9]\d/);

  const mc = page.locator("[data-exercise][data-item='prob.mc-error']").first();
  const wrong = generator("prob.mc-error").make(1);
  if (wrong.kind !== "numeric") throw new Error("ожидалось число");
  await mc.locator("[data-variant]:not([hidden]) input").first().fill(String(wrong.answer * 1000 + 1));
  await mc.getByRole("button", { name: "Проверить" }).click();
  await expect(mc.locator("[data-feedback]")).not.toContainText("Верно");

  const final = page.locator("#final-check");
  const spec = generator("prob.mc-error").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.9: облако — парабола и выброс, разбор Cov, ссылка на игру, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/joint-distributions/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Совместные распределения и ковариация");

  const fig = page.locator(".scatter-cloud").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(fig.locator("[aria-live]")).toContainText("линейное, ρ = 0.60");
  await fig.getByRole("button", { name: "парабола" }).press("Enter");
  // у параболы корреляция около нуля
  await expect(fig.locator("[aria-live]")).toContainText(/корреляция −?0\.[01]\d/);
  await fig.getByRole("button", { name: "выброс" }).press("Enter");
  await expect(fig.getByRole("slider", { name: "x0" })).toBeVisible();
  await expect(fig.locator("[aria-live]")).toContainText("выброс в (3.5, −3.5)");

  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/guess-correlation/");

  const cov = page.locator("[data-exercise][data-item='prob.covariance']").first();
  await cov.locator("[data-variant]:not([hidden]) input").first().fill("0.9");
  await cov.getByRole("button", { name: "Проверить" }).click();
  await expect(cov.locator("[data-feedback]")).not.toContainText("Верно");

  const final = page.locator("#final-check");
  const spec = generator("prob.covariance").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.10: облако — поворот и вырожденная матрица, итоговая проверка матрицей", async ({ page }) => {
  await page.goto("/foundations/probability/random-vectors/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Случайные векторы и линейные преобразования");

  const fig = page.locator(".cloud-transform").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // A = [[1.5, 0.5], [0, 0.8]]: AAᵀ = [[2.5, 0.4], [0.4, 0.64]], det A = 1.2
  await expect(fig.locator("[aria-live]")).toContainText("AAᵀ = [[2.50, 0.40], [0.40, 0.64]], det A = 1.20");
  await fig.getByRole("button", { name: "поворот" }).press("Enter");
  await expect(fig.locator("[aria-live]")).toContainText("[[0.98, 0.00], [0.00, 0.98]]");
  await fig.getByRole("button", { name: "вырожденная" }).press("Enter");
  await expect(fig.locator("[aria-live]")).toContainText("det A = 0.00");

  const final = page.locator("#final-check");
  const spec = generator("prob.cov-linear").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  const cells = final.locator("[data-variant]:not([hidden]) input");
  await expect(cells).toHaveCount(4);
  for (const [k, v] of spec.answer.flat().entries()) await cells.nth(k).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
