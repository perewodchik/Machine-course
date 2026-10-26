// Модуль III (S4.L3): урок III.1 — события как области на двух кубиках (объединение, несовместные события),
// разбор «сложили совместные», итоговая проверка ставит «знаю». Урок III.2 — режим «A | B», независимость,
// разбор деления не на |B|, итоговая проверка. axe.
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { expectNoAxeViolations } from "./support";

test.describe.configure({ timeout: 90_000 });

test("урок III.1: события как области, включения-исключения, итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/probability-space/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Вероятностное пространство");

  const fig = page.locator(".events").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // A — сумма ≥ 8 (15), B — первый чётный (18), A ∩ B — 9: |A ∪ B| = 24, как в сниппете prob/events.py
  await expect(fig.locator(".events__facts")).toContainText("P(A ∪ B) = 15/36 + 18/36 − 9/36 = 24/36");
  await expect(fig.locator(".events__cell.is-res")).toHaveCount(24);
  await fig.getByRole("group", { name: "Событие B" }).getByRole("button", { name: "сумма ≤ 4" }).press("Enter");
  await expect(fig.locator(".events__facts")).toContainText("|A ∩ B| = 0");

  const un = page.locator("[data-exercise][data-item='prob.union']");
  const seed = Number(await un.locator("[data-variant]:not([hidden])").getAttribute("data-seed"));
  const task = generator("prob.union").make(seed);
  if (task.kind !== "numeric") throw new Error("ожидалось число");
  // ответ без вычитания пересечения: P(A) + P(B)
  const [pa, pb] = [...task.prompt.matchAll(/= ([\d.]+)\$/g)].slice(0, 2).map((m) => Number(m[1]));
  await un.locator("[data-variant]:not([hidden]) input").first().fill(String(Math.round((pa! + pb!) * 1000) / 1000));
  await un.getByRole("button", { name: "Проверить" }).click();
  await expect(un.locator("[data-feedback]")).toContainText("пересечение учтено дважды");

  const final = page.locator("#final-check");
  const spec = generator("prob.dice-event").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("урок III.2: условие сужает мир, независимость, ловушка P(B | A), итоговая проверка", async ({ page }) => {
  await page.goto("/foundations/probability/conditional-independence/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Условная вероятность и независимость");

  const fig = page.locator(".events").first();
  await fig.scrollIntoViewIfNeeded();
  await expect(fig.locator("xpath=ancestor::astro-island[1]")).not.toHaveAttribute("ssr", "");
  // A — первый чётный, B — сумма ≥ 8: P(A | B) = 9/15, 21 клетка вне B погашена, события зависимы
  await expect(fig.locator(".events__facts").first()).toContainText("P(A | B) = 9/15 ≈ 0.6");
  await expect(fig.locator(".events__cell.is-out")).toHaveCount(21);
  await expect(fig.locator(".events__verdict")).toHaveText("A и B зависимы");
  await fig.getByRole("group", { name: "Событие B" }).getByRole("button", { name: "на втором 6" }).press("Enter");
  await expect(fig.locator(".events__verdict")).toHaveText("A и B независимы");

  const cd = page.locator("[data-exercise][data-item='prob.cond-dice']").first();
  await cd.locator("[data-variant]:not([hidden]) input").first().fill("0.999");
  await cd.getByRole("button", { name: "Проверить" }).click();
  await expect(cd.locator("[data-feedback]")).toContainText("Делите на число исходов условия");

  const final = page.locator("#final-check");
  const spec = generator("prob.cond-dice").make(31);
  if (spec.kind !== "numeric") throw new Error("ожидалось число");
  await final.locator("[data-variant]:not([hidden]) input").first().fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.locator("[data-feedback]")).toContainText("Урок отмечен");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});
