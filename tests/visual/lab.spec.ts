// Визуальная регрессия витрины /lab: страница целиком в обеих темах, 1440 и 390 px.
// Только в CI (VISUAL=1, образ mcr.microsoft.com/playwright:v1.56.1-noble): локальный рендер отличается.
// Эталоны — tests/visual/__screenshots__/<проект>/; обновлять осознанно (.github/workflows/visual.yml, update=true) с записью в журнале.
import { expect, test } from "@playwright/test";
import { layoutPages, setMode } from "../e2e/support";

test.skip(!process.env.VISUAL, "визуальные эталоны сравниваются только в CI: VISUAL=1");

for (const theme of ["light", "dark"] as const) {
  test(`lab ${theme}`, async ({ page }) => {
    await setMode(page, { theme });
    await page.goto(layoutPages.lab);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot(`lab-${theme}.png`, { fullPage: true });
  });
}
