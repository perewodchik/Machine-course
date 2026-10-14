// Педагогические компоненты на демо-уроке (S1.09): карточка f.normal-equations, вывод по шагам, вкладки, блоки,
// «Опирается на». Всё — с клавиатуры. axe этой страницы — в layout.spec.ts.
import { expect, test } from "@playwright/test";
import { layoutPages } from "./support";

test.beforeEach(async ({ page }) => {
  await page.goto(layoutPages.demo);
});

test("карточка формулы: заголовок, легенда кнопками, условие", async ({ page }) => {
  const card = page.locator('[data-formula="f.normal-equations"]');
  await expect(card.getByText("Формула 1")).toBeVisible();
  await expect(card.getByText("Нормальные уравнения", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "X — матрица признаков со столбцом единиц; строка — объект" })).toBeVisible();
  await expect(card.getByText("Условие")).toBeVisible();
  await expect(card.getByRole("link", { name: "Транспонирование произведения" })).toHaveAttribute("href", /\/foundations\/linear-algebra\//);
});

test("вкладки переключаются стрелками, активна одна панель", async ({ page }) => {
  const card = page.locator('[data-formula="f.normal-equations"]');
  const deriv = card.getByRole("tab", { name: "Вывод" });
  await deriv.focus();
  await page.keyboard.press("ArrowRight");
  const dims = card.getByRole("tab", { name: "Размерности" });
  await expect(dims).toBeFocused();
  await expect(dims).toHaveAttribute("aria-selected", "true");
  await expect(card.getByRole("tabpanel", { name: "Размерности" })).toBeVisible();
  await expect(card.getByRole("tabpanel", { name: "Вывод" })).toBeHidden();
  await expect(card.getByRole("table")).toContainText("n × d");
  await page.keyboard.press("End");
  await expect(card.getByRole("tab", { name: "Где используется" })).toHaveAttribute("aria-selected", "true");
  await expect(card.getByRole("tabpanel", { name: "Где используется" })).toContainText("Гребневая регрессия");
  await page.keyboard.press("Home");
  await expect(deriv).toHaveAttribute("aria-selected", "true");
});

test("вывод: шаги открываются по одному, режим «предсказать» прячет будущие", async ({ page }) => {
  const box = page.locator("[data-derivation]");
  const steps = box.locator(".step");
  const pos = box.locator("[data-pos]");
  await expect(steps).toHaveCount(6);
  await expect(pos).toHaveText("Шаг 3 из 6");
  await expect(steps.nth(2)).toHaveClass(/is-current/);
  await expect(steps.nth(3).locator(".step__math")).toBeHidden();
  await expect(steps.nth(3).locator(".step__placeholder")).toHaveText(/Какой шаг дальше/);
  await expect(steps.nth(4).locator(".step__placeholder")).toHaveText(/после предыдущего/);

  const next = box.getByRole("button", { name: "Следующий шаг" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(pos).toHaveText("Шаг 4 из 6");
  await expect(steps.nth(3).locator(".step__math")).toBeVisible();
  await expect(box.locator(".plan li.is-current")).toHaveText("Взять градиент");

  await box.getByRole("checkbox", { name: "Сначала предсказать шаг" }).uncheck();
  await expect(steps.nth(5).locator(".step__math")).toBeVisible();

  await box.getByRole("button", { name: "Показать все шаги" }).click();
  await expect(pos).toHaveText("Шаг 6 из 6");
  await expect(next).toBeDisabled();
  await expect(box.getByRole("button", { name: "Назад" })).toBeFocused();
});

test("правило из обоснования раскрывается на месте", async ({ page }) => {
  const ref = page.locator(".rule-ref").first();
  await ref.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(ref).toHaveAttribute("open", "");
  await expect(ref.locator(".rule-ref__body .katex")).toBeVisible();
});

test("блоки и «Опирается на»", async ({ page }) => {
  await expect(page.locator(".block--definition .block__title")).toHaveText("Определение 1.");
  await expect(page.locator(".block--pitfall .block__title")).toHaveText("Типичная ошибка.");
  await expect(page.locator(".block--pitfall .struck")).toHaveCount(1);
  await expect(page.locator(".block--pitfall .fix")).toHaveCount(1);
  await expect(page.locator(".note--teacher")).toBeVisible();
  const prereqs = page.locator(".prereqs");
  await expect(prereqs.getByRole("checkbox")).toHaveCount(4);
  await expect(prereqs).toContainText("Основы машинного обучения, 2.3");
  await expect(prereqs.getByRole("checkbox", { name: "Знаю: II.5 Выпуклость" })).toBeVisible();
});
