// Каталог курсов (S7.01): отметка урока математики в «Опирается на» урока ML видна в оглавлении курса математики;
// счётчик шапки — по текущему курсу; на главной — «Продолжить» и маршруты; страница курса — «нужно до начала»; axe.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

test("отметка в «Опирается на» урока ML общая с курсом математики; шапка считает текущий курс", async ({ page }) => {
  await page.goto("/ml-basics/linear-models/learning-problem/");
  await expect(page.locator(".site-header .course-name")).toHaveText("Основы машинного обучения");
  await expect(page.locator(".header-progress")).toContainText(/из\s11/);
  const box = page.locator(".prereqs").getByRole("checkbox", { name: /^Знаю: V\.1 / });
  await box.check();
  // в шапке курса ML счётчик не меняется: урок V.1 — из курса математики
  await expect(page.locator(".header-progress [data-known-total]").first()).toHaveText("0");
  await expectNoAxeViolations(page);

  await page.goto("/foundations/bridge/linear-regression/");
  await expect(page.locator(".header-progress [data-known-total]").first()).toHaveText("1");
  // в оглавлении (на телефоне оно свёрнуто — ищем по атрибуту, а не по роли)
  await expect(page.locator(".toc input[data-know='foundations/bridge/linear-regression']").first()).toBeChecked();
});

test("главная: карта, «Продолжить» к первому уроку без галочки, маршрут; страница курса", async ({ page }) => {
  await page.goto("/");
  const math = page.locator("[data-course-row='foundations']");
  await expect(math.locator("[data-continue]")).toHaveText("Начать: 0.1");
  await page.evaluate(() => localStorage.setItem("mlf:marks", JSON.stringify({ schemaVersion: 2, marks: { "foundations/start/regression-by-hand": { known: true, at: "2026-10-26T00:00:00Z", by: "learner" } } })));
  await page.reload();
  await expect(math.locator("[data-continue]")).toHaveText("Продолжить: 0.2");
  await expect(page.locator("[data-node='foundations'] [data-bar]")).not.toHaveAttribute("width", "0");

  await page.getByLabel("ML-инженер на табличных данных").check();
  await expect(page.locator("[data-node='ml-tabular']")).toHaveClass(/on-route/);
  await expect(page.locator("[data-node='deep-learning']")).not.toHaveClass(/on-route/);
  await expect(page.locator("[data-course-row='deep-learning']")).toHaveClass(/is-off-route/);
  await expectNoAxeViolations(page);

  await page.goto("/llm/");
  await expect(page.locator(".course-facts")).toContainText("Глубокое обучение");
  await expect(page.locator(".course-facts")).toContainText("Обучение с подкреплением (рекомендуется)");
});
