// Урок 1.6 «Основ ML»: виджет «Конструктор GLM» (таблица по распределению, тождественный отклик у Пуассона даёт λ < 0),
// ячейка Python (числа закреплены в code/tests/test_glm.py), итоговая проверка ставит «знаю»; axe.
import { expect, test, type Locator } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

const url = "/ml-basics/linear-models/glm/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("урок 1.6: конструктор GLM, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Обобщённые линейные модели");
  const w = page.locator(".glm-builder");
  await hydrated(w);
  await expect(w.locator(".glm-builder__table")).toContainText("a(η) = exp η");
  await w.getByRole("button", { name: "Бернулли" }).click();
  await expect(w.locator(".glm-builder__table")).toContainText("сигмоида");
  await w.getByRole("button", { name: "Пуассон" }).click();
  await w.getByRole("checkbox", { name: /тождественный отклик/ }).check();
  await expect(w.locator(".glm-builder__warn")).toContainText("λ < 0");
  await w.getByRole("button", { name: "категориальное, k = 3" }).click();
  await expect(w.locator(".glm-builder__note")).toBeVisible();

  const final = page.locator("#final-check");
  const spec = generator("ml.poisson-predict").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 1.6: ячейка Python — пуассоновская регрессия", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "просмотров в среднем: 2.80, объявлений без просмотров: 18.5%\n" +
      "Ньютон: 6 итераций, θ = [ 1.506  0.122 -2.42   0.01 ]\n" +
      "градиент Xᵀ(y − λ) в максимуме равен нулю: True\n" +
      "ещё одно фото умножает прогноз на e^θ₁ = 1.130\n" +
      "отрицательных прогнозов: у линейной 7.8%, у пуассоновской 0.0%\n",
  );
});
