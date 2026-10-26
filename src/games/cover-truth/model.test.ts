// «Покрой истину»: покрытие при σ известной и z = 1.96 близко к 95 %, при 1.645 — к 90 %; при пяти наблюдениях и
// оценённой σ z = 1.96 не проходит, а z ≈ t₀.₉₇₅(4) = 2.78 — да; бот проходит любой уровень; доля накрывших в залпе
// согласована с покрытием.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { coverage, coverTruth, draw, LEVELS, makeLevel, solve } from "./model";

const level = (seed: number, l: number) => coverTruth.generate(rng(seed * 1000 + l), l + 1);

describe("покрой истину", () => {
  it("известная σ: 1.96 даёт около 95 %, 1.645 — около 90 %", () => {
    const l = makeLevel("known", rng(3));
    expect(Math.abs(coverage(l, 1.96) - 0.95)).toBeLessThan(0.012);
    expect(Math.abs(coverage(l, 1.645) - 0.9)).toBeLessThan(0.015);
  });

  it("пять наблюдений: 1.96 мало, квантиль Стьюдента 2.78 — в самый раз", () => {
    for (let s = 1; s <= 10; s++) {
      const l = makeLevel("five", rng(s));
      expect(coverage(l, 1.96)).toBeLessThan(0.91);
      expect(Math.abs(coverage(l, 2.78) - 0.95)).toBeLessThan(0.012);
    }
  });

  it("скошенные данные: табличный t-интервал накрывает реже 95 %", () => {
    const l = makeLevel("skewed", rng(5));
    expect(coverage(l, 2.36)).toBeLessThan(0.935);
  });

  it("доля накрывших в 20 залпах близка к покрытию", () => {
    const l = makeLevel("known", rng(9));
    let c = 0;
    for (let i = 0; i < 20; i++) c += draw(l, 1.96, i).covered;
    expect(Math.abs(c / 2000 - coverage(l, 1.96))).toBeLessThan(0.02);
  });

  it("бот проходит любой уровень; сдача без залпа невозможна, плохая не закрывает уровень", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        let s = coverTruth.init(level(seed, l), rng(1));
        expect(coverTruth.canSubmit(s)).toBe(false);
        s = coverTruth.step(s, { type: "set", z: 1 });
        s = coverTruth.step(s, { type: "draw" });
        s = coverTruth.step(s, { type: "submit" });
        expect(coverTruth.status(s)).toBe("playing");
        for (const a of solve(s)) s = coverTruth.step(s, a);
        expect(coverTruth.status(s)).toBe("solved");
        expect(coverTruth.score(s)).toBeGreaterThan(0.5);
      }),
      { numRuns: 40 },
    );
  });
});
