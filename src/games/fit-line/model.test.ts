// «Подгони прямую»: шаги бегунков, сдача ответа, решаемость каждого уровня на сетке шагов (fast-check по seed).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { loss } from "../../widgets/la/fit-line/model";
import { fitLine as game, LEVELS, makeLevel, RANGE, STEP, TOLERANCE, type Action, type State } from "./model";

const play = (s: State, actions: Action[]) => actions.reduce(game.step, s);
const start = (kind: Parameters<typeof makeLevel>[0]) => game.init(makeLevel(kind), rng(1));

describe("ходы и сдача", () => {
  it("бегунок округляется к шагу и ограничен; на уровне «наклон» сдвиг закреплён", () => {
    const s = play(start("slope"), [
      { type: "set", which: "t1", value: 0.1234 },
      { type: "set", which: "t0", value: 3 },
      { type: "set", which: "t1", value: 9 },
    ]);
    expect(s.theta).toEqual({ t0: 0, t1: RANGE.t1[1] });
    expect(s.moves).toBe(2);
  });

  it("сдача далеко от минимума не принимается, рядом — принимается, и уровень застывает", () => {
    const far = play(start("both"), [{ type: "submit" }]);
    expect(game.status(far)).toBe("playing");
    expect(game.feedback(far)).toMatch(/Ещё не минимум/);
    const lvl = makeLevel("both");
    const near = play(game.init(lvl, rng(1)), [
      { type: "set", which: "t0", value: lvl.best.t0 },
      { type: "set", which: "t1", value: lvl.best.t1 },
      { type: "submit" },
    ]);
    expect(game.status(near)).toBe("solved");
    expect(game.score(near)).toBeGreaterThan(1 / TOLERANCE);
    expect(game.step(near, { type: "set", which: "t1", value: 0 })).toBe(near);
  });

  it("выброс тянет прямую: наклон МНК меньше, чем без него", () => {
    expect(makeLevel("outlier").best.t1).toBeLessThan(makeLevel("both").best.t1);
  });
});

describe("уровни", () => {
  it("каждый уровень решаем на сетке шагов: ближайшая к минимуму точка сетки в пределах допуска", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, k) => {
        const level = game.generate(rng(seed * 1000 + k), k + 1);
        const snap = (v: number, step: number) => Math.round(v / step) * step;
        let best = Infinity;
        // точки сетки бегунков рядом с минимумом (θ₀ и θ₁ связаны: лучшая точка сетки может быть не соседней)
        for (const d0 of [-4, -3, -2, -1, 0, 1, 2, 3, 4])
          for (const d1 of [-4, -3, -2, -1, 0, 1, 2, 3, 4]) {
            const t0 = level.kind === "slope" ? 0 : snap(level.best.t0, STEP.t0) + d0 * STEP.t0;
            const t1 = snap(level.best.t1, STEP.t1) + d1 * STEP.t1;
            best = Math.min(best, loss({ t0, t1 }, level.x, level.y));
          }
        expect(best).toBeLessThanOrEqual(TOLERANCE * loss(level.best, level.x, level.y));
        expect(level.best.t0).toBeGreaterThanOrEqual(RANGE.t0[0]);
        expect(level.best.t0).toBeLessThanOrEqual(RANGE.t0[1]);
        expect(level.best.t1).toBeLessThanOrEqual(RANGE.t1[1]);
      }),
    );
  });

  it("лучшая прямая всегда в пределах бегунков: seed 949, «выброс» раньше давал θ₀ = 8.73 > 8", () => {
    for (const seed of [949, 1508, 2941, 8998]) {
      const { t0, t1 } = game.generate(rng(seed * 1000 + 2), 3).best;
      expect(t0).toBeLessThanOrEqual(RANGE.t0[1]);
      expect(t1).toBeLessThanOrEqual(RANGE.t1[1]);
    }
  });

  it("уровень детерминирован seed'ом", () => {
    expect(game.generate(rng(5), 2)).toEqual(game.generate(rng(5), 2));
  });
});
