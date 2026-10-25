// Страница прогресса (S4.01): пустой журнал — подсказка; ответ на итоговую проверку с отметкой «уверен» попадает
// в таблицу; урок, где «уверен» часто ошибается, — в списке с ссылками «Ещё задача» на итоговую проверку. axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

test("калибровка: пусто → ответ с отметкой «уверен» → таблица", async ({ page }) => {
  await page.goto("/progress/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Прогресс и калибровка");
  await expect(page.locator("[data-calibration-empty]")).toBeVisible();

  await page.goto("/foundations/linear-algebra/capstone-least-squares/");
  const final = page.locator("#final-check");
  await final.getByRole("radio", { name: "уверен" }).check();
  const spec = generator("la.normal-eq").make(31);
  if (spec.kind !== "matrix") throw new Error("ожидалась матрица");
  for (const [i, row] of spec.answer.entries()) for (const [j, v] of row.entries()) await final.locator(`[data-variant]:not([hidden]) [data-cell="${i},${j}"]`).fill(String(v));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");

  await page.goto("/progress/");
  await expect(page.locator("[data-calibration-empty]")).toBeHidden();
  const sure = page.locator('tr[data-level="3"]');
  await expect(sure.locator("[data-n]")).toHaveText("1");
  await expect(sure.locator("[data-rate]")).toHaveText("1 — 100 %");
  await expect(page.locator("[data-calibration-verdict]")).toContainText("хотя бы три ответа");
});

test("завышенная уверенность: урок в списке, «Ещё задача» ведёт к итоговой проверке", async ({ page }) => {
  await page.goto("/progress/");
  await page.evaluate(() => {
    const at = new Date().toISOString();
    const lesson = "foundations/linear-algebra/eigen";
    const ev = (seed: number, correct: boolean, confidence: number) => ({ type: "attempt", lesson, item: "la.eigvals2", seed, attempt: 1, correct, hints: 0, ms: 9000, confidence, at });
    localStorage.setItem("mlf:journal:v1", JSON.stringify([ev(1, false, 3), ev(2, false, 3), ev(3, true, 3), ev(4, true, 1), ev(5, false, 2)]));
  });
  await page.reload();
  await expect(page.locator("[data-calibration-verdict]")).toContainText("только в 33\u00a0%");
  const list = page.locator("[data-overconfident]");
  await expect(list).toBeVisible();
  await expect(list.getByRole("link", { name: "I.9 Собственные значения и векторы" })).toHaveAttribute("href", "/foundations/linear-algebra/eigen/");
  await expect(list.getByRole("link", { name: "Ещё задача" })).toHaveAttribute("href", "/foundations/linear-algebra/eigen/#final-check");
  await expectNoAxeViolations(page);
});
