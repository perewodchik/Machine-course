// Урок 1.4 «Основ ML»: виджет «Сигмоида над плоскостью» («К максимуму» — числа ячейки), виджет «Подъём против
// Ньютона» (8 итераций против 1445 и 11 261), ячейка Python (числа закреплены в code/tests/test_logistic.py),
// игра «Честная вероятность», итоговая проверка ставит «знаю»; axe.
import { expect, test, type Locator } from "@playwright/test";
import { honest, solve } from "../../src/games/honest-probability/model";
import { rng } from "../../src/lib/math/rng";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations, waitForIslands } from "./support";

const url = "/ml-basics/linear-models/logistic-regression/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("урок 1.4: два виджета, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Логистическая регрессия и метод Ньютона");
  const w = page.locator(".logistic-plane");
  await hydrated(w);
  await w.getByRole("button", { name: "К максимуму" }).click();
  await expect(w.locator(".kit-readout").nth(1)).toContainText("96.5");
  await w.getByRole("button", { name: "Выброс у метро" }).click();
  await expect(w.getByRole("button", { name: "Выброс у метро" })).toHaveAttribute("aria-pressed", "true");

  const a = page.locator(".ascent-newton");
  await hydrated(a);
  await expect(a.locator(".kit-readout").nth(0)).toContainText("8");
  await expect(a.locator(".kit-readout").nth(1)).toContainText("1445");
  await a.getByRole("button", { name: "площадь ÷ 3" }).click();
  await expect(a.locator(".kit-readout").nth(1)).toContainText("11261");
  await expect(a.locator(".kit-readout").nth(0)).toContainText("8");

  const final = page.locator("#final-check");
  const spec = generator("ml.logistic-prob").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 1.4: ячейка Python — Ньютон и подъём", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "градиент совпал с конечными разностями: True\n" +
      "Ньютон:      8 итераций, θ = [-0.422  7.418 -1.033]\n" +
      "подъём:   2978 итераций, θ = [-0.422  7.418 -1.033]\n" +
      "ℓ/n в максимуме: -0.1105, доля верных: 0.965\n" +
      "вероятности первых трёх: [0.043 0.91  0.999]  при 10θ: [0. 1. 1.]\n",
  );
});

test("игра «Честная вероятность»: догадка, ручки, сдача; разбор разделимых данных", async ({ page }) => {
  for (const k of [1, 4]) {
    await page.goto(`/games/honest-probability/?seed=2&level=${k}`);
    await waitForIslands(page);
    const level = honest.generate(rng(2 * 1000 + k - 1), k);
    const [guess, set] = solve(honest.init(level, rng(1)));
    if (guess!.type !== "guess" || set!.type !== "set") throw new Error("ожидались догадка и ручки");
    await page.getByRole("slider", { name: "догадка" }).fill(String(Math.round(guess.b / 0.05) * 0.05));
    await page.getByRole("button", { name: "Отметить догадку" }).click();
    if (set.b !== undefined) await page.getByRole("slider", { name: "граница b" }).fill(String(Math.round(set.b / 0.05) * 0.05));
    await page.getByRole("slider", { name: "крутизна k" }).fill(String(Math.round(set.k! * 10) / 10));
    await page.getByRole("button", { name: "Сдать модель" }).click();
    await expect(page.locator(".game__debrief")).toContainText(k === 4 ? "нет лучшей крутизны" : "лучшая крутизна не бесконечная");
  }
  await expectNoAxeViolations(page);
});
