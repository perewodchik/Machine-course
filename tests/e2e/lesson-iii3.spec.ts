// Урок III.3 (S2.08): сетка из 1000 человек (счёт групп, порядок «по тесту», бегунок), ячейка с симуляцией,
// итоговая проверка ставит «знаю», axe.
import { expect, test, type Locator } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

const url = "/foundations/probability/bayes/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("сетка: 98 положительных, из них 9 больных; порядок «по тесту»; бегунок меняет базовую частоту", async ({ page }) => {
  await page.goto(url);
  const grid = page.locator(".bayes-grid");
  await hydrated(grid);
  // рисунок под вопросом «Предскажите»: доля больных скрыта до первого действия
  await expect(grid.locator(".bayes-grid__summary")).toContainText("Положительных: 98. Какая доля из них больна?");
  await expect(grid.getByText("P(болен | +)")).toHaveCount(0);
  await grid.getByRole("button", { name: "Показать долю" }).click();
  await expect(grid.locator(".bayes-grid__summary")).toContainText("Положительных: 98, из них больны 9");
  await expect(grid.locator("svg:visible .bayes-grid__cell--tp")).toHaveCount(9);
  await grid.getByRole("radio", { name: "по результату теста" }).check();
  // положительные — первыми: первые 98 квадратов залиты
  const first = await grid.locator("svg:visible rect").evaluateAll((els) => els.slice(0, 98).every((e) => /--(tp|fp)/.test(e.getAttribute("class") ?? "")));
  expect(first).toBe(true);
  const prevalence = grid.getByRole("slider", { name: "P(болен)" });
  await prevalence.fill("0.092");
  await expect(grid.locator("[aria-live]")).toContainText("P(болен | +) = 50");
  await expectNoAxeViolations(page);
});

test("ячейка: симуляция совпадает с формулой — числа закреплены в code/tests/test_bayes.py", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "по формуле Байеса: 0.092\nпо симуляции:      0.092\nположительных: 9880 из них больны: 905\n",
  );
});

test("итоговая проверка ставит «знаю»; без горизонтальной прокрутки", async ({ page }) => {
  await page.goto(url);
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("prob.bayes-test").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer).replace(".", ","));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.getByRole("status")).toContainText("Урок отмечен: «знаю».");
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
});
