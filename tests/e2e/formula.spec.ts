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
