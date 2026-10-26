// «Минимум, максимум или седло»: карточки нужного типа, бот проходит все уровни на 100 %, ошибка снижает счёт.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { classify, det, eigs, LEVEL_KINDS, LEVELS, minMaxSaddle, solve, trace, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof minMaxSaddle.step>[1][]): State => actions.reduce((s, a) => minMaxSaddle.step(s, a), minMaxSaddle.init(level, rng(1)));

describe("уровни", () => {
  it("тип карточки совпадает со знаками собственных значений; бот решает всё", () => {
    for (let seed = 1; seed <= 60; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const level = minMaxSaddle.generate(rng(seed * 1000 + k - 1), k);
        expect(level.kind).toBe(LEVEL_KINDS[k - 1]);
        expect(level.cards).toHaveLength(4);
        for (const c of level.cards) {
          const [l1, l2] = eigs(c.H);
          expect(l1 * l2).toBeCloseTo(det(c.H), 9);
          expect(l1 + l2).toBeCloseTo(trace(c.H), 9);
          const want = Math.abs(l1 * l2) < 1e-9 ? "degenerate" : l1 * l2 < 0 ? "saddle" : l1 > 0 ? "min" : "max";
          expect(classify(c.H)).toBe(want);
          expect(c.kind).toBe(want);
          if (k <= 2) expect(c.picture).toBe(true);
          if (k === 1) expect(c.H[1]).toBe(0);
        }
        const s = play(level, solve(minMaxSaddle.init(level, rng(1))));
        expect(minMaxSaddle.status(s)).toBe("solved");
        expect(minMaxSaddle.score(s)).toBe(1);
      }
  });

  it("на уровне «вырожденный гессиан» есть карточки с det H = 0", () => {
    const level = minMaxSaddle.generate(rng(7), 4);
    expect(level.cards.filter((c) => c.kind === "degenerate")).toHaveLength(2);
  });
});

describe("ходы", () => {
  const level = minMaxSaddle.generate(rng(3), 1);
  it("неверный ответ записывается, повторный ответ на ту же карточку не принимается, счёт — доля верных", () => {
    const card = level.cards[0]!;
    const wrong = card.kind === "min" ? "max" : "min";
    let s = play(level, [{ type: "answer", kind: wrong }, { type: "answer", kind: card.kind }]);
    expect(s.answers).toEqual([false]);
    expect(minMaxSaddle.feedback(s)).toMatch(/^Неверно/);
    s = solve(minMaxSaddle.init(level, rng(1))).slice(2).reduce((st, a) => minMaxSaddle.step(st, a), minMaxSaddle.step(s, { type: "next" }));
    expect(minMaxSaddle.status(s)).toBe("solved");
    expect(minMaxSaddle.score(s)).toBe(0.75);
  });
});
