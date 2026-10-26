// «Порог классификатора» и «Цена ошибки» (S7.04): числа виджета совпадают с Python (порог 0.5 — 34/10/50/206,
// точность 0.773, полнота 0.405, AUC 0.848), порог двигается с клавиатуры; в игре 0.5 на кредитах дорог, лучший
// порог принимается, журнал; axe.
import { expect, test } from "@playwright/test";
import { rng } from "../../src/lib/math/rng";
import { best, errorCost } from "../../src/games/error-cost/model";
import { expectNoAxeViolations, waitForIslands } from "./support";

test("виджет: числа как в Python, клавиатура, цена", async ({ page }) => {
  await page.goto("/demo/threshold/");
  await waitForIslands(page);
  const w = page.locator(".threshold");
  await expect(w.locator(".threshold__cm tbody td b")).toHaveText(["34", "50", "10", "206"]);
  await expect(w.locator(".threshold__metrics")).toContainText("0.773");
  await expect(w.locator(".threshold__metrics")).toContainText("0.405");
  await expect(w.locator(".threshold__auc")).toHaveText("AUC = 0.848");
  await expect(w.locator(".threshold__metrics")).toContainText("260");
  const slider = w.getByRole("slider", { name: "t" });
  await slider.fill("0.7");
  await expect(w.locator(".threshold__metrics")).toContainText("0.846");
  await expect(w.locator(".threshold__metrics")).toContainText("0.131");
  await slider.press("ArrowLeft");
  await expect(slider).toHaveValue("0.695");
  await expectNoAxeViolations(page);
});

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
