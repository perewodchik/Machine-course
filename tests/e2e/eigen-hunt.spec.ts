// «Охота на собственные векторы» (урок I.9): бегунок угла с клавиатуры, промах объяснён, поймать направление
// и выбрать λ; у поворота верный ход — «Таких направлений нет». Партия по ссылке ?seed=&level= совпадает с моделью. axe.
import { expect, test } from "@playwright/test";
import { eigenHunt } from "../../src/games/eigen-hunt/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => eigenHunt.generate(rng(SEED * 1000 + k - 1), k);
const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");

test("симметричная матрица: промах, поимка направления 45°, выбор λ, журнал", async ({ page }) => {
  await page.goto(`/games/eigen-hunt/?seed=${SEED}&level=2`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 2 из 6: симметричная матрица/);
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Поймать" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("Мимо");

  const level = levelOf(2);
  const slider = page.getByRole("slider", { name: "φ" });
  for (const e of level.eigen) {
    await slider.fill(String(Math.round(e.angle)));
    await page.getByRole("button", { name: "Поймать" }).press("Enter");
    await expect(page.locator(".game__feedback")).toHaveText("Поймано! Av лежит на той же прямой, что v. Чему равно λ?");
    await page.getByRole("button", { name: `λ = ${f(e.lambda)}`, exact: true }).press("Enter");
  }
  await expect(page.locator(".game__feedback")).toHaveText("Найдены оба направления, промахов — 1.");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "la.eigen-hunt", seed: SEED, level: 2, solved: true, hints: 0 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("поворот: «Таких направлений нет» решает уровень, разбор объясняет почему", async ({ page }) => {
  await page.goto(`/games/eigen-hunt/?seed=${SEED}&level=6`);
  await waitForIslands(page);
  await page.getByRole("slider", { name: "φ" }).press("PageUp");
  await expect(page.locator(".game-matrix__facts")).toContainText("90°");
  await page.getByRole("button", { name: "Таких направлений нет" }).click();
  await expect(page.locator(".game__feedback")).toHaveText("Верно: вещественных собственных векторов у поворота нет.");
  await expect(page.locator(".game__debrief")).toContainText("Почему здесь не нашлось ни одного направления?");
});
