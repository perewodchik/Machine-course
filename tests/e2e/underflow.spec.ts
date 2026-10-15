// «Underflow» (урок 0.5): прогноз выставляется с клавиатуры, «Перемножить» показывает ноль на объекте 1075
// (0.5ⁿ во float64), в «сравнении» ноль не различает модели, а суммы логарифмов — различают. axe.
import { expect, test } from "@playwright/test";
import { better, underflow } from "../../src/games/underflow/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 3;

test("монетка: прогноз 1075 с клавиатуры точный, журнал", async ({ page }) => {
  await page.goto(`/games/underflow/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: монетка/);
  await expectNoAxeViolations(page);
  const slider = page.getByRole("slider", { name: "n" });
  await slider.focus();
  // с 100: Page Up — десятая часть шкалы (+200), стрелка — шаг (+5)
  for (let k = 0; k < 4; k++) await page.keyboard.press("PageUp");
  await expect(slider).toHaveAttribute("aria-valuetext", "n = 900");
  for (let k = 0; k < 35; k++) await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuetext", "n = 1075");
  await page.getByRole("button", { name: "Перемножить" }).click();
  await expect(page.locator(".game__feedback")).toHaveText("Произведение стало нулём на объекте 1075. Прогноз точный.");
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "prob.underflow", seed: SEED, level: 1, solved: true, hints: 0 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("сравнение: «не различить» не принимается, после логарифмов выбирается лучшая модель", async ({ page }) => {
  await page.goto(`/games/underflow/?seed=${SEED}&level=5`);
  await waitForIslands(page);
  const level = underflow.generate(rng(SEED * 1000 + 4), 5);
  await page.getByRole("button", { name: "Не различить" }).click();
  await expect(page.locator(".game__feedback")).toContainText("По произведениям — не различить");
  await page.getByRole("button", { name: "Посчитать суммы логарифмов" }).click();
  await expect(page.locator(".game__legend")).toContainText("модель B");
  await page.getByRole("button", { name: `Лучше ${better(level)}` }).click();
  await expect(page.locator(".game__feedback")).toHaveText(`Верно: у модели ${better(level)} сумма логарифмов больше — значит, больше и правдоподобие.`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
