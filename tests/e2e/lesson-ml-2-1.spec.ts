// Урок 2.1 «Основ ML»: виджет «Порог: кривые и цена» (порог к минимуму стоимости, искажение не меняет AUC), ячейка
// Python (числа закреплены в code/tests/test_classification_metrics.py), итоговая проверка ставит «знаю»; axe.
import { expect, test, type Locator } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

const url = "/ml-basics/evaluation/classification-metrics/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

const readout = (w: Locator, name: string) => w.locator(".kit-readout").filter({ hasText: name }).first();

test("урок 2.1: виджет порога, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Метрики классификации: порог, ROC, PR, калибровка");
  const w = page.locator(".threshold-lab");
  await hydrated(w);
  await expect(readout(w, "t*")).toContainText("0.167");
  await w.getByRole("button", { name: "Порог к минимуму стоимости" }).click();
  await expect(w.getByRole("slider", { name: "порог t" })).not.toHaveValue("0.5");
  const auc = await readout(w, "AUC").textContent();
  const brier = Number((await readout(w, "Брайер").textContent())!.replace(/[^\d.]/g, ""));
  await w.getByRole("checkbox", { name: /исказить оценки/ }).check();
  await expect(readout(w, "AUC")).toHaveText(auc!);
  await expect.poll(async () => Number((await readout(w, "Брайер").textContent())!.replace(/[^\d.]/g, ""))).toBeGreaterThan(brier);

  const final = page.locator("#final-check");
  const spec = generator("ml.precision-prevalence").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 2.1: ячейка Python — метрики с нуля", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "доля откликов: 0.116; «никому не звонить» верно в 88.4% случаев\n" +
      "порог 0.5: {'tp': 65, 'fp': 33, 'fn': 282, 'tn': 2620}, доля верных 0.895, точность 0.663, полнота 0.187\n" +
      "AUC трапециями: 0.7361, по парам: 0.7361; AP: 0.3653\n" +
      "Брайер: 0.0884, у оценок в кубе: 0.1048, AUC у куба: 0.7361\n" +
      "порог t* = 0.05: цена 12040, при пороге 0.5: 26955\n" +
      "надёжность (оценка → доля): 0.05→0.06 0.14→0.13 0.21→0.30 0.37→0.20 0.48→0.43\n",
  );
});
