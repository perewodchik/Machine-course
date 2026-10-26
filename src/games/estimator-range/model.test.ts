// «Тир оценок»: эмпирическая MSE залпа близка к теоретической (c − 1)²θ² + c²σ²/n; бот с c* проходит любой уровень,
// а несмещённый c = 1 на уровнях с малым n — нет; залп детерминирован по seed уровня и номеру.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { bestC, estimatorRange, LEVELS, mseOf, shoot, solve, TOL } from "./model";

const level = (seed: number, l: number) => estimatorRange.generate(rng(seed * 1000 + l), l + 1);

describe("тир оценок", () => {
  it("на любом seed и уровне бот с c* проходит, MSE залпа близка к теории", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        let s = estimatorRange.init(level(seed, l), rng(1));
        for (const a of solve(s)) s = estimatorRange.step(s, a);
        expect(estimatorRange.status(s)).toBe("solved");
        expect(estimatorRange.score(s)).toBeGreaterThan(1 / TOL);
        const v = s.volleys[0]!;
        // 200 выстрелов: относительная погрешность выборочной MSE — порядка √(2/200) = 0.1
        expect(Math.abs(v.mse / mseOf(s.level, v.c) - 1)).toBeLessThan(0.45);
      }),
      { numRuns: 60 },
    );
  });

  it("на уровнях «пять наблюдений» и «мишень у нуля» несмещённая оценка c = 1 не проходит", () => {
    for (const l of [1, 3]) {
      for (let seed = 1; seed <= 20; seed++) {
        const lv = level(seed, l);
        expect(mseOf(lv, 1)).toBeGreaterThan(TOL * mseOf(lv, bestC(lv)));
      }
    }
  });

  it("залп детерминирован; сдать можно только проверенный c", () => {
    const lv = level(3, 2);
    expect(shoot(lv, 0.7, 0)).toEqual(shoot(lv, 0.7, 0));
    let s = estimatorRange.init(lv, rng(1));
    s = estimatorRange.step(s, { type: "submit" });
    expect(s.submitted).toBeNull();
    s = estimatorRange.step(s, { type: "shoot" });
    s = estimatorRange.step(s, { type: "set", c: 0.5 });
    expect(estimatorRange.canSubmit(s)).toBe(false);
  });

  it("плохой c не принимается и не закрывает уровень; после непринятой сдачи балл ниже", () => {
    const lv = level(5, 1);
    let s = estimatorRange.init(lv, rng(1));
    s = estimatorRange.step(s, { type: "shoot" });
    s = estimatorRange.step(s, { type: "submit" }); // c = 1 на «пяти наблюдениях» — мимо
    expect(s.submitted).toBeNull();
    expect(s.misses).toEqual([1]);
    expect(estimatorRange.feedback(s)).toContain("не принят");
    expect(estimatorRange.canSubmit(s)).toBe(false);
    for (const a of solve(s)) s = estimatorRange.step(s, a);
    expect(estimatorRange.status(s)).toBe("solved");
    expect(estimatorRange.score(s)).toBeLessThan(0.95);
  });
});
