// Непрерывные распределения: плотность интегрируется в 1, F' = p, моменты по формулам совпадают с интегралами,
// правило 68–95–99.7 для нормального.
import { describe, expect, it } from "vitest";
import { betaFn, cdf, contMoments, erf, lgamma, pdf, type ContId, type ContParams } from "./continuous";

const cases: [ContId, ContParams, [number, number]][] = [
  ["uniform", { a: -1, b: 3 }, [-1, 3]],
  ["exponential", { lambda: 2 }, [0, 20]],
  ["normal", { mu: 1, sigma: 2 }, [-19, 21]],
  ["laplace", { mu: 0.5, b: 1.5 }, [-40, 40]],
  ["logistic", { mu: -1, s: 0.8 }, [-40, 40]],
  ["beta", { alpha: 2, beta: 5 }, [0, 1]],
];

const integrate = (f: (x: number) => number, a: number, b: number, n = 20000) => {
  let s = 0;
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h) * h;
  return s;
};

describe("непрерывные распределения", () => {
  it.each(cases)("%s: ∫p = 1, моменты по формулам, F' = p", (id, p, [a, b]) => {
    expect(integrate((x) => pdf(id, p, x), a, b)).toBeCloseTo(1, 4);
    const m = contMoments(id, p);
    expect(integrate((x) => x * pdf(id, p, x), a, b)).toBeCloseTo(m.mean, 3);
    expect(integrate((x) => (x - m.mean) ** 2 * pdf(id, p, x), a, b)).toBeCloseTo(m.variance, 2);
    const x0 = (id === "uniform" ? 0.7 : id === "beta" ? 0.3 : 0.4);
    const h = 1e-4;
    expect((cdf(id, p, x0 + h) - cdf(id, p, x0 - h)) / (2 * h)).toBeCloseTo(pdf(id, p, x0), 3);
  });

  it("erf и правило 68–95–99.7", () => {
    expect(erf(0)).toBeCloseTo(0, 7);
    expect(erf(1)).toBeCloseTo(0.8427007929, 6);
    const P = (k: number) => cdf("normal", { mu: 3, sigma: 2 }, 3 + 2 * k) - cdf("normal", { mu: 3, sigma: 2 }, 3 - 2 * k);
    expect(P(1)).toBeCloseTo(0.6827, 3);
    expect(P(2)).toBeCloseTo(0.9545, 3);
    expect(P(3)).toBeCloseTo(0.9973, 3);
  });

  it("Γ и B: Γ(5) = 24, B(2, 5) = 1/30", () => {
    expect(Math.exp(lgamma(5))).toBeCloseTo(24, 9);
    expect(betaFn(2, 5)).toBeCloseTo(1 / 30, 12);
  });

  it("функция распределения логистического — сигмоида", () => {
    for (const x of [-2, 0, 1.5]) expect(cdf("logistic", { mu: 0, s: 1 }, x)).toBeCloseTo(1 / (1 + Math.exp(-x)), 12);
  });
});
