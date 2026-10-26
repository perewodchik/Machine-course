// «Покрой истину» (урок IV.8★): при пяти наблюдениях табличное 1.96 не принимается, квантиль по скрытым выборкам —
// да; залпы, журнал партии; на скошенных данных — разбор уровня. axe.
import { expect, test, type Page } from "@playwright/test";
import { rng } from "../../src/lib/math/rng";
import { bestZ, coverTruth } from "../../src/games/cover-truth/model";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (l: number) => coverTruth.generate(rng(SEED * 1000 + l - 1), l);

async function tryZ(page: Page, z: number) {
  await page.getByRole("slider", { name: "z" }).fill(String(z));
  await page.getByRole("button", { name: "Построить 100 интервалов" }).press("Enter");
  await page.getByRole("button", { name: "Сдать z" }).press("Enter");
}

test("пять наблюдений: 1.96 мало, нужный множитель проходит, журнал", async ({ page }) => {
  await page.goto(`/games/cover-truth/?seed=${SEED}&level=3`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 3 из 5: пять наблюдений/);
  await expectNoAxeViolations(page);
  await expect(page.getByRole("button", { name: "Сдать z" })).toBeDisabled();

  await tryZ(page, 1.96);
  await expect(page.locator(".game__feedback")).toContainText("не принят: настоящее покрытие ниже");
  await expect(page.getByRole("list", { name: "Залпы" }).locator("li")).toHaveCount(1);

  await tryZ(page, bestZ(levelOf(3)));
  await expect(page.locator(".game__feedback")).toContainText("Истина накрыта!");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "stat.cover-truth", seed: SEED, level: 3, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("скошенные данные: разбор уровня", async ({ page }) => {
  await page.goto(`/games/cover-truth/?seed=${SEED}&level=4`);
  await waitForIslands(page);
  await tryZ(page, bestZ(levelOf(4)));
  await expect(page.locator(".game__debrief")).toContainText("Почему для скошенных данных множитель приходится увеличивать?");
});
