// «Тетрис размерностей» (уроки I.3 и II.3): несошедшийся стык объяснён, транспонирование с клавиатуры собирает Xᵀy
// за минимум ходов, журнал; на уровне «внешнее произведение» uᵀw — не та форма, uwᵀ — решение. axe.
import { expect, test } from "@playwright/test";
import { dimTetris, optimalMoves } from "../../src/games/dim-tetris/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => dimTetris.generate(rng(SEED * 1000 + k - 1), k);

test("градиент МНК: стык не сходится, транспонирование X собирает Xᵀy за минимум ходов, журнал", async ({ page }) => {
  await page.goto(`/games/dim-tetris/?seed=${SEED}&level=4`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 4 из 6: градиент МНК/);
  await expectNoAxeViolations(page);

  const level = levelOf(4);
  const [n, d] = [level.pieces.find((p) => p.id === "X")!.rows, level.pieces.find((p) => p.id === "X")!.cols];
  await page.getByRole("button", { name: /^Добавить X/ }).press("Enter");
  await page.getByRole("button", { name: /^Добавить y/ }).press("Enter");
  await expect(page.locator(".game__feedback")).toHaveText(`Стык 1 не сходится: столбцов у левого блока — ${d}, строк у правого — ${n}.`);
  await expect(page.locator(".game-dim__joint")).toHaveText(`${d} ≠ ${n}`);

  await page.getByRole("button", { name: "Транспонировать X", exact: true }).press("Enter");
  await expect(page.locator(".game-dim__joint")).toHaveText(`${n} = ${n}`);
  await expect(page.locator(".game__feedback")).toHaveText(`Собрано за 3 хода — это минимум.`);
  expect(optimalMoves(level)).toBe(3);
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "la.dim-tetris", seed: SEED, level: 4, solved: true, hints: 0 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("внешнее произведение: uᵀw — число, а нужна матрица; uwᵀ решает уровень, разбор", async ({ page }) => {
  await page.goto(`/games/dim-tetris/?seed=${SEED}&level=3`);
  await waitForIslands(page);
  const k = levelOf(3).target[0];
  await page.getByRole("button", { name: /^Добавить u/ }).click();
  await page.getByRole("button", { name: /^Добавить w/ }).click();
  await page.getByRole("button", { name: "Транспонировать u", exact: true }).click();
  await expect(page.locator(".game__feedback")).toHaveText(`Получилось 1 × 1, а нужно ${k} × ${k}. Попробуйте транспонировать блок.`);
  await page.getByRole("button", { name: "Транспонировать uᵀ", exact: true }).click();
  await page.getByRole("button", { name: "Транспонировать w", exact: true }).click();
  await expect(page.locator(".game__feedback")).toHaveText(/^Собрано за 5 ходов; минимум — 3\.$/);
  await expect(page.locator(".game__debrief")).toContainText("Чем uwᵀ отличается от uᵀw?");
});
