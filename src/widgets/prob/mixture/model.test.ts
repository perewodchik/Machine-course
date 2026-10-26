// Смесь: плотность интегрируется в 1, ответственности в сумме 1 и равны прямой формуле Байеса, устойчивы при
// далёких x; моменты по формуле совпадают с интегралами; дисперсия смеси больше дисперсии взвешенной суммы.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { density, mixMoments, parts, resp1, type Mix } from "./model";

const mixArb = fc.record({
  phi: fc.double({ min: 0.05, max: 0.95, noNaN: true }),
  mu1: fc.double({ min: -3, max: 3, noNaN: true }),
  s1: fc.double({ min: 0.3, max: 2, noNaN: true }),
  mu2: fc.double({ min: -3, max: 3, noNaN: true }),
  s2: fc.double({ min: 0.3, max: 2, noNaN: true }),
});

const integrate = (f: (x: number) => number) => {
  let s = 0;
  for (let x = -20; x <= 20; x += 0.01) s += f(x) * 0.01;
  return s;
};

describe("смесь двух гауссиан", () => {
  it("для любых параметров: ∫ p = 1, моменты совпадают с интегралами", () => {
    fc.assert(
      fc.property(mixArb, (m: Mix) => {
        expect(integrate((x) => density(m, x))).toBeCloseTo(1, 4);
        const { mean, variance } = mixMoments(m);
        expect(integrate((x) => x * density(m, x))).toBeCloseTo(mean, 3);
        expect(integrate((x) => (x - mean) ** 2 * density(m, x))).toBeCloseTo(variance, 3);
        // взвешенная сумма φY₁ + (1 − φ)Y₂ независимых компонент разбросана меньше смеси
        expect(variance).toBeGreaterThan(m.phi ** 2 * m.s1 ** 2 + (1 - m.phi) ** 2 * m.s2 ** 2);
      }),
      { numRuns: 40 },
    );
  });

  it("ответственность — формула Байеса, в сумме с дополнением 1, устойчива при x = 200", () => {
    fc.assert(
      fc.property(mixArb, fc.double({ min: -5, max: 5, noNaN: true }), (m, x) => {
        const [a, b] = parts(m, x);
        expect(resp1(m, x)).toBeCloseTo(a / (a + b), 9);
      }),
    );
    const m: Mix = { phi: 0.5, mu1: 0, s1: 1, mu2: 3, s2: 1 };
    expect(density(m, 200)).toBe(0);
    expect(resp1(m, 200)).toBeCloseTo(0, 12);
    expect(Number.isNaN(resp1(m, 200))).toBe(false);
    expect(resp1(m, 1.5)).toBeCloseTo(0.5, 12);
  });
});
