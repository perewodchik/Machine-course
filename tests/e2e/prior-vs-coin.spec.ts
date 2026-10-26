// «Приор против монеты» (урок IV.6): на «кривых монетах» сильный симметричный приор проигрывает, приор партии
// побеждает, таблица показывает потери, журнал партии; на «много бросков» засчитывается ничья. axe.
import { expect, test, type Page } from "@playwright/test";
import { PRIOR } from "../../src/games/prior-vs-coin/model";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;

async function setPrior(page: Page, name: "α" | "β", v: number) {
  const slider = page.getByRole("slider", { name });
  await slider.press("Home");
  for (let i = 0; i < Math.round((v - PRIOR.min) / PRIOR.step); i++) await slider.press("ArrowRight");
}

test("кривые монеты: Beta(20, 20) проигрывает, Beta(16, 4) побеждает, журнал", async ({ page }) => {
  await page.goto(`/games/prior-vs-coin/?seed=${SEED}&level=2`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 2 из 5: кривые монеты/);
  await expectNoAxeViolations(page);
  await setPrior(page, "α", 20);
  await setPrior(page, "β", 20);
  await page.getByRole("button", { name: "Сыграть партию" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("бот пока лучше");
  await expect(page.locator(".game-prior__table thead th")).toHaveCount(6);

  await setPrior(page, "α", 16);
  await setPrior(page, "β", 4);
  await page.getByRole("button", { name: "Сыграть партию" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("Победа!");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "stat.prior-vs-coin", seed: SEED, level: 2, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("много бросков: приор почти не нужен, разбор уровня", async ({ page }) => {
  await page.goto(`/games/prior-vs-coin/?seed=${SEED}&level=5`);
  await waitForIslands(page);
  await setPrior(page, "α", 20);
  await setPrior(page, "β", 20);
  await page.getByRole("button", { name: "Сыграть партию" }).click();
  await expect(page.locator(".game__debrief")).toContainText("Почему при 40 бросках приор почти не важен?");
});
