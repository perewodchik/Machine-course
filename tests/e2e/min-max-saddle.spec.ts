// «Минимум, максимум или седло» (урок II.4): на уровне «по картинке» ошибка разобрана, остальные карточки — верно,
// журнал партии; на уровне «вырожденный гессиан» — ответ «по гессиану не определить» и разбор уровня. axe.
import { expect, test } from "@playwright/test";
import { classify, KIND_NAMES, minMaxSaddle } from "../../src/games/min-max-saddle/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => minMaxSaddle.generate(rng(SEED * 1000 + k - 1), k);

test("по картинке: ошибка с разбором, три верных ответа, журнал", async ({ page }) => {
  await page.goto(`/games/min-max-saddle/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: по картинке/);
  await expectNoAxeViolations(page);

  const level = levelOf(1);
  for (const [i, card] of level.cards.entries()) {
    const kind = classify(card.H);
    const answer = i === 0 ? (kind === "saddle" ? "min" : "saddle") : kind;
    await page.getByRole("button", { name: KIND_NAMES[answer], exact: true }).press("Enter");
    await expect(page.locator(".game__feedback")).toContainText(i === 0 ? "Неверно" : "Верно");
    await page.getByRole("button", { name: /^(Дальше|Закончить уровень)$/ }).press("Enter");
  }
  await expect(page.locator(".game__feedback")).toHaveText("Уровень пройден: верно с первого раза 3 из 4.");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "calc.min-max-saddle", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("вырожденный гессиан: «по гессиану не определить» и разбор уровня", async ({ page }) => {
  await page.goto(`/games/min-max-saddle/?seed=${SEED}&level=4`);
  await waitForIslands(page);
  for (const card of levelOf(4).cards) {
    await page.getByRole("button", { name: KIND_NAMES[classify(card.H)], exact: true }).click();
    await page.getByRole("button", { name: /^(Дальше|Закончить уровень)$/ }).click();
  }
  await expect(page.locator(".game__feedback")).toHaveText("Уровень пройден: верно с первого раза 4 из 4.");
  await expect(page.locator(".game__debrief")).toContainText("Почему при det H = 0 гессиан не даёт ответа?");
});
