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
