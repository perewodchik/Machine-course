// Метрики классификации урока 2.1 «Основ ML»: AUC по рангам совпадает с подсчётом пар, AP — ступеньками, F₁ — через
// точность и полноту, корзины надёжности. Сверка со scikit-learn — в code/tests/test_classification_metrics.py.
import { describe, expect, it } from "vitest";
import { aucRanks, averagePrecision, brier, confusion, f1, precision, recall, reliability, rocAuc } from "./classification";
describe("PR, AP, Брайер, надёжность, AUC по рангам", () => {
  const s = [0.9, 0.8, 0.8, 0.6, 0.4, 0.3, 0.3, 0.1];
  const y = [1, 1, 0, 1, 0, 1, 0, 0];
  it("AUC по рангам равен доле правильно упорядоченных пар", () => {
    expect(aucRanks(s, y)).toBeCloseTo(rocAuc(s, y), 12);
  });
  it("AP ступеньками и F₁ по счётчикам", () => {
    // вручную: пороги 0.9 → (¼, 1), 0.8 → (½, ⅔), 0.6 → (¾, ¾), 0.3 → (1, 4/7)
    expect(averagePrecision(s, y)).toBeCloseTo(0.25 * 1 + 0.25 * (2 / 3) + 0.25 * 0.75 + 0.25 * (4 / 7), 12);
    const c = confusion(s, y, 0.5);
    expect(f1(c)).toBeCloseTo((2 * precision(c) * recall(c)) / (precision(c) + recall(c)), 12);
  });
  it("Брайер и корзины надёжности", () => {
    expect(brier([1, 0], [1, 0])).toBe(0);
    const r = reliability(s, y, 2);
    expect(r.map((b) => b.n)).toEqual([4, 4]);
    expect(r[1]!.frac).toBeCloseTo(0.75, 12);
  });
});
