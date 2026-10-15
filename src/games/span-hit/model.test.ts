// «Попади в точку»: попадание и «невозможно», минимум ходов, решаемость уровней (fast-check по seed).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { combo, det2, KINDS, LEVELS, makeLevel, optimalMoves, reachable, solutions, solve, spanHit as game, type Action, type Level, type State } from "./model";

const play = (s: State, actions: Action[]) => actions.reduce(game.step, s);
const level = (a: [number, number], b: [number, number], target: [number, number], step = 1): Level => ({ kind: "general", a, b, target, step });

describe("ходы", () => {
  it("коэффициенты меняются на шаг; попадание решает уровень и замораживает поле", () => {
    const l = level([1, 1], [1, -1], [3, 1]); // 2a + b
    const s = play(game.init(l, rng(1)), [{ type: "nudge", k: 0, dir: 1 }, { type: "nudge", k: 0, dir: 1 }, { type: "nudge", k: 1, dir: 1 }]);
    expect(combo(l.a, l.b, s.c)).toEqual([3, 1]);
    expect(game.status(s)).toBe("solved");
    expect(game.score(s)).toBe(1);
    expect(game.feedback(s)).toBe("Попали за 3 — это минимум.");
    expect(game.step(s, { type: "nudge", k: 1, dir: 1 })).toBe(s);
  });

  it("неверное «невозможно» не решает уровень и снижает счёт; верное — решает", () => {
    const l = level([1, 1], [1, -1], [3, 1]);
    const s = play(game.init(l, rng(1)), [{ type: "impossible" }]);
    expect(game.status(s)).toBe("playing");
    expect(game.feedback(s)).toMatch(/^Попасть можно: a и b не параллельны/);
    const done = play(s, solve(s));
    expect(game.score(done)).toBe(0.5);

    const out = level([1, 2], [2, 4], [1, 0]);
    expect(reachable(out)).toBe(false);
    const claimed = game.step(game.init(out, rng(1)), { type: "impossible" });
    expect(game.status(claimed)).toBe("solved");
    expect(game.feedback(claimed)).toBe("Верно: цель вне оболочки a и b — попасть нельзя.");
  });

  it("параллельные векторы: решений много, минимум — по ближайшему", () => {
    const l = level([1, 1], [2, 2], [4, 4]);
    expect(solutions(l).length).toBeGreaterThan(2);
    expect(optimalMoves(l)).toBe(2); // c₂ = 2
  });
});

describe("уровни", () => {
  it("уровни идут по KINDS, генерация детерминирована", () => {
    expect(LEVELS).toBe(KINDS.length);
    KINDS.forEach((kind, k) => expect(game.generate(rng(9 * 1000 + k), k + 1).kind).toBe(kind));
    expect(game.generate(rng(5), 2)).toEqual(game.generate(rng(5), 2));
  });

  it("каждый уровень решается ботом за минимум ходов; «параллельные» и «вне прямой» — граничные случаи", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, k) => {
        const l = game.generate(rng(seed * 1000 + k), k + 1);
        const s0 = game.init(l, rng(seed));
        const done = play(s0, solve(s0));
        expect(game.status(done)).toBe("solved");
        expect(game.score(done)).toBe(1);
        if (l.kind === "line-in" || l.kind === "line-out") expect(det2(l.a, l.b)).toBe(0);
        if (l.kind === "line-in") expect(reachable(l)).toBe(true);
        if (l.kind === "line-out") expect(reachable(l)).toBe(false);
        if (l.kind === "axes" || l.kind === "general" || l.kind === "halves") expect(det2(l.a, l.b)).not.toBe(0);
      }),
      { numRuns: 200 },
    );
  });

  it("на уровне «половинки» хотя бы один коэффициент дробный", () => {
    for (let seed = 1; seed < 50; seed++) {
      const l = makeLevel("halves", rng(seed));
      expect(solutions(l).some(([c1, c2]) => !Number.isInteger(c1) || !Number.isInteger(c2))).toBe(true);
    }
  });
});
