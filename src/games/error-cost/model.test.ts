// «Цена ошибки»: бот с лучшим порогом проходит любой уровень; порог 0.5 не проходит кредиты и скрининг; байесовский порог
// близок к лучшему; плохая сдача не закрывает уровень.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { best, costAt, errorCost, LEVELS, makeLevel, solve } from "./model";

const level = (seed: number, l: number) => errorCost.generate(rng(seed * 1000 + l), l + 1);

describe("цена ошибки", () => {
  it("бот проходит любой уровень", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        let s = errorCost.init(level(seed, l), rng(1));
        for (const a of solve(s)) s = errorCost.step(s, a);
        expect(errorCost.status(s)).toBe("solved");
        expect(errorCost.score(s)).toBeGreaterThan(0.9);
      }),
      { numRuns: 60 },
    );
  });

  it("порог 0.5 не проходит кредиты и скрининг; непринятая сдача не закрывает уровень", () => {
    for (const kind of ["credit", "screening"] as const)
      for (let seed = 1; seed <= 20; seed++) {
        let s = errorCost.init(makeLevel(kind, rng(seed)), rng(1));
        s = errorCost.step(s, { type: "submit" });
        expect(errorCost.status(s), `${kind} ${seed}`).toBe("playing");
        expect(s.misses).toEqual([0.5]);
      }
  });

  it("байесовский порог близок к лучшему по цене: в среднем по выборкам — в пределах 20 % (лучший порог на тех же данных оптимистичен)", () => {
    for (const kind of ["credit", "spam", "equal", "screening"] as const) {
      let sum = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const l = makeLevel(kind, rng(seed));
        const ratio = costAt(l, l.cFp / (l.cFp + l.cFn)) / best(l).cost;
        expect(ratio, `${kind} ${seed}`).toBeLessThan(1.8);
        sum += ratio;
      }
      expect(sum / 30, kind).toBeLessThan(1.2);
    }
  });
});
