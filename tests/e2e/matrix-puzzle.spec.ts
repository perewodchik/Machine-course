// «Матрица-пазл» (S2.07): уровень проходится только с клавиатуры, подсказки лесенкой, разбор после уровня,
// результат — в журнале; партия по ссылке ?seed=&level= совпадает с моделью. axe — в начале и после решения.
import { expect, test, type Page } from "@playwright/test";
import { matrixPuzzle, solve } from "../../src/games/matrix-puzzle/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations } from "./support";

const SEED = 7;
const NAMES = [["a₁₁", "a₁₂"], ["a₂₁", "a₂₂"]];
const levelOf = (k: number) => matrixPuzzle.generate(rng(SEED * 1000 + k - 1), k);
const open = (page: Page, k: number) => page.goto(`/games/matrix-puzzle/?seed=${SEED}&level=${k}`);

test("уровень проходится с клавиатуры за минимум ходов; разбор и журнал", async ({ page }) => {
  await open(page, 3);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 3 из 5: поворот/);
  await expectNoAxeViolations(page);

  const level = levelOf(3);
  const actions = solve(matrixPuzzle.init(level, rng(SEED)));
  // Tab с номера уровня ведёт в матрицу: первая кнопка — «Уменьшить a₁₁»
  await page.getByRole("button", { name: "Уровень 5" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveAttribute("aria-label", /^Уменьшить a₁₁/);
  for (const a of actions) {
    if (a.type !== "nudge") continue;
    await page.getByRole("button", { name: new RegExp(`^${a.dir > 0 ? "Увеличить" : "Уменьшить"} ${NAMES[a.i]![a.j]}`) }).focus();
    await page.keyboard.press(a.dir > 0 ? "Enter" : "Space");
  }
  await expect(page.locator(".game__feedback")).toHaveText(`Фигуры совпали за ${actions.length} — это минимум.`);
  // счётчики выключились — фокус не потерялся, а перешёл на «Следующий уровень»
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  await expect(page.locator(".game__debrief")).toContainText("После уровня.");
  await page.getByRole("button", { name: "Показать ответ" }).press("Enter");
  await expect(page.locator(".game__answer")).toContainText("det A = 1");
  await expect(page.getByRole("button", { name: "Уровень 3, пройден" })).toBeVisible();

  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "la.matrix-puzzle", seed: SEED, level: 3, solved: true, actions: actions.length, hints: 0 });
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "Следующий уровень" }).press("Enter");
  await expect(page.locator(".game__level")).toBeFocused();
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 4 из 5: отражение/);
});

test("подсказки лесенкой: последняя называет столбец цели", async ({ page }) => {
  await open(page, 1);
  const target = levelOf(1).target;
  const hint = page.locator(".game__hint");
  await page.getByRole("button", { name: "Подсказка" }).click();
  await expect(hint).toContainText("Подсказка 1. Первый столбец A — это Ae₁");
  await page.getByRole("button", { name: "Подсказка" }).click();
  await page.getByRole("button", { name: "Подсказка" }).click();
  await expect(hint).toContainText(`Цель отправляет e₁ в (${target[0][0]}, ${target[1][0]})`.replace(/-/g, "−"));
});

test("сброс и пропуск уровня; описание для скринридера меняется после хода", async ({ page }) => {
  await open(page, 2);
  const live = page.locator(".game__panel [aria-live]");
  await expect(live).toContainText("A: первая строка 1, 0; вторая строка 0, 1.");
  await page.getByRole("button", { name: /^Увеличить a₁₂/ }).click();
  await expect(page.locator(".game__status")).toContainText("Ходы: 1");
  await expect(live).toContainText("A: первая строка 1, 1;");
  await page.getByRole("button", { name: "Начать уровень заново" }).click();
  await expect(page.locator(".game__status")).toContainText("Ходы: 0");
  await page.getByRole("button", { name: "Пропустить уровень" }).click();
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 3 из 5/);
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", level: 2, solved: false });
});
