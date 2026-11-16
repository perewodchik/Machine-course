// Ревью курса «Основы ML» (S7.07): все страницы курса — уроки 1.1–2.5, страница курса, проекты и игры модуля 2 —
// без нарушений axe в светлой и тёмной теме и без горизонтальной прокрутки на телефоне.
import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./support";

const PAGES = [
  "/ml-basics/",
  "/ml-basics/linear-models/learning-problem/",
  "/ml-basics/linear-models/linear-regression-lms/",
  "/ml-basics/linear-models/features-lwr/",
  "/ml-basics/linear-models/logistic-regression/",
  "/ml-basics/linear-models/perceptron-softmax/",
  "/ml-basics/linear-models/glm/",
  "/ml-basics/evaluation/classification-metrics/",
  "/ml-basics/evaluation/bias-variance/",
  "/ml-basics/evaluation/regularization/",
  "/ml-basics/evaluation/model-selection/",
  "/ml-basics/evaluation/ml-practice/",
  "/projects/p1-house-prices/",
  "/projects/p2-bank-marketing/",
];

for (const url of PAGES) {
  for (const theme of ["light", "dark"] as const) {
    test(`${url} — ${theme}: axe, нет горизонтальной прокрутки`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.goto(url);
      // острова client:visible оживают при прокрутке: проходим страницу целиком, затем ждём гидратации
      const height = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < height; y += 400) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(60);
      }
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => window.scrollTo(0, 0));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await expectNoAxeViolations(page);
    });
  }
}
