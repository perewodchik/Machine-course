// Урок 2.3 «Основ ML»: виджет «Путь регуляризации» (L1 при сильном штрафе зануляет веса, L2 — нет), ячейка Python
// (числа закреплены в code/tests/test_regularization.py), итоговая проверка ставит «знаю»; axe.
import { expect, test, type Locator } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

const url = "/ml-basics/evaluation/regularization/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("урок 2.3: путь регуляризации, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Регуляризация: L2 и L1");
  const w = page.locator(".reg-path");
  await hydrated(w);
  const nonzero = w.locator(".kit-readout").filter({ hasText: "ненулевых весов" });
  await w.getByRole("slider", { name: "lg λ" }).fill("0.6");
  await expect(nonzero).toContainText("= 0");
  await w.getByRole("button", { name: "L2 (гребневая)" }).click();
  await expect(nonzero).toContainText("= 5");
  await w.getByRole("checkbox", { name: /без стандартизации/ }).check();

  const final = page.locator("#final-check");
  const spec = generator("ml.shrink-orth").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 2.3: ячейка Python — лассо и гребневая с нуля", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 120_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "лассо λ = 0.01: ненулевых весов 22 из 25, шумовых 17, RMSE на проверке 0.791\n" +
      "лассо λ = 0.05: ненулевых весов  5 из 25, шумовых  0, RMSE на проверке 0.787\n" +
      "лассо λ =  0.2: ненулевых весов  5 из 25, шумовых  0, RMSE на проверке 0.874\n" +
      "гребневая λ = 10: ненулевых весов 25 из 25, наибольший шумовой |θ| = 0.051\n" +
      "входят в модель по очереди: площадь (3.23), комнат (0.73), метро (0.67), возраст (0.36), этаж (0.21)\n",
  );
});
