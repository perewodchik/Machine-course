// Python в уроке (S2.05): Pyodide в Web Worker со своего домена, «Стоп» через SharedArrayBuffer, правка кода,
// трассировка без кадров Pyodide. Ячейки — в демо-уроке (сниппет V.1) и на /lab (цикл и ошибка).
import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectNoAxeViolations, layoutPages } from "./support";

// первый запуск загружает ~16 MB и инициализирует Python
const BOOT = 90_000;
test.describe.configure({ timeout: 180_000 });

const cells = (page: Page) => page.locator("[data-py-cell]");
const status = (cell: Locator) => cell.locator("[data-py-status]");
const output = (cell: Locator) => cell.locator("[data-py-output]");

test("ячейка урока выполняет сниппет и печатает θ; Python грузится со своего домена", async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on("request", (req) => {
    if (!req.url().startsWith(baseURL!) && !req.url().startsWith("data:") && !req.url().startsWith("blob:")) foreign.push(req.url());
  });
  await page.goto(layoutPages.demo);
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  const cell = cells(page).first();
  await expect(cell.locator("[data-py-view]")).toContainText("def normal_equations");
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(status(cell)).toHaveText(/загружаем Python/);
  await expect(status(cell)).toHaveText(/^готово/, { timeout: BOOT });
  await expect(output(cell)).toHaveText("θ = [0.798 0.548]\nсовпадает с lstsq: True\n");
  await expect(cell.locator("[data-py-time]")).toHaveText(/^\d+(\.\d)? с$/);
  expect(foreign).toEqual([]);

  // повторный запуск: Python уже загружен, у ячейки свежее пространство имён
  await cell.getByRole("button", { name: "Запустить" }).click();
  await expect(status(cell)).toHaveText(/^готово/);
  await expect(output(cell)).toHaveText("θ = [0.798 0.548]\nсовпадает с lstsq: True\n");
});

test("«Стоп» прерывает бесконечный цикл, Python остаётся живым; ошибка — без кадров Pyodide", async ({ page }) => {
  let wasm = 0;
  page.on("request", (req) => void (req.url().endsWith("/pyodide.asm.wasm") && wasm++));
  await page.goto(layoutPages.lab);
  // на /lab первая — листинг PyCode без запуска, он не ячейка
  const [loop, broken] = await cells(page).all();
  await loop.getByRole("button", { name: "Запустить" }).click();
  await expect(status(loop)).toHaveText("выполняется…", { timeout: BOOT });
  await page.waitForTimeout(500); // цикл точно крутится
  await loop.getByRole("button", { name: "Стоп" }).click();
  await expect(status(loop)).toHaveText("остановлено");
  await expect(output(loop)).toHaveText("Выполнение остановлено.");
  await expect(loop.getByRole("button", { name: "Запустить" })).toBeVisible();

  // интерпретатор не перезапускался: следующая ячейка выполняется сразу
  await broken.getByRole("button", { name: "Запустить" }).click();
  await expect(status(broken)).toHaveText("ошибка в строке 5, подробности ниже");
  await expect(output(broken)).toContainText("ValueError: matmul");
  await expect(output(broken)).toContainText('File "<ячейка>", line 5');
  await expect(output(broken)).not.toContainText("_pyodide");
  expect(wasm, "после «Стоп» Python не перезагружался").toBe(1);
  await expectNoAxeViolations(page);
});

test("«Изменить»: правка выполняется, Ctrl+Enter запускает, «Вернуть как было» возвращает исходный код", async ({ page }) => {
  await page.goto(layoutPages.lab);
  const loop = cells(page).first();
  await loop.getByRole("button", { name: "Изменить" }).click();
  const editor = loop.getByRole("textbox", { name: /Код ячейки/ });
  await expect(editor).toBeFocused();
  await editor.fill("print(sum(range(10)))");
  await editor.press("Control+Enter");
  await expect(output(loop)).toHaveText("45\n", { timeout: BOOT });
  await loop.getByRole("button", { name: "Вернуть как было" }).click();
  await expect(editor).toBeHidden();
  await expect(loop.locator("[data-py-view]")).toContainText("while True");
});

test("без JavaScript видна программа, кнопок запуска нет", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(layoutPages.demo);
  const cell = cells(page).first();
  await expect(cell.locator("[data-py-view]")).toContainText("np.linalg.solve");
  await expect(cell.getByRole("button", { name: "Запустить" })).toBeHidden();
  await expect(cell.getByRole("link", { name: /Открыть в Colab/ })).toBeVisible();
  await context.close();
});
