// «Скульптор Σ»: на любом seed и уровне бот с выборочными оценками проходит уровень (бегунки достаточно мелкие),
// начальная догадка не проходит, недоступные бегунки не двигаются, подсказка называет худший параметр.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { divergence, LEVELS, sigmaSculptor, solve, TOL } from "./model";

const level = (seed: number, l: number) => sigmaSculptor.generate(rng(seed * 1000 + l), l + 1);

describe("скульптор Σ", () => {
  it("на любом seed и уровне бот проходит, начальная догадка — нет", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        let s = sigmaSculptor.init(level(seed, l), rng(1));
        expect(divergence(s.level, s.guess)).toBeGreaterThan(TOL);
        for (const a of solve(s)) s = sigmaSculptor.step(s, a);
        expect(sigmaSculptor.status(s)).toBe("solved");
        expect(s.checks[0]!).toBeLessThanOrEqual(TOL);
        expect(sigmaSculptor.score(s)).toBeGreaterThan(0.5);
      }),
      { numRuns: 80 },
    );
  });

  it("на уровне «оси» ρ не двигается; ошибочная проверка объясняет, что не так", () => {
    let s = sigmaSculptor.init(level(5, 0), rng(1));
    s = sigmaSculptor.step(s, { type: "set", param: "rho", value: 0.5 });
    expect(s.guess.rho).toBe(0);
    // σ₂ — точно по облаку, σ₁ — втрое больше: худший параметр — σ₁
    s = sigmaSculptor.step(s, { type: "set", param: "s2", value: Math.sqrt(s.level.S[2]) });
    s = sigmaSculptor.step(s, { type: "set", param: "s1", value: Math.min(3, 3 * Math.sqrt(s.level.S[0])) });
    s = sigmaSculptor.step(s, { type: "check" });
    expect(s.solved).toBe(false);
    expect(sigmaSculptor.feedback(s)).toMatch(/^KL = .* Разброс по x₁ великоват\.$/);
  });
});
