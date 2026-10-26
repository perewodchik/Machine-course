// «Порог расходимости» (урок II.6): шаг выше порога расходится и не сдаётся, шаг чуть ниже — сходится и сдаётся;
// журнал партии; разбор уровня «вытянутая чаша». axe.
import { expect, test } from "@playwright/test";
import { divergence, solve, threshold } from "../../src/games/divergence/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations, waitForIslands } from "./support";

const SEED = 4;
const levelOf = (k: number) => divergence.generate(rng(SEED * 1000 + k - 1), k);
const below = (k: number) => {
  const a = solve(divergence.init(levelOf(k), rng(1)))[0]!;
  if (a.type !== "set") throw new Error("ожидался шаг");
  return a.eta;
};

test("одна переменная: выше порога расходится, ниже — сходится, сдача и журнал", async ({ page }) => {
  await page.goto(`/games/divergence/?seed=${SEED}&level=1`);
  await waitForIslands(page);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 7: одна переменная/);
  await expectNoAxeViolations(page);

  const slider = page.getByRole("slider", { name: "η" });
  const submit = page.getByRole("button", { name: "Сдать шаг" });
  await expect(submit).toBeDisabled();
  await slider.focus();
  await slider.press("End");
  await page.getByRole("button", { name: "Запустить спуск" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("расходится");
  await expect(submit).toBeDisabled();

  const eta = below(1);
  await slider.fill(String(eta));
  await page.getByRole("button", { name: "Запустить спуск" }).press("Enter");
  await expect(page.locator(".game__feedback")).toContainText("сходится");
  await submit.press("Enter");
  const pct = Math.round((100 * eta) / threshold(levelOf(1).A));
  await expect(page.locator(".game__feedback")).toContainText(`${pct} % от порога`);
  await expect(page.locator(".game-diverge__runs li")).toHaveCount(2);
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "calc.divergence", seed: SEED, level: 1, solved: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("вытянутая чаша: разбор про число обусловленности", async ({ page }) => {
  await page.goto(`/games/divergence/?seed=${SEED}&level=4`);
  await waitForIslands(page);
  await page.getByRole("slider", { name: "η" }).fill(String(below(4)));
  await page.getByRole("button", { name: "Запустить спуск" }).click();
  await page.getByRole("button", { name: "Сдать шаг" }).click();
  await expect(page.locator(".game__debrief")).toContainText("Почему у вытянутой чаши спуск медленный");
});
