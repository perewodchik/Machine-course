// Модуль I (S3.L1): урок I.1 — оболочка на рисунке переключается между плоскостью и прямой с клавиатуры,
// задача «лежит ли вектор в оболочке» разбирает параллельные векторы, итоговая проверка ставит «знаю». axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

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
