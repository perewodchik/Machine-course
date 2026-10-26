// «Машина правдоподобия» (урок IV.3): замер ℓ рисует точку, край диапазона не принимается, MLE с клавиатуры
// решает уровень, кривая показана после сдачи, журнал партии. axe.
import { expect, test } from "@playwright/test";
import { likelihoodMachine, mle } from "../../src/games/likelihood-machine/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => likelihoodMachine.generate(rng(SEED * 1000 + k - 1), k);

test("монета: замер, промах на краю, доля орлов попадает, журнал", async ({ page }) => {
  await page.goto(`/games/likelihood-machine/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: монета/);
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Замерить ℓ" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("Осталось замеров: 5");

  const slider = page.getByRole("slider", { name: "φ" });
  await slider.press("Home");
  await page.getByRole("button", { name: "Сдать φ" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("не принято");

  const lv = levelOf(1);
  for (let i = 0; i < Math.round((mle(lv) - lv.range[0]) / lv.step); i++) await slider.press("ArrowRight");
  await page.getByRole("button", { name: "Сдать φ" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("Принято!");
  await expect(page.locator(".game__figure svg .kit-polyline")).toHaveCount(1);
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "stat.likelihood-machine", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
