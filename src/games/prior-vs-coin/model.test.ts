// «Приор против монеты»: приор, похожий на партию, обыгрывает MLE-бота на любом seed и уровне; бета-генератор
// даёт правильное среднее; при 40 бросках проигрыш бота мал; партия с плохим приором не закрывает уровень.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { evaluate, LEVELS, makeLevel, priorVsCoin, solve } from "./model";

const level = (seed: number, l: number) => priorVsCoin.generate(rng(seed * 1000 + l), l + 1);

describe("приор против монеты", () => {
  it("на любом seed и уровне приор как у партии обыгрывает бота", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        let s = priorVsCoin.init(level(seed, l), rng(1));
        for (const a of solve(s)) s = priorVsCoin.step(s, a);
        expect(priorVsCoin.status(s)).toBe("solved");
      }),
      { numRuns: 100 },
    );
  });

  it("монеты партии «кривые» в среднем около 0.8; при 40 бросках бот почти не отстаёт", () => {
    const coins = Array.from({ length: 50 }, (_, i) => makeLevel("biased", rng(i)).coins).flat();
    expect(Math.abs(coins.reduce((a, c) => a + c.phi, 0) / coins.length - 0.8)).toBeLessThan(0.03);
    const { player, bot } = evaluate(level(3, 4), 20, 20);
    expect(bot - player).toBeLessThan(0.05);
  });

  it("сильный неверный приор проигрывает и не закрывает уровень", () => {
    let s = priorVsCoin.init(level(5, 1), rng(1)); // кривые монеты
    s = priorVsCoin.step(s, { type: "set", alpha: 20, beta: 20 });
    s = priorVsCoin.step(s, { type: "play" });
    expect(s.solved).toBe(false);
    expect(priorVsCoin.feedback(s)).toContain("бот пока лучше");
  });
});
