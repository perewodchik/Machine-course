// «Переводчик сумм» (урок 0.4): уровень проходится с клавиатуры, нестыкующиеся множители названы до проверки,
// равная запись (yᵀAᵀx вместо xᵀAy) принимается; партия по ссылке ?seed=&level= совпадает с моделью. axe.
import { expect, test } from "@playwright/test";
import { sumTranslator } from "../../src/games/sum-translator/model";
import { rng } from "../../src/lib/math/rng";
import { expectNoAxeViolations } from "./support";

const SEED = 3;
const levelOf = (k: number) => sumTranslator.generate(rng(SEED * 1000 + k - 1), k);

test("строка, матрица, столбец: ошибка порядка видна сразу, равная запись принимается, журнал", async ({ page }) => {
  await page.goto(`/games/sum-translator/?seed=${SEED}&level=4`);
  await expect(page.locator(".game__level")).toHaveText(/^Уровень 4 из 7: строка, матрица, столбец/);
  const level = levelOf(4);
  const rows = (name: string) => level.tiles.find((t) => t.name === name)!.rows;
  await expect(page.locator(".game-sum__math .visually-hidden").first()).toHaveText(`сумма по i от 1 до ${rows("x")}, сумма по j от 1 до ${rows("y")}: x i на A i j на y j`);
  await expectNoAxeViolations(page);

  const add = (name: string) => page.getByRole("button", { name: `Добавить ${name}` });
  await add("x").press("Enter");
  await add("A").press("Enter");
  await expect(page.locator(".game-sum__size")).toHaveText(`У x столбцов 1, а у A строк ${rows("A")} — не перемножить.`);
  await page.getByRole("button", { name: "Очистить" }).press("Enter");

  // yᵀAᵀx — та же сумма, что xᵀAy
  await add("y").press("Enter");
  await page.getByRole("button", { name: "Транспонировать y" }).press("Space");
  await add("A").press("Enter");
  await page.getByRole("button", { name: "Транспонировать A" }).press("Enter");
  await add("x").press("Enter");
  await expect(page.locator(".game-sum__size")).toHaveText("Получается число.");
  await page.getByRole("button", { name: "Проверить" }).press("Enter");
  await expect(page.locator(".game__feedback")).toHaveText("Верно: yᵀ Aᵀ x — та же сумма.");
  await expect(page.getByRole("button", { name: "Следующий уровень" })).toBeFocused();
  await expect(page.locator(".game__debrief")).toContainText("Какой множитель отвечает за индекс i");

  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("mlf:journal:v1") ?? "[]"));
  expect(journal.at(-1)).toMatchObject({ type: "game", gameId: "nota.sum-translator", seed: SEED, level: 4, solved: true, actions: 1, hints: 0 });
  // на телефоне фокус на «Следующий уровень» прокручивает страницу, и липкая шапка накрывает кнопки уровней:
  // axe счёл бы их слишком маленькими — проверяем страницу в начальном положении
  await page.evaluate(() => window.scrollTo(0, 0));
  await expectNoAxeViolations(page);
});

test("Xᵀy: без транспонирования — другой размер, подсказка ведёт к ответу", async ({ page }) => {
  await page.goto(`/games/sum-translator/?seed=${SEED}&level=6`);
  const level = levelOf(6);
  const x = level.tiles.find((t) => t.name === "X")!;
  await page.getByRole("button", { name: "Добавить X" }).click();
  await expect(page.locator(".game-sum__size")).toHaveText(`Получается матрица ${x.rows}\u00a0×\u00a0${x.cols}.`);
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.locator(".game__feedback")).toContainText(`Получилось: матрица ${x.rows}\u00a0×\u00a0${x.cols}, а нужно: столбец из ${x.cols} чисел.`);
  // подсказки по одной: следующая кнопка появляется после того, как показана предыдущая
  for (let k = 1; k <= 3; k++) {
    await page.getByRole("button", { name: /Подсказка/ }).click();
    await expect(page.locator(".game__hint")).toContainText(`Подсказка ${k}.`);
  }
  await expect(page.locator(".game__hint")).toHaveText("Подсказка 3. Ответ: Xᵀ y.");
  await page.getByRole("button", { name: "Транспонировать X" }).click();
  await page.getByRole("button", { name: "Добавить y" }).click();
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.locator(".game__feedback")).toHaveText("Верно: Xᵀ y — та же сумма, с 2-й проверки.");
});
