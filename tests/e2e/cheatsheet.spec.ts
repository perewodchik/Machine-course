// Шпаргалки (S5.04): по умолчанию видны только уроки с галочкой «знаю», флажок показывает все; страница печатается
// в PDF без шапки; axe.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

test("шпаргалка модуля «Статистика»: фильтр «знаю» и печать в PDF", async ({ page }) => {
  await page.goto("/cheatsheet/");
  await page.getByRole("link", { name: /Модуль IV\. Статистика/ }).click();
  await expect(page).toHaveURL(/\/cheatsheet\/statistics\/$/);
  const lessons = page.locator("[data-sheet-lesson]");
  const total = await lessons.count();
  expect(total).toBeGreaterThan(3);
  await expect(page.locator("[data-sheet-empty]")).toBeVisible();
  await expect(lessons.first()).toBeHidden();

  // отметить урок IV.3 «знаю» в оглавлении — он появляется в шпаргалке
  await page.evaluate(() => localStorage.setItem("mlf:marks", JSON.stringify({ schemaVersion: 2, marks: { "foundations/statistics/mle": { known: true, at: "2026-10-26T00:00:00Z", by: "learner" } } })));
  await page.reload();
  await expect(page.locator("[data-sheet-lesson]:visible")).toHaveCount(1);
  await expect(page.locator("[data-sheet-lesson='foundations/statistics/mle'] .sheet__formula").first()).toBeVisible();
  await expect(page.locator("[data-sheet-empty]")).toBeHidden();

  await page.getByLabel(/Только уроки с\s*галочкой «знаю»/).uncheck();
  await expect(page.locator("[data-sheet-lesson]:visible")).toHaveCount(total);
  await expectNoAxeViolations(page);

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".site-header")).toBeHidden();
  const pdf = await page.pdf({ format: "A4" });
  expect(pdf.byteLength).toBeGreaterThan(10_000);
});
