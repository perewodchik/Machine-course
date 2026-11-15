// Урок 2.5 «Основ ML»: виджет «Кривые обучения» (диагноз и лечение), ячейка Python (числа закреплены в
// code/tests/test_ml_practice.py), игра «Найди утечку», итоговая проверка урока ставит «знаю», итоговая проверка
// модуля 2 — 14 задач; без горизонтальной прокрутки; axe.
import { expect, test, type Locator } from "@playwright/test";
import { findLeak } from "../../src/games/find-leak/model";
import { rng } from "../../src/lib/math/rng";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations, waitForIslands } from "./support";

const url = "/ml-basics/evaluation/ml-practice/";

async function hydrated(widget: Locator) {
  await widget.scrollIntoViewIfNeeded();
  await expect(widget.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
}

test("урок 2.5: кривые обучения, итоговая проверка, модуль 2", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Кривые обучения, анализ ошибок и утечки");
  const w = page.locator(".learning-curves");
  await hydrated(w);
  await w.getByRole("button", { name: "смещение" }).click();
  await expect(w.locator(".learning-curves__verdict")).toContainText("Верно");
  await w.getByRole("button", { name: "Степень +2" }).click();
  await expect(w.locator(".learning-curves__verdict")).toHaveCount(0);

  await expect(page.locator(".exercise-set [data-summary]")).toHaveAttribute("data-total", "14");

  const final = page.locator("#final-check");
  const spec = generator("ml.slice-gain").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 2.5: ячейка Python — кривые, срезы, абляция, утечка", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 120_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "только площадь  обучение: 0.97 1.21 1.13 1.16 1.28 1.31 | валидация: 1.55 1.33 1.33 1.33 1.32 1.32\n" +
      "все признаки    обучение: 0.17 0.33 0.55 0.54 0.62 0.66 | валидация: 1.99 1.48 0.86 0.75 0.67 0.67\n" +
      "срезы площади: доля [0.25 0.36 0.22 0.18] MSE [0.73 0.71 0.7  0.82] вклад [0.182 0.253 0.15  0.148]\n" +
      "без этажа: ΔMSE = 0.048 ± 0.012\n" +
      "без метро: ΔMSE = 0.434 ± 0.030\n" +
      "с «ценой за м²»: CV-MSE 0.1931 против 0.667 без неё\n",
  );
});

test("игра «Найди утечку»: неверный выбор объяснён, верный завершает уровень", async ({ page }) => {
  await page.goto("/games/find-leak/?seed=2&level=1");
  await waitForIslands(page);
  const level = findLeak.generate(rng(2 * 1000), 1);
  const wrong = level.candidates.find((c) => c.id !== level.answer)!;
  const right = level.candidates.find((c) => c.id === level.answer)!;
  await page.getByRole("button", { name: new RegExp(wrong.text) }).click();
  await expect(page.locator(".game__feedback")).toContainText("Не здесь.");
  await page.getByRole("button", { name: new RegExp(right.text) }).click();
  await expect(page.locator(".game__debrief")).toContainText("Как увидеть такую утечку");
  await expectNoAxeViolations(page);
});
