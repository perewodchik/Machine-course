// Урок 2.2 «Основ ML»: виджет «Облако моделей» (n ×4 сжимает разброс), ячейка Python (числа закреплены в
// code/tests/test_bias_variance.py), игра «Переобучи, если сможешь: облако», итоговая проверка ставит «знаю»; axe.
import { expect, test, type Locator } from "@playwright/test";
import { bestDegree, overfitCloud } from "../../src/games/overfit-cloud/model";
import { rng } from "../../src/lib/math/rng";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations, waitForIslands } from "./support";

const url = "/ml-basics/evaluation/bias-variance/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}
const num = async (l: Locator) => Number((await l.textContent())!.replace(/[^\d.]/g, ""));

test("урок 2.2: облако моделей, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Смещение и разброс");
  const w = page.locator(".model-cloud");
  await hydrated(w);
  const variance = w.locator(".kit-readout").filter({ hasText: /^разброс =/ }).first();
  const before = await num(variance);
  await w.getByRole("slider", { name: "n" }).fill("120");
  await expect.poll(() => num(variance)).toBeLessThan(before / 2);

  const final = page.locator("#final-check");
  const spec = generator("ml.ols-variance").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 2.2: ячейка Python — смещение, разброс, σ²d/n", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "степень  смещение²  разброс   σ²+смещ²+разбр  ошибка на свежих\n" +
      "      1     0.0787   0.0137          0.1824            0.1778\n" +
      "      3     0.0008   0.0159          0.1067            0.1046\n" +
      "      5     0.0003   0.0417          0.1320            0.1285\n" +
      "      9     0.0639   6.0815          6.2354            5.4400\n" +
      "степень 1: средний разброс в обучающих точках 0.0059, σ²d/n = 0.0060\n" +
      "степень 5: средний разброс в обучающих точках 0.0180, σ²d/n = 0.0180\n",
  );
});

test("игра «облако»: лучшая степень принята, разбор малых данных", async ({ page }) => {
  for (const k of [2, 4]) {
    await page.goto(`/games/overfit-cloud/?seed=2&level=${k}`);
    await waitForIslands(page);
    const level = overfitCloud.generate(rng(2 * 1000 + k - 1), k);
    await page.getByRole("slider", { name: "степень" }).fill(String(bestDegree(level)));
    await page.getByRole("button", { name: "Сдать степень" }).click();
    await expect(page.locator(".game__debrief")).toContainText(k === 4 ? "десяти точках" : "баланс смещения и разброса");
  }
  await expectNoAxeViolations(page);
});
