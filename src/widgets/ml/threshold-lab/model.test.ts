// «Порог: кривые и цена»: оценки откалиброваны (кривая надёжности у диагонали); при уменьшении φ ROC-AUC почти не
// меняется, а AP падает; минимум стоимости — около t* = c_FP/(c_FP + c_FN); после возведения в куб AUC та же, Брайер
// хуже, минимум — около (t*)³.
import { describe, expect, it } from "vitest";
import { sample, summary } from "./model";

describe("порог: кривые и цена", () => {
  it("калибровка: доля положительных в корзине близка к средней оценке", () => {
    const s = summary(sample(1, 2, 0.3, false, 20_000), 1, 1);
    for (const b of s.rel.filter((r) => r.n > 400)) expect(Math.abs(b.frac - b.mean)).toBeLessThan(0.04);
  });

  it("φ 50 % → 2 %: AUC почти та же, AP падает", () => {
    const a = summary(sample(2, 2, 0.5, false, 20_000), 1, 1);
    const b = summary(sample(2, 2, 0.02, false, 20_000), 1, 1);
    expect(Math.abs(a.auc - b.auc)).toBeLessThan(0.02);
    expect(b.ap).toBeLessThan(a.ap - 0.3);
  });

  it("минимум стоимости — около t*; куб: AUC та же, Брайер хуже, минимум около (t*)³", () => {
    const x = sample(3, 2, 0.3, false, 20_000);
    const c = summary(x, 1, 9);
    expect(Math.abs(c.bestT - 0.1)).toBeLessThan(0.04);
    const cube = summary(sample(3, 2, 0.3, true, 20_000), 1, 9);
    expect(cube.auc).toBeCloseTo(c.auc, 12);
    expect(cube.brier).toBeGreaterThan(c.brier);
    expect(Math.abs(cube.bestT - 0.001)).toBeLessThan(0.01);
  });
});
