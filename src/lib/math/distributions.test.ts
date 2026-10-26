// Дискретные распределения: функции вероятности суммируются в 1, моменты по формулам совпадают с моментами по PMF.
import { describe, expect, it } from "vitest";
import { moments, pmf, support, type FamilyId, type Params } from "./distributions";

const cases: [FamilyId, Params][] = [
  ["bernoulli", { phi: 0.3 }],
  ["binomial", { n: 10, phi: 0.4 }],
  ["geometric", { phi: 0.25 }],
  ["poisson", { lambda: 3.5 }],
  ["categorical", { probs: [0.2, 0.5, 0.3] }],
];

describe("дискретные распределения", () => {
  it.each(cases)("%s: сумма PMF — 1, E и Var по формулам совпадают с суммами по PMF", (family, p) => {
    const ks = Array.from({ length: 400 }, (_, k) => k);
    const total = ks.reduce((s, k) => s + pmf(family, p, k), 0);
    expect(total).toBeCloseTo(1, 9);
    const mean = ks.reduce((s, k) => s + k * pmf(family, p, k), 0);
    const variance = ks.reduce((s, k) => s + (k - mean) ** 2 * pmf(family, p, k), 0);
    const m = moments(family, p);
    expect(m.mean).toBeCloseTo(mean, 9);
    expect(m.variance).toBeCloseTo(variance, 9);
  });

  it("у Пуассона E = Var = λ; биномиальное с большим n и малым φ близко к Пуассону с λ = nφ", () => {
    const m = moments("poisson", { lambda: 2 });
    expect(m.mean).toBe(2);
    expect(m.variance).toBe(2);
    for (const k of [0, 1, 2, 5]) expect(pmf("binomial", { n: 1000, phi: 0.002 }, k)).toBeCloseTo(pmf("poisson", { lambda: 2 }, k), 3);
  });

  it("носитель для рисунка: геометрическое с 1, Пуассон с 0, хвост за ним меньше 10⁻³", () => {
    expect(support("geometric", { phi: 0.5 })[0]).toBe(1);
    expect(support("poisson", { lambda: 3 })[0]).toBe(0);
    const s = support("poisson", { lambda: 3 });
    expect(1 - s.reduce((acc, k) => acc + pmf("poisson", { lambda: 3 }, k), 0)).toBeLessThan(1e-3);
  });
});
