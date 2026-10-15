// Карта курса, страницы понятий и справка по опоре урока (S3.02, идея A7).
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

test.beforeEach(async ({ page }) => {
  await page.goto("/map/");
  await page.evaluate(() => localStorage.clear());
});

test("карта: «можно начинать» следует за отметками, связи урока подсвечиваются", async ({ page }, info) => {
  await page.reload();
  const next = page.locator("[data-map-next]:not([hidden])");
  await expect(next).toHaveText(["0.1. Регрессия руками за 15 минут", "0.3. Язык математики: множества, отображения, кванторы"]);
  // отметили 0.3 — открылись уроки, которые опираются только на него
  await page.getByRole("checkbox", { name: /^Знаю: 0\.3 / }).check();
  await expect(page.locator('[data-map-node="foundations/start/language-of-math"]')).toHaveClass(/is-known/);
  await expect(next).toContainText(["0.4. Суммы, произведения, индикатор"]);
  await expect(page.locator('[data-map-node="foundations/start/sums-products-indicators"]')).toHaveClass(/is-next/);

  if (info.project.name === "desktop") {
    // фокус на уроке подсвечивает его опоры и рёбра к ним
    await page.locator('[data-map-node="foundations/linear-algebra/matrix-as-map"] a').focus();
    await expect(page.locator('[data-map-node="foundations/linear-algebra/matrix-multiplication"]')).toHaveClass(/is-before/);
    await expect(page.locator(".edge.is-in")).toHaveCount(1);
    expect(await page.locator(".edge").count()).toBeGreaterThan(50);
  } else {
    await expect(page.locator("[data-map-edges]")).toBeHidden();
  }
  await expectNoAxeViolations(page);
});

test("понятие: где вводится, связи и путь до раздела CS229", async ({ page }) => {
  await page.goto("/concepts/");
  await page.getByRole("link", { name: "Знак суммы" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Знак суммы");
  await expect(page.getByRole("link", { name: "Урок 0.4. Суммы, произведения, индикатор" })).toBeVisible();
  await expect(page.getByText("Нужно для")).toBeVisible();
  await expect(page.locator(".concept__why")).toContainText("«Reinforcement learning»");
  await page.goto("/concepts/calc.log-exp/");
  await expect(page.locator(".concept__why")).toContainText("CS229");
  await expectNoAxeViolations(page);
});

test("вторая неверная попытка предлагает опору урока без галочки", async ({ page }) => {
  await page.goto("/foundations/linear-algebra/matrix-as-map/");
  const ex = page.locator("[data-exercise]").filter({ has: page.locator(".matrix-input:visible") }).first();
  await ex.scrollIntoViewIfNeeded();
  const cells = ex.locator("[data-variant]:not([hidden]) input[data-cell]");
  for (let k = 0; k < 4; k++) await cells.nth(k).fill("9");
  await ex.getByRole("button", { name: "Проверить" }).click();
  await expect(ex.locator(".prereq-help")).toHaveCount(0);
  await ex.getByRole("button", { name: "Проверить" }).click();
  await expect(ex.locator(".prereq-help")).toContainText("I.3. Умножение матриц: четыре взгляда");
  await expect(ex.locator(".prereq-help")).toContainText("Не получается?");
});
