// «Тир оценок» (урок IV.2): на «пяти наблюдениях» несмещённый c = 1 не принимается, c* с клавиатуры решает
// уровень, журнал партии; на «много данных» c = 1 почти лучший. axe.
import { expect, test, type Page } from "@playwright/test";
import { bestC, C_STEP, estimatorRange } from "../../src/games/estimator-range/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => estimatorRange.generate(rng(SEED * 1000 + k - 1), k);

async function setC(page: Page, c: number) {
  const slider = page.getByRole("slider", { name: "c" });
  await slider.press("Home");
  for (let i = 0; i < Math.round(c / C_STEP); i++) await slider.press("ArrowRight");
}

test("пять наблюдений: c = 1 мимо, c* попадает, журнал", async ({ page }) => {
  await page.goto(`/games/estimator-range/?seed=${SEED}&level=2`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 2 из 5: пять наблюдений/);
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Залп" }).press("Enter");
  await expect(page.locator(".game__figure svg .kit-point")).toHaveCount(200);
  await page.getByRole("button", { name: "Сдать c" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("не принят");

  await setC(page, bestC(levelOf(2)));
  await page.getByRole("button", { name: "Залп" }).press("Enter");
  await page.getByRole("button", { name: "Сдать c" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("Попадание!");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "stat.estimator-range", seed: SEED, level: 2, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("много данных: несмещённый c = 1 почти лучший, разбор уровня", async ({ page }) => {
  await page.goto(`/games/estimator-range/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await page.getByRole("button", { name: "Залп" }).click();
  await page.getByRole("button", { name: "Сдать c" }).click();
  await expect(page.locator(".game__feedback")).toContainText("Попадание!");
  await expect(page.locator(".game__debrief")).toContainText("Почему здесь лучший c почти равен 1?");
});
