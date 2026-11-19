// Режимы «λ» и «финал» игры «Переобучи, если сможешь» (уроки 2.3 и 2.4 «Основ ML»): уровни проходятся только
// с клавиатуры, выбор по валидации или кросс-валидации проходит, журнал партии, разбор уровня; axe.
import { expect, test, type Page } from "@playwright/test";
import { rng } from "../../src/lib/math/rng";
import { LOG_LAMBDA as LAMBDA_GRID, overfitLambda, valBest } from "../../src/games/overfit-lambda/model";
import { bestBy, LOG_LAMBDA, overfitFinal } from "../../src/games/overfit-final/model";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 2;

async function slide(page: Page, name: string, steps: number) {
  const s = page.getByRole("slider", { name });
  await s.press("Home");
  for (let i = 0; i < steps; i++) await s.press("ArrowRight");
}

test("режим «λ»: два полезных признака из двадцати — выбор по валидации с клавиатуры, журнал, разбор", async ({ page }) => {
  await page.goto(`/games/overfit-lambda/?seed=${SEED}&level=2`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 2 из 5: два полезных из двадцати/);
  await expectNoAxeViolations(page);

  const best = valBest(overfitLambda.generate(rng(SEED * 1000 + 1), 2));
  const button = page.getByRole("button", { name: best.penalty === "l1" ? /^L1/ : /^L2/ });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await slide(page, "log10 λ", (best.logLambda - LAMBDA_GRID.min) / LAMBDA_GRID.step);
  await page.getByRole("button", { name: "Сдать модель" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("не хуже выбора по валидации");
  await expect(page.locator(".game__debrief")).toContainText("разреженной истине");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "ml.overfit-lambda", seed: SEED, level: 2, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("финал: 40 объектов — кросс-валидация с клавиатуры, тест открывается один раз", async ({ page }) => {
  await page.goto(`/games/overfit-final/?seed=${SEED}&level=2`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 2 из 4: 40 объектов/);
  await expectNoAxeViolations(page);

  const best = bestBy(overfitFinal.generate(rng(SEED * 1000 + 1), 2), "cv");
  const cv = page.getByRole("button", { name: /^кросс-валидация/ });
  await cv.focus();
  await page.keyboard.press("Enter");
  await expect(cv).toHaveAttribute("aria-pressed", "true");
  await slide(page, "степень", best.degree);
  await slide(page, "log10 λ", best.logLambda - LOG_LAMBDA.min);
  const submit = page.getByRole("button", { name: /Сдать модель/ });
  await submit.press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("Тест открыт — уровень окончен");
  await expect(page.locator(".game__feedback")).toContainText("Выбор не хуже кросс-валидации");
  await expect(submit).toBeDisabled();
  await expect(page.locator(".game__debrief")).toContainText("при 40 объектах");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "ml.overfit-final", seed: SEED, level: 2, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
