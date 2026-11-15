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
    "доля откликов: 0.105; «никому не звонить» верно в 89.5% случаев\n" +
      "порог 0.5: {'tp': 73, 'fp': 31, 'fn': 242, 'tn': 2654}, доля верных 0.909, точность 0.702, полнота 0.232\n" +
      "AUC трапециями: 0.8094, по парам: 0.8094; AP: 0.4492\n" +
      "Брайер: 0.0744, у оценок в кубе: 0.0898, AUC у куба: 0.8094\n" +
      "порог t* = 0.05: цена 10700, при пороге 0.5: 23145\n" +
      "надёжность (оценка → доля): 0.05→0.04 0.14→0.14 0.24→0.25 0.35→0.31 0.45→0.44\n",
  );
});
