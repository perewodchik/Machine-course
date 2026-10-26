// «Переобучи, если сможешь» (урок IV.7): степень 10 без штрафа почти обнуляет ошибку на обучении и проваливает тест,
// выбор по валидации проходит; подсказка называет лучшую модель, разбор уровня, журнал партии. axe.
import { expect, test, type Page } from "@playwright/test";
import { rng } from "../../src/lib/math/rng";
import { overfit, pow10, valBest, LOG_LAMBDA } from "../../src/games/overfit/model";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 2;
const levelOf = (l: number) => overfit.generate(rng(SEED * 1000 + l - 1), l);

async function choose(page: Page, degree: number, logLambda: number) {
  const d = page.getByRole("slider", { name: "степень" });
  await d.press("Home");
  for (let i = 0; i < degree; i++) await d.press("ArrowRight");
  const g = page.getByRole("slider", { name: "log10 λ" });
  await g.press("Home");
  for (let i = 0; i < logLambda - LOG_LAMBDA.min; i++) await g.press("ArrowRight");
}

test("синусоида: степень 10 переобучается, выбор по валидации проходит, журнал", async ({ page }) => {
  await page.goto(`/games/overfit/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: синусоида/);
  await expectNoAxeViolations(page);

  await choose(page, 10, -6);
  await page.getByRole("button", { name: "Сдать модель" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("хуже, чем у модели, выбранной по валидации");
  await expect(page.getByRole("list", { name: "Сданные модели" }).locator("li")).toHaveCount(1);

  const best = valBest(levelOf(1));
  await choose(page, best.degree, best.logLambda);
  await page.getByRole("button", { name: "Сдать модель" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("не хуже выбора по валидации");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "stat.overfit", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("решите сами: вторая подсказка называет лучшую модель, разбор уровня", async ({ page }) => {
  await page.goto(`/games/overfit/?seed=${SEED}&level=5`);
  await waitForIslands(page);
  const best = valBest(levelOf(5));
  await page.getByRole("button", { name: "Подсказка" }).click();
  await page.getByRole("button", { name: "Подсказка" }).click();
  await expect(page.locator(".game__hint")).toContainText(`при степени ${best.degree} и λ = ${pow10(best.logLambda)}`);
  await choose(page, best.degree, best.logLambda);
  await page.getByRole("button", { name: "Сдать модель" }).click();
  await expect(page.locator(".game__debrief")).toContainText("Почему нельзя выбирать модель по тестовой ошибке?");
});
