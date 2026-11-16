// «Переобучи, если сможешь: финал»: кросс-валидация — среднее по фолдам, каждый объект ровно в одном фолде;
// тест открывается один раз и завершает уровень; на 40 объектах кросс-валидация в среднем выбирает не хуже
// отложенной части; бот по кросс-валидации проходит любой уровень; одинаковый seed — одинаковая партия.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { fit, mse } from "../overfit/model";
import { bestBy, estimate, K, LEVELS, oracle, overfitFinal, solveLevel, testError } from "./model";

const level = (seed: number, l: number) => overfitFinal.generate(rng(seed * 1000 + l), l + 1);

describe("переобучи, если сможешь: финал", () => {
  it("кросс-валидация — среднее ошибок по K фолдам, обученных без своего фолда", () => {
    const lv = level(1, 1);
    const c = { degree: 3, logLambda: -3 };
    const errs = Array.from({ length: K }, (_, j) => {
      const train = lv.data.filter((_, i) => i % K !== j);
      const val = lv.data.filter((_, i) => i % K === j);
      return mse(fit(train, c), val);
    });
    const e = estimate(lv, "cv", c);
    expect(e.mean).toBeCloseTo(errs.reduce((a, b) => a + b, 0) / K, 12);
    expect(e.se).toBeGreaterThan(0);
    expect(estimate(lv, "holdout", c).se).toBeNull();
  });

  it("тест открывается один раз: после сдачи действия ничего не меняют", () => {
    let s = overfitFinal.init(level(2, 0), rng(0));
    s = overfitFinal.step(s, { type: "submit" });
    expect(s.test).not.toBeNull();
    expect(overfitFinal.status(s)).not.toBe("playing");
    const after = overfitFinal.step(overfitFinal.step(s, { type: "set", degree: 5 }), { type: "submit" });
    expect(after.choice).toEqual(s.choice);
    expect(after.test).toBe(s.test);
  });

  it("40 объектов: кросс-валидация в среднем выбирает лучше отложенной части; константа — простая модель", () => {
    let cv = 0;
    let holdout = 0;
    let simple = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const lv = level(seed, 1);
      cv += testError(lv, bestBy(lv, "cv")) / oracle(lv);
      holdout += testError(lv, bestBy(lv, "holdout")) / oracle(lv);
      const c = level(seed, 2);
      if (testError(c, { degree: 0, logLambda: -6 }) <= 1.05 * oracle(c)) simple++;
    }
    expect(cv).toBeLessThan(holdout);
    expect(simple).toBeGreaterThanOrEqual(24);
  });

  it("степень 10 без штрафа на 40 объектах обычно проваливает уровень", () => {
    let failed = 0;
    for (let seed = 1; seed <= 20; seed++) {
      let s = overfitFinal.init(level(seed, 1), rng(0));
      s = overfitFinal.step(s, { type: "set", degree: 10, logLambda: -6 });
      s = overfitFinal.step(s, { type: "submit" });
      if (overfitFinal.status(s) === "failed") failed++;
    }
    expect(failed).toBeGreaterThanOrEqual(12);
  });

  it("бот по кросс-валидации проходит любой уровень; seed воспроизводит партию", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        const lv = level(seed, l);
        expect(level(seed, l)).toEqual(lv);
        let s = overfitFinal.init(lv, rng(0));
        for (const a of solveLevel(s)) s = overfitFinal.step(s, a);
        expect(overfitFinal.status(s)).toBe("solved");
        expect(overfitFinal.score(s)).toBeGreaterThan(0.3);
      }),
      { numRuns: 30 },
    );
  });
});
