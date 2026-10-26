// «Активное и неактивное ограничение»: KKT-решение совпадает с перебором допустимых точек, α·g = 0,
// слабая двойственность d(α) ≤ p* для всех α ≥ 0 и сильная: max d = p*.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { dual, g, primal, PROBLEM, solve } from "./model";

describe("KKT", () => {
  it("неактивное: c допустима — x* = c, α = 0; активное: x* на границе, α > 0", () => {
    const inside = solve(PROBLEM, [0, 0]);
    expect(inside).toEqual({ x: [0, 0], alpha: 0, active: false });
    const out = solve(PROBLEM, [2, 1]);
    // g(c) = 2, ‖a‖² = 2: α = 1, x* = (1, 0)
    expect(out.alpha).toBe(1);
    expect(out.x).toEqual([1, 0]);
    expect(g(PROBLEM, out.x)).toBe(0);
  });

  it("дополняющая нежёсткость, слабая и сильная двойственность на случайных c", () => {
    fc.assert(
      fc.property(fc.double({ min: -3, max: 3, noNaN: true }), fc.double({ min: -3, max: 3, noNaN: true }), fc.double({ min: 0, max: 5, noNaN: true }), (c1, c2, alpha) => {
        const c = [c1, c2] as const;
        const s = solve(PROBLEM, c);
        expect(g(PROBLEM, s.x)).toBeLessThanOrEqual(1e-12);
        expect(Math.abs(s.alpha * g(PROBLEM, s.x))).toBeLessThan(1e-9);
        const p = primal(c, s.x);
        expect(dual(PROBLEM, c, alpha)).toBeLessThanOrEqual(p + 1e-9);
        expect(dual(PROBLEM, c, s.alpha)).toBeCloseTo(p, 9);
      }),
    );
  });

  it("x* — ближайшая допустимая точка: перебор сетки не находит лучше", () => {
    const c = [1.7, 0.9] as const;
    const s = solve(PROBLEM, c);
    let best = Infinity;
    for (let i = -300; i <= 300; i++)
      for (let j = -300; j <= 300; j++) {
        const x = [i / 100, j / 100] as const;
        if (g(PROBLEM, x) <= 0) best = Math.min(best, primal(c, x));
      }
    expect(primal(c, s.x)).toBeLessThanOrEqual(best + 1e-12);
  });
});
