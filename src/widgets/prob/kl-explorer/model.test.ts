// «KL между двумя распределениями»: H(p, q) = H(p) + KL(p ‖ q), KL ≥ 0 и равна нулю только при p = q,
// KL несимметрична, H(p) ≤ log 4, q = 0 при p > 0 даёт ∞.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { crossEntropy, entropy, kl, probs } from "./model";

const w = fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 4, maxLength: 4 });
const wPos = fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 4, maxLength: 4 });

describe("энтропия и KL", () => {
  it("для любых p и q > 0: H(p, q) = H(p) + KL(p ‖ q), KL ≥ 0, 0 ≤ H(p) ≤ log 4", () => {
    fc.assert(
      fc.property(w, wPos, (a, b) => {
        const p = probs(a);
        const q = probs(b);
        expect(crossEntropy(p, q)).toBeCloseTo(entropy(p) + kl(p, q), 9);
        expect(kl(p, q)).toBeGreaterThanOrEqual(-1e-12);
        expect(entropy(p)).toBeGreaterThanOrEqual(-1e-12);
        expect(entropy(p)).toBeLessThanOrEqual(Math.log(4) + 1e-12);
        expect(kl(p, p)).toBeCloseTo(0, 12);
      }),
    );
  });

  it("KL несимметрична; q = 0 при p > 0 — бесконечность", () => {
    const p = probs([4, 1, 0, 0]);
    const q = probs([1, 1, 1, 1]);
    expect(kl(p, q)).not.toBeCloseTo(kl(q, p), 2);
    expect(kl(q, p)).toBe(Infinity);
    expect(crossEntropy(q, p)).toBe(Infinity);
    expect(entropy(q)).toBeCloseTo(Math.log(4), 12);
  });
});
