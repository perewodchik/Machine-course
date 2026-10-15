// «Байес-детектив» (S2.13): уровень проходится с клавиатуры, байесовские ответы дают 100 очков за улику,
// разбор после уровня, результат в журнале; axe — в начале и после решения.
import { expect, test, type Page } from "@playwright/test";
import { detective, posterior } from "../../src/games/bayes-detective/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations } from "./support";

const SEED = 4;
const levelOf = (k: number) => detective.generate(rng(SEED * 1000 + k - 1), k);
const open = (page: Page, k: number) => page.goto(`/games/bayes-detective/?seed=${SEED}&level=${k}`);

test("уровень с клавиатуры: байесовские ответы — по 100 очков, разбор и журнал", async ({ page }) => {
  await open(page, 4);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 4 из 5: улика против/);
  await expectNoAxeViolations(page);
  const level = levelOf(4);
  const slider = page.getByRole("slider", { name: /Вероятность гипотезы/ });
  for (let k = 1; k <= level.evidence.length; k++) {
    const target = Math.round(posterior(level, k) * 100);
    await slider.focus();
    const now = Number(await slider.inputValue());
    for (let i = 0; i < Math.abs(target - now); i++) await page.keyboard.press(target > now ? "ArrowRight" : "ArrowLeft");
    await expect(slider).toHaveValue(String(target));
    await page.keyboard.press("Enter");
  }
  await expect(page.locator(".game__status")).toContainText(`Очки: ${100 * level.evidence.length} из ${100 * level.evidence.length}`);
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  await expect(page.locator(".game__debrief")).toContainText("После уровня.");
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "prob.bayes-detective", seed: SEED, level: 4, solved: true, actions: level.evidence.length });
  await expectNoAxeViolations(page);
});

test("ответ далеко от Байеса стоит очков; подсказки ведут через шансы", async ({ page }) => {
  await open(page, 2);
  const level = levelOf(2);
  await page.getByRole("button", { name: "Подсказка" }).click();
  await expect(page.locator(".game__hint")).toContainText("шансы гипотезы");
  const slider = page.getByRole("slider", { name: /Вероятность гипотезы/ });
  await slider.fill("90");
  await page.getByRole("button", { name: "Ответить" }).click();
  const p = posterior(level, 1);
  await expect(page.locator(".game__feedback")).toContainText(`по Байесу ${Math.round(p * 100)}`);
  const pts = Number((await page.locator(".game__status b").first().textContent())!.split(" ")[0]);
  expect(pts).toBeLessThan(50);
});
