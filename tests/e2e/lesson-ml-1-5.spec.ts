// Урок 1.5 «Основ ML»: виджет «Перцептрон» (разделимые — эпохи [2, 0], неразделимые — не останавливается), виджет
// «Области классов» (сдвиг всех θ ничего не меняет, оптимум — 87 %), ячейка Python (числа закреплены в
// code/tests/test_softmax.py), итоговая проверка ставит «знаю»; axe.
import { expect, test, type Locator } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

const url = "/ml-basics/linear-models/perceptron-softmax/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("урок 1.5: перцептрон, области классов, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Перцептрон и многоклассовая классификация");
  const pc = page.locator(".perceptron");
  await hydrated(pc);
  await pc.getByRole("button", { name: "Эпоха целиком" }).click();
  await pc.getByRole("button", { name: "Эпоха целиком" }).click();
  await expect(pc.locator(".perceptron__history")).toContainText("Поправок по эпохам: 2, 0 — эпоха без ошибок");
  await pc.getByRole("button", { name: "бизнес или нет" }).click();
  for (let i = 0; i < 3; i++) await pc.getByRole("button", { name: "Эпоха целиком" }).click();
  await expect(pc.getByRole("button", { name: "Эпоха целиком" })).toBeEnabled();

  const cr = page.locator(".class-regions");
  await hydrated(cr);
  await cr.getByRole("button", { name: "К оптимуму" }).click();
  await expect(cr.locator(".kit-readout").nth(1)).toContainText("87");
  const before = await cr.locator(".kit-readout").first().textContent();
  await cr.getByRole("button", { name: "Сдвинуть все θ" }).click();
  await expect(cr.locator(".kit-readout").first()).toHaveText(before!);

  const final = page.locator("#final-check");
  const spec = generator("ml.softmax-prob").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 1.5: ячейка Python — перцептрон и softmax", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "эконом против бизнеса, ошибок по эпохам: [2, 0]\n" +
      "бизнес против остальных, последние эпохи: [29, 27, 28, 29, 27]\n" +
      "градиент совпал с конечными разностями: True\n" +
      "J = 0.2702, доля верных: 0.870\n" +
      "вероятности первой квартиры: [0.562 0.438 0.   ]  после сдвига всех θ_j: [0.562 0.438 0.   ]\n",
  );
});
