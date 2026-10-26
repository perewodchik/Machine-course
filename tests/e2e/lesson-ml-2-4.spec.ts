// Урок 2.4 «Основ ML»: виджет «Фолды» (k, новое разбиение, стратификация), ячейка Python (числа закреплены в
// code/tests/test_cross_val.py), итоговая проверка ставит «знаю»; axe.
import { expect, test, type Locator } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

const url = "/ml-basics/evaluation/model-selection/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("урок 2.4: фолды, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Выбор модели и кросс-валидация");
  const w = page.locator(".folds");
  await hydrated(w);
  await w.getByRole("button", { name: "k = 10" }).click();
  await expect(w.getByRole("button", { name: "k = 10" })).toHaveAttribute("aria-pressed", "true");
  await w.getByRole("button", { name: "Новое разбиение" }).click();
  await w.getByRole("checkbox", { name: /стратифицировать/ }).check();
  const counts = (await w.locator(".folds__pos").textContent())!.replace(/^[^:]*:\s*/, "").split(", ").map(Number);
  expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);

  const final = page.locator("#final-check");
  const spec = generator("ml.cv-se").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 2.4: ячейка Python — кросс-валидация с нуля", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 120_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "   λ     CV-MSE   ± SE\n" +
      "  0.1    0.649  0.102\n" +
      "    1    0.648  0.092\n" +
      "    3    0.661  0.079\n" +
      "   10    0.764  0.081\n" +
      "   30    1.167  0.172\n" +
      "  100    3.021  0.446\n" +
      "лучший λ = 1, по правилу одной SE — λ = 3\n" +
      "положительных по фолдам: просто [4, 0, 6, 4, 3], стратифицированно [4, 4, 3, 3, 3]\n" +
      "чистый шум: отбор по всей выборке — 0.86 верных, отбор внутри фолда — 0.42\n",
  );
});
