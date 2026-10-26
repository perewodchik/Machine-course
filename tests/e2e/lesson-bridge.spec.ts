// Урок V.2: задачи по фрагментам выводов (банк S5.01) — «найди ошибку» с разбором подложенной ошибки, «какое правило»,
// итоговая проверка ставит «знаю»; axe.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

test("урок V.2: найди ошибку, какое правило, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/bridge/math-in-ml/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Итоговая проверка: математика в выводах ML");
  await expect(page.locator("[data-exercise]")).toHaveCount(20);

  // «найди ошибку» в гессиане: подменена строка 3 — потеряны веса D
  const err = page.locator("[data-exercise][data-item='f.logistic-hessian:error:3']");
  await err.locator("[data-option]").filter({ hasText: "Строка 2" }).click();
  await expect(err.locator("[data-feedback]")).toContainText("Строка 2 верна");
  await err.locator("[data-option]").filter({ hasText: "Строка 3" }).click();
  await expect(err.locator("[data-feedback]")).toContainText("Потеряны веса");

  // «какое правило»: переход в EM — неравенство Йенсена, то есть выпуклость
  const rule = page.locator("[data-exercise][data-item='f.em-jensen:rule:3']");
  await rule.locator("[data-option]").filter({ hasText: /^Выпуклость$/ }).click();
  await expect(rule.locator("[data-feedback]")).toContainText("Логарифм вогнут");

  // итоговая проверка: восстановить градиент по W; неверный вариант — с разбором подложенной ошибки
  const final = page.locator("#final-check");
  const right = await correctIndex(final);
  await final.locator("[data-option]").nth(right === 0 ? 1 : 0).click();
  await expect(final.locator("[data-feedback]")).toContainText(/Пропущена производная|Порядок множителей/);
  await expect(final.locator("[data-feedback]")).not.toContainText("Урок отмечен");
  await final.locator("[data-option]").nth(right).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

/** Номер верного варианта из данных проверки (их кладёт на страницу Exercise.astro). */
async function correctIndex(ex: import("@playwright/test").Locator): Promise<number> {
  const data = JSON.parse((await ex.locator("script[data-answer]").first().textContent()) ?? "{}");
  return (data.correct as boolean[]).indexOf(true);
}
