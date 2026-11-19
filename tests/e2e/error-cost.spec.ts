// «Цена ошибки» (S7.04): в игре 0.5 на кредитах дорог, лучший порог принимается, журнал; axe.
// Виджет порога в уроке 2.1 («Порог: кривые и цена», threshold-lab) проверяет lesson-ml-2-1.spec.ts.
import { expect, test } from "@playwright/test";
import { rng } from "../../src/lib/math/rng";
import { best, errorCost } from "../../src/games/error-cost/model";
import { expectNoAxeViolations, waitForIslands } from "./support";

test("игра: порог 0.5 на кредитах не принят, лучший — принят, журнал", async ({ page }) => {
  const SEED = 4;
  await page.goto(`/games/error-cost/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: кредиты/);
  await page.getByRole("button", { name: "Сдать порог" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("не принят");
  const b = best(errorCost.generate(rng(SEED * 1000), 1));
  await page.getByRole("slider", { name: "t" }).fill(String(b.t));
  await page.getByRole("button", { name: "Сдать порог" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("Принято!");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "ml.error-cost", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
