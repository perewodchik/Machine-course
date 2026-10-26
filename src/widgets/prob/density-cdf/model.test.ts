// «Плотность и CDF»: F совпадает с известными формулами, PMF суммируется в 1, плотность равномерного больше 1.
import { describe, expect, it } from "vitest";
import { cdf, DIST_IDS, DISTS } from "./model";

describe("функции распределения", () => {
  it("биномиальная: F(2) = 11/16, всего 1", () => {
    expect(cdf(DISTS.binomial, 2)).toBeCloseTo(11 / 16, 12);
    expect(cdf(DISTS.binomial, 1.5)).toBeCloseTo(5 / 16, 12);
    expect(cdf(DISTS.binomial, 4)).toBeCloseTo(1, 12);
  });

  it("равномерное на [0, 0.5]: плотность 2 > 1, F(0.25) = 0.5", () => {
    expect(DISTS.uniform.pdf!(0.2)).toBe(2);
    expect(cdf(DISTS.uniform, 0.25)).toBeCloseTo(0.5, 9);
    expect(cdf(DISTS.uniform, 0.9)).toBeCloseTo(1, 9);
  });

  it("показательное: F(t) = 1 − e^(−t); нормальное: F(0) = ½, F(1.96) ≈ 0.975", () => {
    for (const t of [0.5, 1, 2, 4]) expect(cdf(DISTS.exponential, t)).toBeCloseTo(1 - Math.exp(-t), 8);
    expect(cdf(DISTS.normal, 0)).toBeCloseTo(0.5, 4);
    expect(cdf(DISTS.normal, 1.96)).toBeCloseTo(0.975, 3);
  });

  it.each(DIST_IDS)("%s: F не убывает от 0 до 1", (id) => {
    const d = DISTS[id];
    let prev = -1;
    for (let i = 0; i <= 50; i++) {
      const v = cdf(d, d.x[0] + ((d.x[1] - d.x[0]) * i) / 50);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = v;
    }
    // у показательного на правом краю рисунка F(5) = 1 − e⁻⁵ ≈ 0.993
    expect(prev).toBeGreaterThan(0.99);
  });
});
