// «Спуск в тумане» (урок II.6): шаг по стрелке поднимает f, путь против стрелки приводит к минимуму, линии уровня
// открываются; журнал партии; уровень «подъём». axe.
import { expect, test } from "@playwright/test";
import { DIRS, foggyDescent, greedyMove, MAX_MOVES } from "../../src/games/foggy-descent/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => foggyDescent.generate(rng(SEED * 1000 + k - 1), k);

/** Ходы бота «против стрелки» до цели: те же, что сделает игрок в браузере. */
function plan(k: number) {
  let s = foggyDescent.init(levelOf(k), rng(1));
  const moves = [];
  while (foggyDescent.status(s) !== "solved" && moves.length < MAX_MOVES) {
    const a = greedyMove(s);
    if (a.type !== "move") break;
    moves.push(a);
    s = foggyDescent.step(s, a);
  }
  return { moves, final: s };
}

test("круглая чаша: против стрелки до минимума, журнал", async ({ page }) => {
  await page.goto(`/games/foggy-descent/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 5: круглая чаша/);
  await expectNoAxeViolations(page);

  const { moves, final } = plan(1);
  expect(foggyDescent.status(final)).toBe("solved");
  const shortBtn = page.locator(".game-fog__short");
  for (const m of moves) {
    if (m.type !== "move") continue;
    if ((await shortBtn.getAttribute("aria-pressed")) !== String(Boolean(m.short))) await shortBtn.press("Enter");
    await page.getByRole("button", { name: `Шаг ${DIRS[m.dir]!.name}`, exact: true }).press("Enter");
  }
  await expect(page.locator(".game__feedback")).toContainText(`Минимум найден за ${moves.length} шагов`);
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "calc.foggy-descent", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("подъём: цель — максимум, шаг против стрелки опускает f", async ({ page }) => {
  await page.goto(`/games/foggy-descent/?seed=${SEED}&level=3`);
  await waitForIslands(page);
  await expect(page.locator(".game-matrix__facts")).toContainText("цель — максимум");
  const s = foggyDescent.init(levelOf(3), rng(1));
  // бот идёт к вершине — по стрелке; противоположное направление ведёт вниз
  const up = greedyMove(s);
  if (up.type !== "move") throw new Error("ожидался шаг");
  await page.getByRole("button", { name: `Шаг ${DIRS[(up.dir + 4) % 8]!.name}`, exact: true }).click();
  await expect(page.locator(".game__feedback")).toContainText("ниже, чем было");
});
