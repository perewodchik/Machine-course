// «Фолды»: каждый объект ровно в одном фолде; выбор степени по 10-кратной кросс-валидации стабильнее, чем по одной
// отложенной части; стратификация держит отклики по фолдам почти поровну; правило одной SE не сложнее лучшей степени.
import { describe, expect, it } from "vitest";
import { argmin, CALLS, cv, folds, holdout, N, oneSe, stratifiedFolds } from "./model";

describe("фолды", () => {
  it("каждый объект — ровно в одном фолде", () => {
    for (const k of [2, 5, 10, 60]) {
      const all = folds(k, 3).flat().sort((a, b) => a - b);
      expect(all).toEqual(Array.from({ length: N }, (_, i) => i));
    }
  });

  it("выбор по 10-кратной CV стабильнее выбора по отложенной части", () => {
    const pick = (f: (s: number) => number) => Array.from({ length: 12 }, (_, s) => f(s + 1));
    const spread = (v: number[]) => new Set(v).size;
    const byHold = pick((s) => argmin(holdout(s)));
    const byCv = pick((s) => argmin(cv(folds(10, s)).map((x) => x.mean)));
    expect(spread(byCv)).toBeLessThanOrEqual(spread(byHold));
  });

  it("стратификация: отклики по фолдам различаются не больше чем на один", () => {
    const pos = stratifiedFolds(5, 2).map((f) => f.filter((i) => CALLS[i] === 1).length);
    expect(Math.max(...pos) - Math.min(...pos)).toBeLessThanOrEqual(1);
    expect(pos.reduce((a, b) => a + b, 0)).toBe(CALLS.reduce((a, b) => a + b, 0));
  });

  it("правило одной SE выбирает не более сложную модель, чем минимум", () => {
    const s = cv(folds(5, 1));
    expect(oneSe(s)).toBeLessThanOrEqual(argmin(s.map((x) => x.mean)));
  });
});
