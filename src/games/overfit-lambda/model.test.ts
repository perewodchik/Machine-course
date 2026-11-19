// «Переобучи, если сможешь: λ»: гребневая подгонка — нормальные уравнения, лассо — условия оптимальности (KKT);
// при разреженной истине по валидации обычно выигрывает L1, при чистом шуме — самый сильный штраф (константа ȳ);
// бот, выбирающий по валидации, проходит любой уровень; одинаковый seed — одинаковая партия.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { D, errors, fit, GRID, LEVELS, LOG_LAMBDA, nonzero, overfitLambda, solveLevel, testBest, type Level } from "./model";

const level = (seed: number, l: number) => overfitLambda.generate(rng(seed * 1000 + l), l + 1);

function residuals(lv: Level, f: ReturnType<typeof fit>) {
  return lv.train.y.map((y, i) => y - f.intercept - lv.train.X[i]!.reduce((s, v, j) => s + v * f.theta[j]!, 0));
}

describe("переобучи, если сможешь: λ", () => {
  it("L2: градиент штрафованной ошибки в решении — ноль", () => {
    const lv = level(1, 1);
    const f = fit(lv.train, { penalty: "l2", logLambda: 1 });
    const r = residuals(lv, f);
    expect(Math.abs(r.reduce((s, v) => s + v, 0))).toBeLessThan(1e-8); // свободный член не штрафуется
    for (let j = 0; j < D; j++) {
      const g = -lv.train.X.reduce((s, x, i) => s + x[j]! * r[i]!, 0) + 10 * f.theta[j]!;
      expect(Math.abs(g)).toBeLessThan(1e-7);
    }
  });

  it("L1: условия KKT — |xⱼᵀr| ≤ λ, равенство со знаком у ненулевых весов", () => {
    const lv = level(2, 1);
    const lam = 10 ** 1.5;
    const f = fit(lv.train, { penalty: "l1", logLambda: 1.5 });
    const r = residuals(lv, f);
    for (let j = 0; j < D; j++) {
      const xr = lv.train.X.reduce((s, x, i) => s + x[j]! * r[i]!, 0);
      if (f.theta[j] === 0) expect(Math.abs(xr)).toBeLessThanOrEqual(lam + 1e-6);
      else expect(xr).toBeCloseTo(lam * Math.sign(f.theta[j]!), 5);
    }
    expect(nonzero(f)).toBeLessThan(D);
  });

  it("при λ → ∞ модель — константа ȳ", () => {
    const lv = level(3, 3);
    const ybar = lv.train.y.reduce((s, v) => s + v, 0) / lv.train.y.length;
    for (const penalty of ["l1", "l2"] as const) {
      const f = fit(lv.train, { penalty, logLambda: 9 });
      expect(nonzero(f) === 0 || Math.max(...f.theta.map(Math.abs)) < 1e-4).toBe(true);
      expect(f.intercept).toBeCloseTo(ybar, 3);
    }
  });

  it("разреженная истина — L1, плотная — L2 (по тесту на сетке); при чистом шуме константа почти лучшая", () => {
    const bestOf = (lv: Level, penalty: "l1" | "l2") => Math.min(...GRID.map((g) => errors(lv, { penalty, logLambda: g }).test));
    let l1 = 0;
    let l2 = 0;
    let constant = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const sparse = level(seed, 1);
      if (bestOf(sparse, "l1") < bestOf(sparse, "l2")) l1++;
      const dense = level(seed, 0);
      if (bestOf(dense, "l2") <= bestOf(dense, "l1")) l2++;
      const noise = level(seed, 3);
      if (errors(noise, { penalty: "l2", logLambda: LOG_LAMBDA.max }).test <= 1.03 * testBest(noise)) constant++;
    }
    expect(l1).toBeGreaterThanOrEqual(18);
    expect(l2).toBeGreaterThanOrEqual(14);
    expect(constant).toBeGreaterThanOrEqual(16);
  });

  it("без штрафа на «мало данных» тест заметно хуже лучшего на сетке", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const lv = level(seed, 2);
      expect(errors(lv, { penalty: "l2", logLambda: LOG_LAMBDA.min }).test).toBeGreaterThan(1.3 * testBest(lv));
    }
  });

  it("бот по валидации проходит любой уровень; seed воспроизводит партию", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10_000 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        const lv = level(seed, l);
        expect(level(seed, l)).toEqual(lv);
        let s = overfitLambda.init(lv, rng(0));
        for (const a of solveLevel(s)) s = overfitLambda.step(s, a);
        expect(overfitLambda.status(s)).toBe("solved");
        expect(overfitLambda.score(s)).toBeGreaterThan(0.5);
      }),
      { numRuns: 40 },
    );
  });
});
