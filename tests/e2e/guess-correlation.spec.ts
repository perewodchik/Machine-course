// «Угадай корреляцию» (урок III.9): на первом уровне одна ошибка с разбором, остальные верно, журнал партии;
// уровень «ловушки» — разбор про некоррелированность и независимость. axe.
import { expect, test } from "@playwright/test";
import { guessCorrelation, optionText } from "../../src/games/guess-correlation/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => guessCorrelation.generate(rng(SEED * 1000 + k - 1), k);

test("знак: ошибка с разбором, четыре верных, журнал", async ({ page }) => {
  await page.goto(`/games/guess-correlation/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: знак/);
  await expect(page.locator(".game__figure svg")).toBeVisible();
  await expectNoAxeViolations(page);
  for (const [i, round] of levelOf(1).rounds.entries()) {
    const option = i === 0 ? round.options.find((o) => o !== round.answer)! : round.answer;
    await page.getByRole("button", { name: optionText(option), exact: true }).press("Enter");
    await expect(page.locator(".game__feedback")).toContainText(i === 0 ? "Неверно" : "Верно");
    await page.getByRole("button", { name: /^(Дальше|Закончить уровень)$/ }).press("Enter");
  }
  await expect(page.locator(".game__feedback")).toHaveText("Уровень пройден: верно с первого раза 4 из 5.");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "prob.guess-correlation", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("ловушки: парабола объяснена, разбор уровня", async ({ page }) => {
  await page.goto(`/games/guess-correlation/?seed=${SEED}&level=4`);
  await waitForIslands(page);
  for (const round of levelOf(4).rounds) {
    await page.getByRole("button", { name: optionText(round.answer), exact: true }).click();
    if (round.kind === "parabola") await expect(page.locator(".game__feedback")).toContainText("ветви гасят друг друга");
    await page.getByRole("button", { name: /^(Дальше|Закончить уровень)$/ }).click();
  }
  await expect(page.locator(".game__debrief")).toContainText("Почему у параболы и кольца корреляция около нуля");
});
