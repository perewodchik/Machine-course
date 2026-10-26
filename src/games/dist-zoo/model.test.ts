// «Зоопарк распределений»: на каждом уровне пять карточек с семействами уровня, все семейства встречаются, бот
// проходит всё; ошибка снижает счёт; у карточек «по форме» функция вероятности суммируется в 1.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { cardPmf, distZoo, LEVEL_KINDS, LEVELS, solve, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof distZoo.step>[1][]): State => actions.reduce((s, a) => distZoo.step(s, a), distZoo.init(level, rng(1)));

describe("уровни", () => {
  it("карточки из семейств уровня, все семейства есть (кроме смешанного), бот решает всё", () => {
    for (let seed = 1; seed <= 60; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const level = distZoo.generate(rng(seed * 1000 + k - 1), k);
        expect(level.kind).toBe(LEVEL_KINDS[k - 1]);
        expect(level.cards).toHaveLength(5);
        for (const c of level.cards) expect(level.families).toContain(c.family);
        if (level.kind !== "mixed") expect(new Set(level.cards.map((c) => c.family)).size).toBe(level.families.length);
        if (level.kind === "shapes") for (const c of level.cards) expect(c.kind).toBe("shape");
        for (const c of level.cards)
          if (c.kind === "shape") expect(Array.from({ length: 200 }, (_, i) => cardPmf(c, i)).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
        const s = play(level, solve(distZoo.init(level, rng(1))));
        expect(distZoo.status(s)).toBe("solved");
        expect(distZoo.score(s)).toBe(1);
      }
  });
});

describe("ходы", () => {
  it("неверный ответ — разбор с признаком семейства, повторный ответ не принимается, счёт 0.8", () => {
    const level = distZoo.generate(rng(2), 1);
    const card = level.cards[0]!;
    const wrong = card.family === "binomial" ? "geometric" : "binomial";
    let s = play(level, [{ type: "answer", family: wrong }, { type: "answer", family: card.family }]);
    expect(s.answers).toEqual([false]);
    expect(distZoo.feedback(s)).toMatch(/^Неверно: это .*\. Признак — /);
    s = solve(distZoo.init(level, rng(1))).slice(2).reduce((st, a) => distZoo.step(st, a), distZoo.step(s, { type: "next" }));
    expect(distZoo.score(s)).toBeCloseTo(0.8, 12);
  });
});
