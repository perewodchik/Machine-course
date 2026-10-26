// «Честная вероятность»: бот проходит все уровни; без догадки ручки не двигаются; на разделимых ℓ растёт с крутизной;
// при редком классе лучшая граница сдвинута к нему; выброс уменьшает лучшую крутизну.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { best, honest, LEVEL_KINDS, LEVELS, makeLevel, meanLogp, solve, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof honest.step>[1][]): State => actions.reduce((s, a) => honest.step(s, a), honest.init(level, rng(1)));

describe("честная вероятность", () => {
  it("бот проходит все уровни с высоким счётом", () => {
    for (let seed = 1; seed <= 40; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const level = honest.generate(rng(seed * 1000 + k - 1), k);
        expect(level.kind).toBe(LEVEL_KINDS[k - 1]);
        const s = play(level, solve(honest.init(level, rng(1))));
        expect(honest.status(s)).toBe("solved");
        if (level.kind !== "separable") expect(honest.score(s)).toBeGreaterThan(0.99);
      }
  });

  it("без догадки ручки не двигаются и сдать нельзя", () => {
    const level = makeLevel("overlap", rng(3));
    const s = play(level, [{ type: "set", b: 1, k: 5 }, { type: "submit" }]);
    expect(s.b).toBe(0);
    expect(honest.status(s)).toBe("playing");
  });

  it("разделимые: ℓ/n растёт с крутизной; редкий класс сдвигает границу к себе; выброс смягчает крутизну", () => {
    const sep = makeLevel("separable", rng(5));
    const mid = (Math.max(...sep.x.filter((_, i) => sep.y[i] === 0)) + Math.min(...sep.x.filter((_, i) => sep.y[i] === 1))) / 2;
    expect(meanLogp(sep, mid, 10)).toBeGreaterThan(meanLogp(sep, mid, 2));
    expect(meanLogp(sep, mid, 30)).toBeGreaterThan(meanLogp(sep, mid, 10));
    let shifted = 0;
    let softer = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const im = makeLevel("imbalanced", rng(seed));
      const n0 = im.x.filter((_, i) => im.y[i] === 0);
      const n1 = im.x.filter((_, i) => im.y[i] === 1);
      const midpoint = (n0.reduce((a, b) => a + b, 0) / n0.length + n1.reduce((a, b) => a + b, 0) / n1.length) / 2;
      if (best(im).b > midpoint) shifted++;
      const r = rng(seed);
      const ov = makeLevel("overlap", r);
      const out = { ...ov, kind: "outlier" as const, x: [...ov.x, Math.max(...ov.x) + 2], y: [...ov.y, 0] };
      if (best(out).k < best(ov).k) softer++;
    }
    expect(shifted).toBeGreaterThanOrEqual(18);
    expect(softer).toBe(20);
  });

  it("неточная сдача не принята", () => {
    const level = makeLevel("overlap", rng(7));
    const s = play(level, [{ type: "guess", b: 0 }, { type: "set", b: 3, k: 20 }, { type: "submit" }]);
    expect(honest.status(s)).toBe("playing");
    expect(honest.feedback(s)).toMatch(/не принята/);
  });
});
