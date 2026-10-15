// Урок V.1 (S2.06) — первый настоящий урок: шапка из frontmatter, циклы с проверками, ячейка Python,
// итоговая проверка ставит «знаю». axe и раскладка страницы урока — в layout.spec.ts (layoutPages.lesson).
import { expect, test } from "@playwright/test";
import { generator } from "../../src/lib/exercises/generators";
import { layoutPages } from "./support";

const url = layoutPages.lesson;

test("шапка: заметка CS229 и вводный абзац до строки «Знаю эту тему», затем «Опирается на»", async ({ page }) => {
  await page.goto(url);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Линейная регрессия тремя способами");
  const order = await page.evaluate(() =>
    [".article > .lead", ".article > .lesson-meta", ".article .prereqs"].map((s) => document.querySelector(s)?.compareDocumentPosition(document.querySelector(".article .prereqs")!) ?? -1),
  );
  // lead и meta стоят раньше «Опирается на» (DOCUMENT_POSITION_FOLLOWING = 4)
  expect(order.slice(0, 2)).toEqual([4, 4]);
  await expect(page.locator(".article").getByText(/Linear regression → Probabilistic interpretation/)).toBeVisible();
  await expect(page.locator(".lesson-meta")).toContainText("Около 50");
});

test("в каждом разделе урока есть действие ученика", async ({ page }) => {
  await page.goto(url);
  const sections = await page.evaluate(() => {
    const out: Record<string, number> = {};
    let current = "";
    for (const el of document.querySelectorAll(".article > *")) {
      // типограф ставит неразрывные пробелы: сравниваем с обычными
      if (el.tagName === "H2") current = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      else if (current && el.matches("[data-exercise], .figure, [data-py-cell], .formula-card"))
        out[current] = (out[current] ?? 0) + 1;
    }
    return out;
  });
  for (const h of ["Задача", "Способ 1. Проекция", "Способ 2. Минимум функции потерь", "Способ 3. Максимум правдоподобия", "В коде", "Итог"]) {
    expect(sections[h], `раздел «${h}» без упражнения, рисунка или кода`).toBeGreaterThan(0);
  }
});

test("ячейка печатает веса, закреплённые тестом code/tests", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(url);
  const cell = page.locator("[data-py-cell]");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 90_000 });
  await expect(cell.locator("[data-py-output]")).toHaveText("θ = [0.798 0.548]\nсовпадает с lstsq: True\n");
});

test("верная итоговая проверка ставит галочку «знаю»", async ({ page }) => {
  await page.goto(url);
  const final = page.locator("[data-exercise][data-final]");
  const spec = generator("la.slope3").make(1);
  if (spec.kind !== "numeric") throw new Error("ожидалась числовая задача");
  await final.locator("[data-variant]:not([hidden]) input[data-input]").fill(String(spec.answer));
  await final.getByRole("button", { name: "Проверить" }).click();
  await expect(final.getByRole("status")).toContainText("Урок отмечен: «знаю».");
  await expect(page.getByRole("checkbox", { name: "Знаю эту тему" })).toBeChecked();
});

test("без горизонтальной прокрутки страницы; широкая таблица прокручивается сама", async ({ page }) => {
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scroll).toBeLessThanOrEqual(width);
  await expect(page.locator(".table-wrap table")).toBeVisible();
});
