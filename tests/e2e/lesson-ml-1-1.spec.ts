// Урок 1.1 «Основ ML»: входная проверка из 12 задач, ячейка Python (числа закреплены в code/tests/test_learning_problem.py),
// виджет «Обучение и тест», итоговая проверка ставит «знаю»; axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations, waitForIslands } from "./support";

const url = "/ml-basics/linear-models/learning-problem/";

test("урок 1.1: входная проверка, виджет, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Задача обучения: данные, модель, потери, обобщение");
  await expect(page.locator("[data-diagnostic] [data-diag-item]")).toHaveCount(12);
  await expect(page.locator("[data-diagnostic]")).toHaveAttribute("data-storage", "mlf:diagnostic:v1:ml-basics");

  // виджет гидратируется, когда виден (client:visible): сначала прокрутить к нему
  const w = page.locator(".train-test");
  await w.scrollIntoViewIfNeeded();
  await waitForIslands(page);
  const slider = w.getByRole("slider", { name: "степень" });
  await slider.fill("12");
  const train = Number((await w.locator(".kit-readout").nth(0).textContent())!.replace(/[^\d.]/g, ""));
  const testErr = Number((await w.locator(".kit-readout").nth(1).textContent())!.replace(/[^\d.]/g, ""));
  expect(testErr).toBeGreaterThan(train);
  await w.getByRole("button", { name: "200 объектов" }).click();
  await expect(w.getByRole("button", { name: "200 объектов" })).toHaveAttribute("aria-pressed", "true");

  const final = page.locator("#final-check");
  const spec = generator("ml.rmse-mae").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 1.1: ячейка Python — бейзлайн, площадь, все признаки", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "бейзлайн:         RMSE 3.501, MAE 2.930\nпо площади:       RMSE 1.215, MAE 0.984\nвсе признаки:     RMSE 0.818, MAE 0.655\nна обучении:      RMSE 0.795\n",
  );
});
