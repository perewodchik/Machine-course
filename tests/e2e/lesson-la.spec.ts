// Модуль I (S3.L1): урок I.1 — оболочка на рисунке переключается между плоскостью и прямой с клавиатуры,
// задача «лежит ли вектор в оболочке» разбирает параллельные векторы, итоговая проверка ставит «знаю».
// Урок I.2 — шары норм и проекция управляются с клавиатуры, задача на норму разбирает ошибку, итоговая проверка.
// Урок I.3 — четыре взгляда на AB переключаются, расчёт пишется словами, задача про `*` разбирает `@`, итоговая.
// Урок I.5 — формула (Xθ − y)ᵀ проверяется на случайных матрицах, «найди ошибку» разбирает верную строку, итоговая.
// Урок I.6 — прямые на рисунке переключаются заготовками и бегунком, ранги и число решений, итоговая проверка.
// Урок I.7 — сдвиг и отражение на сетке, det композиции не зависит от порядка, разбор det(AB), итоговая.
// Урок I.8 — проекция на плоскость: остаток перпендикулярен столбцам при любом y, разбор, итоговая проверка. axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

// уроки длинные: гидратация рисунков, MathLive и axe по всей странице идут дольше 30 секунд под нагрузкой
test.describe.configure({ timeout: 90_000 });

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

test("урок I.3: четыре взгляда на AB, разбор A @ B, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/matrix-multiplication/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Умножение матриц: четыре взгляда");

  const mv = page.locator(".mv").first();
  await mv.scrollIntoViewIfNeeded();
  await expect(mv.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await mv.getByRole("button", { name: "(1, 2)" }).press("Enter");
  await expect(mv.locator(".mv__explain")).toHaveText("(AB)₁₂ = строка 1 A на столбец 2 B = 1·1 + 0·0 + 3·4 = 13");
  await mv.getByRole("button", { name: "Внешние произведения" }).press("Enter");
  await mv.getByRole("button", { name: "k = 3" }).press("Enter");
  await expect(mv.locator(".mv__explain")).toContainText("сумма первых 3 из 3 слагаемых — это AB");
  await expect(mv.locator(".mv__name").nth(2)).toHaveText("AB");

  const star = page.locator("[data-exercise][data-item='i3.hadamard']");
  await star.locator("[data-option]").nth(1).click();
  await expect(star.locator("[data-feedback]")).toContainText("Это A @ B");
  await expect(star.locator("code").first()).toHaveText("A * B");

  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/dim-tetris/");
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.matmul-column").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок I.5: транспонирование формулой, «найди ошибку», итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/transpose-trace/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Транспонирование, симметрия, след");

  const formula = page.locator("[data-exercise][data-item='i5.transpose-formula']");
  await formula.scrollIntoViewIfNeeded();
  const enter = async (tex: string) => {
    const field = formula.locator("math-field[data-formula-input]");
    await expect(field).toBeAttached();
    await field.evaluate((el, value) => {
      (el as HTMLElement & { value: string }).value = value;
    }, tex);
    await formula.getByRole("button", { name: "Проверить" }).click();
  };
  await enter(String.raw`X^\top\theta^\top - y^\top`);
  await expect(formula.locator("[data-feedback]")).toContainText("Пока нет.");
  await enter(String.raw`\theta^\top X^\top - y^\top`);
  await expect(formula.locator("[data-feedback]")).toContainText("Верно.");

  const bug = page.locator("[data-exercise][data-item='i5.find-error']");
  await bug.locator("[data-option]").nth(0).click();
  await expect(bug.locator("[data-feedback]")).toContainText("след такой матрицы");
  await bug.locator("[data-option]").nth(3).click();
  await expect(bug.locator("[data-feedback]")).toContainText("не циклическая перестановка");

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.sym-part").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок I.6: параллельные и совпадающие прямые, ранги, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/systems-rank/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Системы уравнений и ранг");

  const fig = page.locator(".system-lines").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(fig.locator(".system-lines__fact")).toContainText("одно решение: прямые пересекаются. Решение: x = (0, 1).");
  await fig.getByRole("button", { name: "параллельны" }).press("Enter");
  await expect(fig.locator(".system-lines__fact")).toHaveText("нет решений: прямые параллельны");
  await expect(fig.locator(".kit-readout").nth(1)).toContainText("2");
  // b₂ с 1 до 4 (End) — второе уравнение становится удвоенным первым
  await fig.getByRole("slider", { name: "b2" }).press("End");
  await expect(fig.locator(".system-lines__fact")).toHaveText("бесконечно много решений: прямые совпадают");
  await expect(fig.getByRole("button", { name: "совпадают" })).toHaveAttribute("aria-pressed", "true");

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.solutions-count").make(31);
  if (spec.kind !== "choice") throw new Error("ожидался выбор");
  await final.locator("[data-variant]:not([hidden]) [data-option]").nth(spec.options.findIndex((o) => o.correct)).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});

test("урок I.7: площадь со знаком на сетке, det композиции, разбор, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/inverse-determinant/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Обратная матрица и определитель");

  const grid = page.locator(".grid-map").first();
  await grid.scrollIntoViewIfNeeded();
  await expect(grid.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await grid.getByRole("button", { name: "Сдвиг", exact: true }).click();
  await expect(grid.locator(".kit-readout")).toContainText("1.00");
  await grid.getByRole("button", { name: "Отражение", exact: true }).click();
  await expect(grid.locator(".kit-readout")).toContainText("−1.00");

  const comp = page.locator(".grid-map").nth(1);
  await comp.scrollIntoViewIfNeeded();
  await expect(comp.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(comp.locator(".kit-readout")).toContainText("2.00");
  await comp.getByRole("radio", { name: /сначала S, потом H/ }).check();
  await expect(comp.locator(".kit-readout")).toContainText("2.00");

  const rules = page.locator("[data-exercise][data-item='la.det-rules']");
  await rules.locator("[data-variant]:not([hidden]) input").first().fill("0");
  await rules.getByRole("button", { name: "Проверить" }).click();
  await expect(rules.locator("[data-feedback]")).toContainText("перемножаются");

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.inverse2").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  // закреплённая шапка поверх радиокнопок рисунка 2 axe считает нехваткой места для касания — проверяем сверху
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок I.8: проекция на плоскость столбцов с клавиатуры, разбор ортогональной матрицы, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/orthogonality-projections/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ортогональность и проекции");

  const fig = page.locator(".plane-proj").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // y = (1, 0.5, 2): ŷ = (1.42, 0.92, 1.17) — то же, что печатает ячейка Python
  await expect(fig.locator("[aria-live]")).toContainText("проекция ŷ = (1.42, 0.92, 1.17)");
  await fig.getByRole("slider", { name: "y3" }).press("Home");
  await expect(fig.locator(".plane-proj__facts")).toContainText("(y − ŷ) = (0.00, 0.00)");
  await fig.getByRole("slider", { name: "φ" }).press("End");
  await expect(fig.locator(".plane-proj__facts")).toContainText("(0.00, 0.00)");

  const om = page.locator("[data-exercise][data-item='la.orthogonal-matrix']");
  await om.locator("[data-variant]:not([hidden]) [data-option]").nth(1).click();
  await expect(om.locator("[data-feedback]")).toContainText("Длина каждого столбца здесь ровно 1");

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.project-orthogonal").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
