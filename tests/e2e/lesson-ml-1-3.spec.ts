// Урок 1.3 «Основ ML»: виджет «Гибкость модели» (полином и LWR, числа — как в ячейке), ячейка Python (числа закреплены
// в code/tests/test_features_lwr.py), итоговая проверка ставит «знаю»; axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations, waitForIslands } from "./support";

const url = "/ml-basics/linear-models/features-lwr/";

test("урок 1.3: виджет «Гибкость модели», итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Признаки, полиномы и локально взвешенная регрессия");
  const w = page.locator(".flexibility");
  await w.scrollIntoViewIfNeeded();
  await waitForIslands(page);
  await w.getByRole("slider", { name: "степень p" }).fill("4");
  await expect(w.locator(".kit-readout").nth(1)).toContainText("11.98");
  await w.getByRole("button", { name: "локально взвешенная" }).click();
  await w.getByRole("slider", { name: "lg τ" }).fill("0");
  await expect(w.locator(".kit-readout").nth(2)).toContainText("12.25");
  await w.getByRole("slider", { name: "запрос x" }).fill("30");
  await expect(w.locator(".kit-readout").first()).toContainText("1.00");

  const final = page.locator("#final-check");
  const spec = generator("ml.lwr-weight").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 1.3: ячейка Python — степени, окна и предел LWR", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  const out = await cell.locator("[data-py-output]").textContent();
  expect(out).toContain("     4       10.55      11.98\n");
  expect(out).toContain("     1        9.17      12.25\n");
  expect(out).toContain("LWR при τ = 10⁵ в 20 мин: 222.056  прямая МНК: 222.056\n");
});
