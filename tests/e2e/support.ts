// Общие помощники e2e: режимы страницы (тема, поля) и проверка доступности axe.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type Theme = "light" | "dark";
export type Margins = "visible" | "hidden";

/** Страницы, на которых проверяется раскладка: каталог, курс, уроки среза, демо-урок, демо формул, витрина, игры. */
export const layoutPages = {
  home: "/",
  course: "/foundations/",
  lesson: "/foundations/bridge/linear-regression/",
  demo: "/demo/lesson/",
  math: "/demo/math/",
  lab: "/lab/",
  // срез этапа 2 (S2.11): ещё два урока и обе игры
  i4: "/foundations/linear-algebra/matrix-as-map/",
  iii3: "/foundations/probability/bayes/",
  puzzle: "/games/matrix-puzzle/",
  detective: "/games/bayes-detective/",
  // этап 3: урок 0.2 с диагностикой
  start2: "/foundations/start/how-the-course-works/",
  map: "/map/",
  start1: "/foundations/start/regression-by-hand/",
  fitgame: "/games/fit-line/",
  start3: "/foundations/start/language-of-math/",
  start4: "/foundations/start/sums-products-indicators/",
  sumgame: "/games/sum-translator/",
  start5: "/foundations/start/exp-log-sigmoid/",
  undergame: "/games/underflow/",
  concept: "/concepts/la.dot-product/",
} as const;

/** Ставит тему и поля в localStorage до загрузки страницы — как их оставил бы ученик. */
export async function setMode(page: Page, mode: { theme?: Theme; margins?: Margins }): Promise<void> {
  await page.addInitScript((m) => {
    if (m.theme) localStorage.setItem("theme", m.theme);
    if (m.margins) localStorage.setItem("margins", m.margins);
  }, mode);
}

/** Проверка axe по WCAG 2.2 A и AA; в сообщении — правило и селекторы, чтобы сразу найти элемент. */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  // ширина формул и текста окончательна только после загрузки шрифтов
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}
