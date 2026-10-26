// Компаньон к конспекту CS229 (S5.03): список разделов, страница раздела — уроки всех курсов с галочкой «знаю»,
// разминка из итоговых проверок уроков математики, формулы раздела; axe.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

test("компаньон: раздел «Linear regression» — уроки, разминка, формулы", async ({ page }) => {
  await page.goto("/cs229/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Компаньон к конспекту CS229");
  await page.getByRole("link", { name: "Linear regression", exact: true }).click();
  await expect(page).toHaveURL(/\/cs229\/linear-regression\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Linear regression");
  // уроки двух курсов, галочка общая с курсом
  await expect(page.getByRole("heading", { level: 3, name: "Математика для машинного обучения" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "Основы машинного обучения" })).toBeVisible();
  const v1 = page.getByRole("checkbox", { name: /^Знаю: V\.1 / });
  await v1.check();
  expect(await page.evaluate(() => localStorage.getItem("mlf:marks"))).toContain("foundations/bridge/linear-regression");
  await expect(page.locator("[data-exercise-set] [data-exercise]")).toHaveCount(4);
  await expect(page.locator(".formula-card").first()).toBeVisible();
  await expectNoAxeViolations(page);
});
