// Урок 1.2 «Основ ML»: виджет «Спуск по линиям уровня» (стандартизация поднимает порог шага, шаг выше порога
// расходится), ячейка Python (числа закреплены в code/tests/test_lms.py), уровень «Квартиры» игры «Порог
// расходимости», итоговая проверка ставит «знаю»; axe.
import { expect, test } from "@playwright/test";
import { divergence, solve } from "../../src/games/divergence/model";
import { rng } from "../../src/lib/math/rng";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations, waitForIslands } from "./support";

const url = "/ml-basics/linear-models/linear-regression-lms/";

test("урок 1.2: виджет спуска, итоговая проверка", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Линейная регрессия и LMS: пакетный и стохастический спуск");
  const w = page.locator(".lms-path");
  await w.scrollIntoViewIfNeeded();
  await waitForIslands(page);
  const limit = w.locator(".kit-readout").first();
  await expect(limit).toContainText("0.000411");
  await w.getByRole("button", { name: "стандартизованная" }).click();
  await expect(w.getByRole("button", { name: "стандартизованная" })).toHaveAttribute("aria-pressed", "true");
  await expect(limit).toContainText("2");
  await expect(w.locator(".lms-path__verdict")).toContainText("J = 0.2184");
  await w.getByRole("slider", { name: "α / порог" }).fill("1.1");
  await expect(w.locator(".lms-path__verdict")).toHaveText("Спуск расходится: шаг больше порога.");
  await w.getByRole("button", { name: "мини-батч" }).click();
  await expect(w.getByRole("slider", { name: "пакет |B|" })).toBeVisible();

  const final = page.locator("#final-check");
  const spec = generator("ml.step-scale").make(32);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок 1.2: ячейка Python — три спуска и веса на исходных признаках", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText(
    "порог шага 2/λmax: 1.075, число обусловленности: 12.7\n" +
      "градиент совпал с конечными разностями: True\n" +
      "пакетный      J = 0.3192 (минимум 0.3192), |θ − θ*| = 0.0000\n" +
      "SGD           J = 0.3258 (минимум 0.3192), |θ − θ*| = 0.0912\n" +
      "мини-батч 32  J = 0.3208 (минимум 0.3192), |θ − θ*| = 0.0343\n" +
      "веса на исходных признаках: [ 1.412  0.111  0.369  0.031 -0.06  -0.019]\n",
  );
});

test("игра «Порог расходимости»: уровни «Квартиры» до и после стандартизации", async ({ page }) => {
  for (const k of [6, 7]) {
    await page.goto(`/games/divergence/?seed=3&level=${k}`);
    await waitForIslands(page);
    const level = divergence.generate(rng(3 * 1000 + k - 1), k);
    const set = solve(divergence.init(level, rng(1)))[0]!;
    if (set.type !== "set") throw new Error("ожидался шаг");
    await page.getByRole("slider", { name: "η" }).fill(String(set.eta));
    await page.getByRole("button", { name: "Запустить спуск" }).click();
    await page.getByRole("button", { name: "Сдать шаг" }).click();
    await expect(page.locator(".game__debrief")).toContainText(k === 6 ? "такой маленький порог" : "Во сколько раз выросла граница шага");
  }
  await expectNoAxeViolations(page);
});
