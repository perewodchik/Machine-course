// Движок упражнений (S2.03) на /lab: все типы, ввод с запятой и вывод с точкой, подсказки лесенкой,
// «Ещё задача», уверенность и журнал попыток, итоговая проверка модуля. axe /lab — в layout.spec.ts.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { layoutPages } from "./support";

const ex = (page: Page, n: number) => page.locator(".lab [data-exercise]").filter({ has: page.locator(".block__title", { hasText: new RegExp(`^(Упражнение|Предскажите)\\u00a0${n}\\.$`) }) });
const visible = (root: Locator) => root.locator("[data-variant]:not([hidden])");

test.beforeEach(async ({ page }) => {
  await page.goto(layoutPages.lab);
});

test("числовой ответ: запятая принимается, вывод с точкой, неверный и нечисловой ввод", async ({ page }) => {
  const root = ex(page, 1);
  const answer = generator("la.slope3").make(1);
  if (answer.kind !== "numeric") throw new Error("ожидалась числовая задача");
  const input = visible(root).locator("input[data-input]");
  await input.fill("полтора");
  await root.getByRole("button", { name: "Проверить" }).click();
  await expect(root.getByRole("status")).toContainText("Введите число");
  await input.fill(String(answer.answer + 1).replace(".", ","));
  await input.press("Enter");
  await expect(root.getByRole("status")).toContainText("Пока нет.");
  await root.getByRole("radio", { name: "уверен" }).check();
  await input.fill(String(answer.answer).replace(".", ","));
  await root.getByRole("button", { name: "Проверить" }).click();
  await expect(root.getByRole("status")).toContainText("Верно.");
  await expect(root.getByRole("status")).toContainText(`Ваш ответ: ${String(answer.answer).replace("-", "−")}.`);
  await expect(input).toHaveClass(/is-right/);
  // журнал: две засчитанные попытки (нечисловой ввод не считается), у верной — уверенность
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  const attempts = journal.filter((e: { item: string }) => e.item === "la.slope3");
  expect(attempts.map((e: { correct: boolean }) => e.correct)).toEqual([false, true]);
  expect(attempts[1]).toMatchObject({ lesson: "foundations/bridge/linear-regression", seed: 1, attempt: 2, confidence: 3, generatorVersion: 1 });
});

test("подсказки открываются по одной, «Ещё задача» даёт новую", async ({ page }) => {
  const root = ex(page, 1);
  const hint = root.getByRole("button", { name: /Подсказка/ });
  await expect(hint).toHaveText("Подсказка 1 из 3");
  await hint.click();
  await expect(visible(root).locator("[data-hint]:not([hidden])")).toHaveCount(1);
  await expect(hint).toHaveText("Подсказка 2 из 3");
  const before = await visible(root).locator("p").first().textContent();
  await root.getByRole("button", { name: "Ещё задача" }).click();
  await expect(visible(root)).toBeFocused();
  await expect(visible(root).locator("p").first()).not.toHaveText(before ?? "");
  await expect(visible(root).locator("[data-hint]:not([hidden])")).toHaveCount(0);
  await expect(hint).toHaveText("Подсказка 1 из 3");
});

test("выбор: у каждого неверного варианта — свой разбор", async ({ page }) => {
  const root = ex(page, 2);
  const spec = generator("la.shapes").make(1);
  if (spec.kind !== "choice") throw new Error("ожидался выбор");
  const options = visible(root).locator("[data-option]");
  const wrong = spec.options.findIndex((o) => !o.correct);
  await options.nth(wrong).click();
  await expect(root.getByRole("status")).toContainText("Пока нет.");
  await expect(options.nth(wrong)).toHaveAttribute("aria-pressed", "true");
  await options.nth(spec.options.findIndex((o) => o.correct)).focus();
  await page.keyboard.press("Enter");
  await expect(root.getByRole("status")).toContainText("Верно.");
});

test("матрица: клетки проверяются по отдельности", async ({ page }) => {
  const root = ex(page, 3);
  const spec = generator("la.matmul2").make(1);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  const cell = (i: number, j: number) => visible(root).locator(`[data-cell="${i},${j}"]`);
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await cell(i, j).fill(String(v));
  await cell(1, 1).fill(String(spec.answer[1]![1]! + 1));
  await root.getByRole("button", { name: "Проверить" }).click();
  await expect(root.getByRole("status")).toContainText("Неверных клеток: 1.");
  await expect(cell(1, 1)).toHaveAttribute("aria-invalid", "true");
  await cell(1, 1).fill(String(spec.answer[1]![1]));
  await cell(1, 1).press("Enter");
  await expect(root.getByRole("status")).toContainText("Верно.");
});

test("порядок шагов собирается кнопками «Выше» с клавиатуры", async ({ page }) => {
  const root = ex(page, 4);
  const items = visible(root).locator(".order > li");
  const n = await items.count();
  for (let target = 0; target < n; target++) {
    for (;;) {
      const steps = await items.evaluateAll((els) => els.map((el) => Number((el as HTMLElement).dataset.step)));
      const at = steps.indexOf(target);
      if (at === target) break;
      await items.nth(at).getByRole("button", { name: "Выше" }).focus();
      await page.keyboard.press("Enter");
    }
  }
  await root.getByRole("button", { name: "Проверить" }).click();
  await expect(root.getByRole("status")).toContainText("Верно.");
});

test("«предскажи, потом проверь»: после прогноза открывается ответ", async ({ page }) => {
  const root = ex(page, 5);
  await expect(visible(root).locator("[data-reveal]")).toBeHidden();
  await visible(root).getByRole("button", { name: "Вырастет" }).click();
  await expect(root.getByRole("status")).toContainText("Прогноз сбылся.");
  await expect(visible(root).locator("[data-reveal]")).toBeVisible();
});

test("итоговая проверка модуля считает верные ответы и по урокам", async ({ page }) => {
  const set = page.locator("[data-exercise-set]");
  const summary = set.locator("[data-summary]");
  await expect(summary).toHaveText(/Решено верно: 0 из\s3\./);
  // задача по уроку I.7 (определитель): ответ из генератора с тем же seed, что выдал набор
  const det = set.locator("[data-exercise][data-item='la.det2']");
  const seed = Number(await det.locator("[data-variant]").getAttribute("data-seed"));
  const spec = generator("la.det2").make(seed);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await det.locator("input[data-input]").fill(String(spec.answer));
  await det.getByRole("button", { name: "Проверить" }).click();
  await expect(summary).toHaveText(/Решено верно: 1 из\s3\./);
  await expect(set.locator("[data-set-lesson='foundations/linear-algebra/inverse-determinant'] [data-count]")).toHaveText("1");
});
