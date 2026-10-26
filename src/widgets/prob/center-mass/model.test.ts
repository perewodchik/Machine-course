// «Матожидание как центр масс»: LOTUS, Var = E X² − (E X)², рычаг уравновешен в E X, разрыв Йенсена для x² = Var.
import fc from "fast-check";
import { describe, expect as want, it } from "vitest";
import { expect, probs, VALUES, variance } from "./model";

describe("матожидание и дисперсия", () => {
  it("равномерное на 0–4: E X = 2, Var X = 2", () => {
    const p = probs([1, 1, 1, 1, 1]);
    want(expect(p)).toBeCloseTo(2, 12);
    want(variance(p)).toBeCloseTo(2, 12);
  });

  it("для любых весов: Var = E X² − (E X)²; момент сил относительно E X — ноль; Йенсен для x²", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 5, maxLength: 5 }), (w) => {
        const p = probs(w);
        const m = expect(p);
        want(variance(p)).toBeCloseTo(expect(p, (x) => x * x) - m * m, 9);
        want(VALUES.reduce((s, x, i) => s + (x - m) * p[i]!, 0)).toBeCloseTo(0, 9);
        want(expect(p, (x) => x * x)).toBeGreaterThanOrEqual(m * m - 1e-12);
        // Var(aX + b) = a² Var X
        want(expect(p, (x) => (3 * x + 1 - (3 * m + 1)) ** 2)).toBeCloseTo(9 * variance(p), 9);
      }),
    );
  });
});
