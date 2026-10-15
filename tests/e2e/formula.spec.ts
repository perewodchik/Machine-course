// Ввод формул (S3.03): редактор MathLive вместо поля TeX, проверка равенства на случайных матрицах,
// понятное сообщение об ошибке формы, равная запись засчитывается.
import { expect, test, type Locator } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

const url = "/foundations/bridge/linear-regression/";

async function enter(ex: Locator, tex: string) {
  const field = ex.locator("math-field[data-formula-input]");
  await expect(field).toBeAttached();
  await field.evaluate((el, value) => {
    (el as HTMLElement & { value: string }).value = value;
  }, tex);
  await ex.getByRole("button", { name: "Проверить" }).click();
}

test("градиент МНК: ошибка формы объясняется, равная запись засчитывается", async ({ page }) => {
  await page.goto(url);
  const ex = page.locator("[data-exercise][data-item='v1.gradient-formula']");
  await ex.scrollIntoViewIfNeeded();
  // поле TeX заменено редактором формул
  await expect(ex.locator("math-field")).toHaveCount(1);
  await expect(ex.locator("input[data-formula-input]")).toHaveCount(0);

  await enter(ex, String.raw`X^\top\theta^\top X - y`);
  await expect(ex.locator("[data-feedback]")).toContainText("Пока нет.");
  await expect(ex.locator("[data-feedback]")).toContainText("Произведение 3\u202f×\u202f7 на 1\u202f×\u202f3");

  await enter(ex, String.raw`X\theta - y`);
  await expect(ex.locator("[data-feedback]")).toContainText("Форма ответа 7 × 1, а нужна 3 × 1");

  await enter(ex, String.raw`X^\top(X\theta - y)`);
  await expect(ex.locator("[data-feedback]")).toContainText("Верно.");
  await expect(ex.locator("math-field")).toHaveClass(/is-right/);
  await expectNoAxeViolations(page);
});

test("непонятная запись — подсказка, а не попытка", async ({ page }) => {
  await page.goto(url);
  const ex = page.locator("[data-exercise][data-item='v1.gradient-formula']");
  await ex.scrollIntoViewIfNeeded();
  await enter(ex, "");
  await expect(ex.locator("[data-feedback]")).toContainText("Введите формулу");
  const journal = await page.evaluate(() => localStorage.getItem("mlf:journal:v1") ?? "[]");
  expect(journal).not.toContain("v1.gradient-formula");
});

test("вывод по шагам: первая неверная строка отмечена, верный вывод доходит до цели", async ({ page }) => {
  await page.goto(url);
  const ex = page.locator("[data-exercise][data-item='v1.derive-steps']");
  await ex.scrollIntoViewIfNeeded();
  const fields = ex.locator("[data-step-row] math-field");
  await expect(fields).toHaveCount(6);
  const set = (i: number, tex: string) => fields.nth(i).evaluate((el, value) => ((el as HTMLElement & { value: string }).value = value), tex);
  await set(0, String.raw`= \tfrac12 (\theta^\top X^\top X\theta - 2 y^\top X\theta + y^\top y)`);
  await set(1, String.raw`\nabla_\theta J = X^\top X\theta + X^\top y`);
  await ex.getByRole("button", { name: "Проверить" }).click();
  await expect(ex.locator("[data-feedback]")).toContainText("Строка 3: ошибка.");
  await expect(fields.nth(0)).toHaveClass(/is-right/);
  await expect(fields.nth(1)).toHaveClass(/is-wrong/);
  await expect(ex.locator("[data-row-msg]:visible")).toContainText("Похоже на типичную ошибку. Знак");

  await set(1, String.raw`\nabla_\theta J = X^\top X\theta - X^\top y`);
  await set(2, String.raw`X^\top X\theta = X^\top y`);
  await ex.getByRole("button", { name: "Проверить" }).click();
  await expect(ex.locator("[data-feedback]")).toContainText("Все строки верны.");
  await ex.getByRole("button", { name: "Добавить строку" }).click();
  await set(3, String.raw`\theta = (X^\top X)^{-1} X^\top y`);
  await ex.getByRole("button", { name: "Проверить" }).click();
  await expect(ex.locator("[data-feedback]")).toContainText("Вывод верен и доведён до цели.");
  await expectNoAxeViolations(page);
});

test("типичная ошибка называется прямо; варианты задачи из правила — правило и его ошибки", async ({ page }) => {
  await page.goto(url);
  const ex = page.locator("[data-exercise][data-item='v1.gradient-formula']");
  await ex.scrollIntoViewIfNeeded();
  await enter(ex, String.raw`2X^\top(X\theta - y)`);
  await expect(ex.locator("[data-feedback]")).toContainText("Похоже на типичную ошибку. Потерян множитель");

  const steps = page.locator("[data-exercise][data-item='v1.derive-steps']");
  const field = steps.locator("[data-step-row] math-field").first();
  await field.evaluate((el) => ((el as HTMLElement & { value: string }).value = String.raw`= \tfrac12 (\theta^\top X^\top X\theta - y^\top X\theta + y^\top y)`));
  await steps.getByRole("button", { name: "Проверить" }).click();
  await expect(steps.locator("[data-row-msg]:visible")).toContainText("Потеряна двойка");

  const choice = page.locator("[data-exercise][data-item='v1.transpose-product']");
  await expect(choice.locator("[data-option]")).toHaveCount(3);
  await choice.locator("[data-option]").filter({ hasText: "X⊤θ⊤" }).click();
  await expect(choice.locator("[data-feedback]")).toContainText("Транспонирование без смены порядка");
});

