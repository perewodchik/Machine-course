// Входная диагностика (S3.01, урок 0.2): задачи по одной, верный ответ ставит «знаю» (by: diagnostic),
// неверный пропускает задачи уроков, которые на него опираются; итог и маршрут; ход сохраняется; axe.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

const url = "/foundations/start/how-the-course-works/";

/** Текущая задача диагностики. */
const current = (page: Page) => page.locator("[data-diag-item]:not([hidden])");

/** Ответ задачи из данных для проверки, которые сервер кладёт рядом с ней. */
async function answer(item: Locator, right: boolean): Promise<void> {
  const variant = item.locator("[data-variant]:not([hidden])");
  const data = JSON.parse((await variant.locator("script[data-answer]").textContent()) ?? "{}") as
    | { kind: "numeric"; answer: number }
    | { kind: "choice"; correct: boolean[] }
    | { kind: "matrix"; answer: number[][] };
  if (data.kind === "numeric") {
    await variant.locator("input[data-input]").fill(String(right ? data.answer : data.answer + 7));
    await item.getByRole("button", { name: "Проверить" }).click();
  } else if (data.kind === "choice") {
    const i = data.correct.findIndex((c) => c === right);
    await variant.locator(`[data-option="${i}"]`).click();
  } else {
    const cells = variant.locator("input[data-cell]");
    for (let k = 0; k < (await cells.count()); k++) {
      const [r, c] = ((await cells.nth(k).getAttribute("data-cell")) ?? "0,0").split(",").map(Number);
      await cells.nth(k).fill(String(data.answer[r!]![c!]! + (right ? 0 : 1)));
    }
    await item.getByRole("button", { name: "Проверить" }).click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("верный ответ ставит «знаю», неверный пропускает зависимые задачи; итог и маршрут", async ({ page }) => {
  await page.getByRole("button", { name: "Начать диагностику" }).click();
  await expect(current(page)).toHaveAttribute("data-diag-item", "foundations/start/language-of-math");
  await expect(page.locator("[data-diag-count]")).toHaveText("Задача 1");
  // подсказок в диагностике нет
  await expect(current(page).locator("[data-hint-next]")).toBeHidden();

  await answer(current(page), true);
  await current(page).getByRole("button", { name: "Следующая задача" }).click();
  await expect(current(page)).toHaveAttribute("data-diag-item", "foundations/start/sums-products-indicators");
  await expect(current(page)).toBeFocused();

  await answer(current(page), false);
  await current(page).getByRole("button", { name: "Следующая задача" }).click();
  // 0.5 и 0.8 опираются на неверно решённую 0.4 — пропущены; 0.6 опирается на пропущенную 0.5 — её спрашивают
  await expect(current(page)).toHaveAttribute("data-diag-item", "foundations/start/derivative-refresher");

  // остальное — «Не знаю», пока задачи не кончатся
  for (let i = 0; i < 12 && (await current(page).count()); i++) await current(page).getByRole("button", { name: "Не знаю" }).click();
  const result = page.locator("[data-diag-result]");
  await expect(result).toBeVisible();
  await expect(result).toBeFocused();
  await expect(result.locator("[data-diag-summary]")).toContainText("Верно решено 1 из");
  await expect(result.locator("[data-diag-known]:not([hidden])")).toHaveText(["0.3. Язык математики: множества, отображения, кванторы"]);
  await expect(result.locator("[data-diag-route]:not([hidden])").first()).toHaveText(/^0\.4\. /);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:marks") ?? "{}"));
  expect(stored.marks["foundations/start/language-of-math"]).toMatchObject({ known: true, by: "diagnostic" });
  expect(stored.marks["foundations/start/sums-products-indicators"]).toBeUndefined();
  const diag = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:diagnostic:v1") ?? "{}"));
  expect(diag.outcomes).toMatchObject({ "foundations/start/exp-log-sigmoid": "skipped", "foundations/start/numpy-minimum": "skipped" });
  await expectNoAxeViolations(page);

  // после перезагрузки — сразу итог
  await page.reload();
  await expect(page.getByText("Диагностика пройдена раньше: итог ниже.")).toBeVisible();
  await expect(page.locator("[data-diag-result]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Начать диагностику" })).toBeHidden();
});

test("прерванная диагностика продолжается с того же места", async ({ page }) => {
  await page.getByRole("button", { name: "Начать диагностику" }).click();
  await answer(current(page), true);
  await page.reload();
  await page.getByRole("button", { name: "Продолжить диагностику" }).click();
  await expect(current(page)).toHaveAttribute("data-diag-item", "foundations/start/sums-products-indicators");
  await expect(page.locator("[data-diag-count]")).toHaveText("Задача 2");
});
