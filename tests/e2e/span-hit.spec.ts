// «Попади в точку» (уроки I.1 и I.6): попадание с клавиатуры за минимум ходов, «невозможно» на уровне с целью вне
// прямой, неверное «невозможно» объяснено. Партия по ссылке ?seed=&level= совпадает с моделью. axe.
import { expect, test } from "@playwright/test";
import { solve, spanHit } from "../../src/games/span-hit/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => spanHit.generate(rng(SEED * 1000 + k - 1), k);

test("косые векторы: неверное «невозможно» объяснено, попадание за минимум ходов, журнал", async ({ page }) => {
  await page.goto(`/games/span-hit/?seed=${SEED}&level=2`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 2 из 6: косые векторы/);
  await expectNoAxeViolations(page);
  await page.getByRole("button", { name: "Невозможно" }).press("Enter");
  await expect(page.locator(".game__feedback")).toHaveText("Попасть можно: a и b не параллельны, их оболочка — вся плоскость.");

  const level = levelOf(2);
  const actions = solve(spanHit.init(level, rng(SEED)));
  for (const a of actions) {
    if (a.type !== "nudge") continue;
    const name = a.k === 0 ? "c₁" : "c₂";
    await page.getByRole("button", { name: new RegExp(`^${a.dir > 0 ? "Увеличить" : "Уменьшить"} ${name}`) }).press("Enter");
  }
  await expect(page.locator(".game__feedback")).toHaveText(`Попали за ${actions.length} — это минимум.`);
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "la.span-hit", seed: SEED, level: 2, solved: true, hints: 0 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("цель вне прямой: «невозможно» решает уровень, оболочка видна прямой", async ({ page }) => {
  await page.goto(`/games/span-hit/?seed=${SEED}&level=5`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 5 из 6: цель вне прямой/);
  await page.getByRole("button", { name: "Невозможно" }).click();
  await expect(page.locator(".game__feedback")).toHaveText("Верно: цель вне оболочки a и b — попасть нельзя.");
  await expect(page.locator(".game__debrief")).toContainText("Почему попасть нельзя");
});
