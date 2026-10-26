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
  iii1: "/foundations/probability/probability-space/",
  iii2: "/foundations/probability/conditional-independence/",
  iii4: "/foundations/probability/random-variables/",
  iii5: "/foundations/probability/expectation-variance/",
  iii6: "/foundations/probability/discrete-distributions/",
  iii7: "/foundations/probability/continuous-distributions/",
  iii8: "/foundations/probability/limit-theorems/",
  iii9: "/foundations/probability/joint-distributions/",
  iii10: "/foundations/probability/random-vectors/",
  iii11: "/foundations/probability/multivariate-normal/",
  iii12: "/foundations/probability/mixtures-latent/",
  iii13: "/foundations/probability/information/",
  iv1: "/foundations/statistics/descriptive/",
  iv2: "/foundations/statistics/estimators/",
  iv3: "/foundations/statistics/mle/",
  iv4: "/foundations/statistics/multivariate-mle/",
  iv5: "/foundations/statistics/exponential-family/",
  zoogame: "/games/dist-zoo/",
  corrgame: "/games/guess-correlation/",
  sigmagame: "/games/sigma-sculptor/",
  rangegame: "/games/estimator-range/",
  likegame: "/games/likelihood-machine/",
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
  start6: "/foundations/start/derivative-refresher/",
  start7: "/foundations/start/integral/",
  start8: "/foundations/start/numpy-minimum/",
  start9: "/foundations/start/notation/",
  i1: "/foundations/linear-algebra/vectors-span/",
  i2: "/foundations/linear-algebra/dot-product-norms/",
  i3: "/foundations/linear-algebra/matrix-multiplication/",
  i5: "/foundations/linear-algebra/transpose-trace/",
  i6: "/foundations/linear-algebra/systems-rank/",
  i7: "/foundations/linear-algebra/inverse-determinant/",
  i8: "/foundations/linear-algebra/orthogonality-projections/",
  eigengame: "/games/eigen-hunt/",
  i9: "/foundations/linear-algebra/eigen/",
  i10: "/foundations/linear-algebra/quadratic-forms/",
  i11: "/foundations/linear-algebra/svd-pseudoinverse/",
  i12: "/foundations/linear-algebra/capstone-least-squares/",
  // этап 4: страница прогресса с калибровкой уверенности
  progress: "/progress/",
  // модуль II
  ii1: "/foundations/calculus/gradient/",
  ii2: "/foundations/calculus/chain-rule-jacobian/",
  ii3: "/foundations/calculus/matrix-calculus/",
  ii4: "/foundations/calculus/hessian-taylor/",
  ii5: "/foundations/calculus/convexity/",
  ii6: "/foundations/calculus/gradient-descent/",
  ii7: "/foundations/calculus/newton/",
  ii8: "/foundations/calculus/lagrange/",
  ii9: "/foundations/calculus/duality-kkt/",
  ii10: "/foundations/calculus/multiple-integrals/",
  divgame: "/games/divergence/",
  foggame: "/games/foggy-descent/",
  saddlegame: "/games/min-max-saddle/",
  dimgame: "/games/dim-tetris/",
  spangame: "/games/span-hit/",
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
  // переходы цвета (.btn, 160 мс) axe иначе может поймать на полпути и насчитать ложный недостаточный контраст
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

/**
 * Ждёт гидратации островов: до неё поле игры меряет ширину заново, раскладка сдвигается, и клик попадает в соседнюю
 * кнопку (так на телефоне «Добавить X» нажимало «Добавить y»).
 */
export async function waitForIslands(page: Page): Promise<void> {
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
}

