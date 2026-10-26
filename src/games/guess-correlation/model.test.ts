// «Угадай корреляцию»: на любом seed и уровне верный вариант однозначен (ближайший к r и не дальше 0.08,
// варианты разнесены на 0.3), ловушки некоррелированы или держатся на выбросе; бот проходит уровень.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { corr } from "../../lib/math/correlation";
import { rng } from "../../lib/math/rng";
import { guessCorrelation, LEVELS, solve } from "./model";

const level = (seed: number, l: number) => guessCorrelation.generate(rng(seed * 1000 + l), l + 1);

describe("угадай корреляцию", () => {
  it("на любом seed и уровне верный вариант — ближайший к выборочной корреляции", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        const lv = level(seed, l);
        expect(lv.rounds).toHaveLength(5);
        for (const r of lv.rounds) {
          expect(r.options).toContain(r.answer);
          expect(new Set(r.options).size).toBe(r.options.length);
          expect(corr(r.points)).toBeCloseTo(r.r, 12);
          expect(Math.abs(r.r - r.answer)).toBeLessThanOrEqual(0.08);
          for (const o of r.options) if (o !== r.answer) expect(Math.abs(o - r.r)).toBeGreaterThan(0.2);
          if (r.kind === "outlier") expect(Math.abs(r.answer)).toBeGreaterThanOrEqual(0.3);
          if (r.kind === "parabola" || r.kind === "ring") expect(r.answer).toBe(0);
        }
      }),
      { numRuns: 60 },
    );
  });

  it("ловушки: парабола и кольцо — около нуля, выброс даёт заметную корреляцию", () => {
    const lv = level(7, 3);
    const byKind = Object.fromEntries(lv.rounds.map((r) => [r.kind, r]));
    expect(byKind.parabola!.answer).toBe(0);
    expect(byKind.ring!.answer).toBe(0);
    expect(Math.abs(byKind.outlier!.answer)).toBeGreaterThanOrEqual(0.3);
  });

  it("бот проходит каждый уровень без ошибок; повторный ответ не засчитывается", () => {
    for (let l = 0; l < LEVELS; l++) {
      let s = guessCorrelation.init(level(3, l), rng(1));
      for (const a of solve(s)) s = guessCorrelation.step(s, a);
      expect(guessCorrelation.status(s)).toBe("solved");
      expect(guessCorrelation.score(s)).toBe(1);
    }
    let s = guessCorrelation.init(level(3, 0), rng(1));
    const wrong = s.level.rounds[0]!.options.find((o) => o !== s.level.rounds[0]!.answer)!;
    s = guessCorrelation.step(s, { type: "answer", option: wrong });
    s = guessCorrelation.step(s, { type: "answer", option: s.level.rounds[0]!.answer });
    expect(s.answers).toEqual([false]);
    expect(guessCorrelation.feedback(s)).toContain("Неверно");
  });
});
