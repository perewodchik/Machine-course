// «Скульптор Σ» (урок III.11): неудачная проверка объясняет худший параметр, подгонка с клавиатуры решает уровень,
// журнал партии; уровень «сдвинутый центр» — бегунки μ. axe.
import { expect, test, type Page } from "@playwright/test";
import { RANGES, sigmaSculptor } from "../../src/games/sigma-sculptor/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => sigmaSculptor.generate(rng(SEED * 1000 + k - 1), k);
const NAMES = { m1: "μ1", m2: "μ2", s1: "σ1", s2: "σ2", rho: "ρ" } as const;

/** Выставить бегунок клавишами: Home, затем стрелки вправо до нужного деления. */
async function setSlider(page: Page, param: keyof typeof NAMES, value: number) {
  const { min, step } = RANGES[param];
  const slider = page.getByRole("slider", { name: NAMES[param] });
  await slider.press("Home");
  for (let i = 0; i < Math.round((value - min) / step); i++) await slider.press("ArrowRight");
}

test("оси: ошибка объяснена, подгонка с клавиатуры, журнал", async ({ page }) => {
  await page.goto(`/games/sigma-sculptor/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: оси вдоль координат/);
  await expect(page.getByRole("slider", { name: "ρ" })).toHaveCount(0);
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Проверить" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText(/KL = [\d.]+ — больше 0.05\. Разброс по x[₁₂] (велико|мало)ват\./);

  const { S } = levelOf(1);
  await setSlider(page, "s1", Math.sqrt(S[0]));
  await setSlider(page, "s2", Math.sqrt(S[2]));
  await page.getByRole("button", { name: "Проверить" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("эллипс совпал с облаком");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "prob.sigma-sculptor", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("сдвинутый центр: бегунки μ есть, разбор уровня", async ({ page }) => {
  await page.goto(`/games/sigma-sculptor/?seed=${SEED}&level=4`);
  await waitForIslands(page);
  const { mu, S } = levelOf(4);
  await setSlider(page, "m1", mu[0]);
  await setSlider(page, "m2", mu[1]);
  await setSlider(page, "s1", Math.sqrt(S[0]));
  await setSlider(page, "s2", Math.sqrt(S[2]));
  await setSlider(page, "rho", S[1] / Math.sqrt(S[0] * S[2]));
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.locator(".game__debrief")).toContainText("Какую оценку μ даёт максимум правдоподобия?");
});
