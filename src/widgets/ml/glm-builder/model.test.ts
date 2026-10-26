// «Конструктор GLM»: оптимальные веса — максимум ℓ (соседние хуже); у Пуассона веса совпадают с прямым расчётом
// градиента X^T(y − λ) = 0; тождественный отклик у Пуассона даёт отрицательную λ, и ℓ не определён; распределения
// p(y | x) нормированы.
import { describe, expect, it } from "vitest";
import { categoricalProbs, DATA, distribution, fitted, meanLogLik, predict, type Dist } from "./model";

describe("конструктор GLM", () => {
  it("fitted — максимум ℓ для нормального, Бернулли и Пуассона", () => {
    for (const d of ["normal", "bernoulli", "poisson"] as Dist[]) {
      const t = fitted(d);
      const best = meanLogLik(d, t)!;
      for (const [a, b] of [[0.01, 0], [0, 0.001], [-0.01, 0], [0, -0.001]]) expect(meanLogLik(d, [t[0]! + a!, t[1]! + b!])!).toBeLessThan(best);
    }
  });

  it("Пуассон: градиент Xᵀ(y − λ) в оптимуме — ноль; тождественный отклик даёт λ < 0", () => {
    const t = fitted("poisson");
    const { x, y } = DATA.poisson;
    const g0 = x.reduce((s, v, i) => s + y[i]! - predict("poisson", t, v), 0);
    const g1 = x.reduce((s, v, i) => s + (y[i]! - predict("poisson", t, v)) * v, 0);
    expect(Math.abs(g0) + Math.abs(g1)).toBeLessThan(1e-6);
    expect(predict("poisson", [-1, 0.3], 0, false)).toBeLessThan(0);
    expect(meanLogLik("poisson", [-1, 0.3], false)).toBeNull();
    expect(distribution("poisson", [-1, 0.3], 0, false)).toEqual([]);
  });

  it("распределения нормированы; вероятности сегментов в сумме — 1, большая площадь — бизнес", () => {
    const sum = (v: { p: number }[]) => v.reduce((a, b) => a + b.p, 0);
    expect(sum(distribution("bernoulli", fitted("bernoulli"), 70))).toBeCloseTo(1, 12);
    expect(sum(distribution("poisson", [1, 0], 0))).toBeCloseTo(1, 6);
    expect(sum(distribution("normal", [0, 0], 0)) / 5).toBeCloseTo(1, 3);
    const p = categoricalProbs(115);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(p.indexOf(Math.max(...p))).toBe(2);
  });
});
