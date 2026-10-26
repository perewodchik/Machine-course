// «Переобучи, если сможешь»: гребневая подгонка совпадает с нормальными уравнениями; ошибка на обучении
// не растёт со степенью при малом λ, а степень 10 на 12 точках переобучается; бот, выбирающий по валидации,
// проходит любой уровень; сильно переобученная модель — нет.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { errors, fit, LEVELS, mse, overfit, solve } from "./model";

const level = (seed: number, l: number) => overfit.generate(rng(seed * 1000 + l), l + 1);

describe("переобучи, если сможешь", () => {
  it("подгонка прямой — МНК; при большом λ веса почти нули", () => {
    const pts = [[-1, -1], [0, 0.2], [1, 0.9]] as const;
    const th = fit(pts, { degree: 1, logLambda: -6 });
    expect(th[1]).toBeCloseTo(0.95, 5);
    expect(th[0]).toBeCloseTo(0.0333333, 5);
    const big = fit(pts, { degree: 3, logLambda: 6 });
    for (const t of big) expect(Math.abs(t)).toBeLessThan(1e-4);
    expect(mse(th, pts)).toBeGreaterThan(0);
  });

  it("на обучении ошибка не растёт со степенью; степень 10 переобучается на синусе", () => {
    const lv = level(3, 0);
    let prev = Infinity;
    for (let d = 0; d <= 9; d++) {
      const e = errors(lv, { degree: d, logLambda: -6 }).train;
      expect(e).toBeLessThanOrEqual(prev + 1e-6);
      prev = e;
    }
    const over = errors(lv, { degree: 10, logLambda: -6 });
    expect(over.train).toBeLessThan(0.05);
    expect(over.test).toBeGreaterThan(over.train * 3);
  });

  it("на любом seed и уровне выбор по валидации проходит, сдача степени 10 без штрафа обычно нет", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        let s = overfit.init(level(seed, l), rng(1));
        for (const a of solve(s)) s = overfit.step(s, a);
        expect(overfit.status(s)).toBe("solved");
      }),
      { numRuns: 40 },
    );
    let bad = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let s = overfit.init(level(seed, 0), rng(1));
      s = overfit.step(s, { type: "set", degree: 10, logLambda: -6 });
      s = overfit.step(s, { type: "submit" });
      if (!s.solved) bad++;
    }
    expect(bad).toBeGreaterThanOrEqual(18);
  });
});
