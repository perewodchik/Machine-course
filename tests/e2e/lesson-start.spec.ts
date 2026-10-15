// Модуль 0 (S3.L0): урок 0.1 — рисунок без кнопки минимума, итоговая проверка ставит «знаю»; игра «Подгони прямую»
// проходится с клавиатуры по бегункам; партия по ссылке ?seed=&level= совпадает с моделью.
// Урок 0.3 — перевод записей в обе стороны с разбором ошибок, композиция, итоговая проверка. axe.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations } from "./support";

test("урок 0.1: рисунок без «Показать минимум», итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/regression-by-hand/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Регрессия руками за 15 минут");
  const fig = page.locator(".fit-line").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  await expect(fig.getByRole("button", { name: /минимум/ })).toHaveCount(0);

  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("basics.sse").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expect(page.getByRole("link", { name: "Открыть игру" })).toHaveAttribute("href", "/games/fit-line/");
  await expectNoAxeViolations(page);
});

test("«Подгони прямую»: уровень «наклон» проходится стрелками на бегунке; далёкая прямая не принимается", async ({ page }) => {
  const SEED = 3;
  await page.goto(`/games/fit-line/?seed=${SEED}&level=1`);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 1 из 3: наклон/);
  // та же выборка, что в модели игры (model.ts, generate): 12 квартир из 16 по seed уровня; наклон прямой через ноль
  const data = JSON.parse(readFileSync("src/games/fit-line/data.json", "utf8")) as { area: number[]; price: number[] };
  const pick = rng(SEED * 1000 + 0)
    .shuffle(data.area.map((_, i) => i))
    .slice(0, 12);
  const sxy = pick.reduce((s, i) => s + data.area[i]! * data.price[i]!, 0);
  const sxx = pick.reduce((s, i) => s + data.area[i]! ** 2, 0);
  const STEP = 0.002;
  const slider = page.getByRole("slider", { name: "θ1" });
  await expect(slider).toBeVisible();
  // сначала сдаём стартовую прямую — не принимается
  await page.getByRole("button", { name: "Сдать прямую" }).click();
  await expect(page.locator(".game__feedback")).toContainText("Ещё не минимум");
  const steps = Math.round((sxy / sxx - 0.05) / STEP);
  await slider.focus();
  for (let k = 0; k < steps; k++) await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Сдать прямую" }).click();
  await expect(page.locator(".game__feedback")).toContainText("Принято");
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  await expectNoAxeViolations(page);
});

test("урок 0.3: перевод записей в обе стороны, разбор ошибки, итоговая проверка ставит «знаю»", async ({ page }) => {
  await page.goto("/foundations/start/language-of-math/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Язык математики: множества, отображения, кванторы");

  // перевод: первый вариант — от символов к словам; неверный вариант объясняет путаницу ∈ и ⊂
  const practice = page.locator("[data-exercise][data-item='basics.read-notation']");
  const visible = practice.locator("[data-variant]:not([hidden])");
  const spec = generator("basics.read-notation").make(1);
  if (spec.kind !== "choice") throw new Error("ожидался выбор");
  await expect(visible).toContainText("Как читается запись");
  await visible.locator("[data-option]").nth(spec.options.findIndex((o) => o.text.includes("множество векторов"))).click();
  await expect(practice.locator("[data-feedback]")).toContainText("подмножеством");
  await visible.locator("[data-option]").nth(spec.options.findIndex((o) => o.correct)).click();
  await expect(practice.locator("[data-feedback]")).toContainText("Верно.");
  // через восемь вариантов — те же записи в обратную сторону
  for (let k = 0; k < 8; k++) await practice.getByRole("button", { name: "Ещё задача" }).click();
  await expect(visible).toContainText("Как записать символами");

  // композиция: обратный порядок функций узнаётся по ответу
  const compose = page.locator("[data-exercise][data-item='start3.compose']");
  await compose.locator("input[data-input]").fill("7");
  await compose.getByRole("button", { name: "Проверить" }).click();
  await expect(compose.locator("[data-feedback]")).toContainText("в обратном порядке");
  await compose.locator("input[data-input]").fill("8");
  await compose.getByRole("button", { name: "Проверить" }).click();
  await expect(compose.locator("[data-feedback]")).toContainText("Верно.");

  const final = page.locator("[data-exercise][data-final]");
  const argmin = generator("basics.argmin").make(31);
  if (argmin.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(argmin.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await expectNoAxeViolations(page);
});
