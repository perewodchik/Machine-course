// Ячейки сверки со scikit-learn в уроках 1.1, 1.3–1.6 (S7.12; урок 1.2 — в lesson-ml-1-2.spec.ts): в браузере идёт
// scikit-learn из Pyodide, и вывод совпадает с тем, что закрепляет code/tests/test_sklearn_cells.py.
import { expect, test } from "@playwright/test";

const CELLS: [string, string][] = [
  ["/ml-basics/linear-models/learning-problem/", "веса совпали с LinearRegression: True\nRMSE: наш 0.8181, sklearn 0.8181\nMAE:  наш 0.6548, sklearn 0.6548\n"],
  ["/ml-basics/linear-models/features-lwr/", "признаки совпали с PolynomialFeatures: True\nстепень 2: RMSE вал. наша 19.20, sklearn 19.20\nстепень 4: RMSE вал. наша 11.98, sklearn 11.98\nстепень 9: RMSE вал. наша 12.52, sklearn 12.52\n"],
  ["/ml-basics/linear-models/logistic-regression/", "Ньютон:            [-0.422  7.418 -1.033]\nLogisticRegression: [-0.422  7.418 -1.033]\nпо умолчанию (C=1): [-0.178  4.041 -0.574]\n"],
  ["/ml-basics/linear-models/perceptron-softmax/", "Perceptron из sklearn на разделимых классах, доля верных: 1.0\nвероятности softmax совпали с LogisticRegression до 10⁻³: True\n"],
  ["/ml-basics/linear-models/glm/", "Ньютон:           [ 1.506  0.122 -2.42   0.01 ]\nPoissonRegressor: [ 1.506  0.122 -2.42   0.01 ]\nпо умолчанию:     [-0.707  0.119 -0.144  0.011]\n"],
];

for (const [url, output] of CELLS) {
  test(`${url}: ячейка сверки со scikit-learn`, async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Python в браузере одинаков на любой ширине: хватает одного прогона");
    test.setTimeout(180_000);
    await page.goto(url);
    const cell = page.locator("[data-py-cell]").filter({ hasText: "sklearn" }).last();
    await cell.getByRole("button", { name: "Запустить" }).click();
    await expect(cell.locator("[data-py-status]")).toHaveText(/^готово/, { timeout: 150_000 });
    await expect(cell.locator("[data-py-output]")).toHaveText(output);
  });
}
