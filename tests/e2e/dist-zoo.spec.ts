// «Зоопарк распределений» (урок III.6): на первом уровне одна ошибка с разбором, остальные верно, журнал партии;
// уровень «по форме» — рисунок и разбор уровня. axe.
import { expect, test } from "@playwright/test";
import { distZoo, FAMILY_NAMES } from "../../src/games/dist-zoo/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => distZoo.generate(rng(SEED * 1000 + k - 1), k);

test("успехи и неудачи: ошибка с разбором, четыре верных, журнал", async ({ page }) => {
  await page.goto(`/games/dist-zoo/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: успехи и неудачи/);
  await expectNoAxeViolations(page);
  for (const [i, card] of levelOf(1).cards.entries()) {
    const answer = i === 0 ? (card.family === "binomial" ? "geometric" : "binomial") : card.family;
    await page.getByRole("button", { name: FAMILY_NAMES[answer], exact: true }).press("Enter");
    await expect(page.locator(".game__feedback")).toContainText(i === 0 ? "Неверно" : "Верно");
    await page.getByRole("button", { name: /^(Дальше|Закончить уровень)$/ }).press("Enter");
  }
  await expect(page.locator(".game__feedback")).toHaveText("Уровень пройден: верно с первого раза 4 из 5.");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "prob.dist-zoo", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("по форме: рисунок со столбиками, разбор уровня", async ({ page }) => {
  await page.goto(`/games/dist-zoo/?seed=${SEED}&level=4`);
  await waitForIslands(page);
  await expect(page.locator(".game__figure svg")).toBeVisible();
  for (const card of levelOf(4).cards) {
    await page.getByRole("button", { name: FAMILY_NAMES[card.family], exact: true }).click();
    await page.getByRole("button", { name: /^(Дальше|Закончить уровень)$/ }).click();
  }
  await expect(page.locator(".game__debrief")).toContainText("Как узнать семейство по форме функции вероятности?");
});
