// Помощник скриншотов для ревью дизайна: страницы × (1440 и 390 px — проекты) × темы × поля.
// Запуск: SCREENSHOTS=1 npx playwright test screens; снимки — test-screens/ (не test-results: его Playwright очищает при каждом запуске).
// Это не визуальная регрессия: эталоны снимаются только в CI (docs/implementation/context/testing-ci.md).
import { test } from "@playwright/test";
import { layoutPages, setMode, type Margins, type Theme } from "./support";

test.skip(!process.env.SCREENSHOTS, "скриншоты только по запросу: SCREENSHOTS=1");

const themes: Theme[] = ["light", "dark"];
const margins: Margins[] = ["visible", "hidden"];

for (const [name, path] of Object.entries(layoutPages)) {
  for (const theme of themes) {
    // поля есть только у страниц урока
    for (const m of name === "lesson" || name === "demo" ? margins : (["visible"] as const)) {
      test(`${name} ${theme} ${m}`, async ({ page }, info) => {
        await setMode(page, { theme, margins: m });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const file = `test-screens/${info.project.name}-${name}-${theme}${m === "hidden" ? "-no-margins" : ""}.png`;
        await page.screenshot({ path: file, fullPage: name !== "course" });
      });
    }
  }
}

test("оглавление открыто", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "выдвижная панель — на узком экране");
  await page.goto(layoutPages.demo);
  await page.getByRole("button", { name: "Оглавление курса" }).click();
  await page.screenshot({ path: `test-screens/${info.project.name}-toc-open.png` });
});
