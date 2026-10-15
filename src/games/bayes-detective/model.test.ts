// «Байес-детектив»: обновление шансов, логарифмическое правило, свойства (fast-check) — детерминизм уровней
// и то, что байесовский игрок набирает не меньше очков, чем любая постоянная стратегия.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { bayesPlayer, detective as game, lossBits, points, posterior, type Level, type State } from "./model";

const play = (s: State, actions: Parameters<typeof game.step>[1][]) => actions.reduce(game.step, s);
const MEDICAL: Level = { kind: "base-rate", hypothesis: "пациент болен", prior: 0.01, evidence: [{ text: "Тест положителен", pH: 0.9, pNotH: 0.1 }] };

describe("обновление и счёт", () => {
  it("редкая болезнь и точный тест: шансы 1:99 × 9 → вероятность около 8 %", () => {
    expect(posterior(MEDICAL, 0)).toBe(0.01);
    expect(posterior(MEDICAL, 1)).toBeCloseTo(9 / 108, 10);
  });

  it("логарифмическое правило: ноль потерь только у байесовского ответа", () => {
    expect(lossBits(0.3, 0.3)).toBeCloseTo(0, 12);
    expect(lossBits(0.3, 0.5)).toBeGreaterThan(0);
    expect(points(0.3, 0.3)).toBe(100);
    expect(points(0.08, 0.9)).toBeLessThan(points(0.08, 0.2));
  });

  it("партия: ответ записывается, бегунок встаёт на байесовскую вероятность; после последней улики — решено", () => {
    let s = game.init(MEDICAL, rng(1));
    expect(s.draft).toBe(1);
    s = game.step(s, { type: "set", value: 90 });
    s = game.step(s, { type: "answer" });
    expect(s.answers).toEqual([0.9]);
    expect(s.draft).toBe(8);
    expect(game.status(s)).toBe("solved");
    expect(game.feedback(s)).toMatch(/по Байесу 8\u00a0%, ваш ответ 90\u00a0%/);
    expect(game.step(s, { type: "answer" })).toBe(s);
    expect(game.step(s, { type: "reset" }).answers).toEqual([]);
  });

  it("подсказки лесенкой: шансы → отношение правдоподобия → ответ", () => {
    let s = game.init(MEDICAL, rng(1));
    s = game.step(s, { type: "hint" });
    expect(game.hint!(s)).toMatch(/шансы гипотезы 0.01 к 1/);
    s = game.step(s, { type: "hint" });
    expect(game.hint!(s)).toMatch(/0.9 \/ 0.1 = 9/);
    s = game.step(s, { type: "hint" });
    expect(game.hint!(s)).toMatch(/= 8\u00a0%/);
  });

  it("описание для скринридера называет улику, правдоподобия и ответы", () => {
    const s = play(game.init(MEDICAL, rng(1)), [{ type: "set", value: 50 }, { type: "answer" }]);
    expect(game.describe(s)).toBe(
      "Гипотеза: пациент болен. Априорная вероятность 1\u00a0%. Улика 1: Тест положителен; P(улика | пациент болен) = 0.9, P(улика | нет) = 0.1; ваш ответ 50\u00a0%, по Байесу 8\u00a0%.",
    );
  });
});

describe("уровни", () => {
  it("виды уровней по сложности", () => {
    expect([1, 2, 3, 4, 5].map((d) => game.generate(rng(5), d).kind)).toEqual(["first", "base-rate", "two", "against", "mixed"]);
    expect(game.generate(rng(5), 1).prior).toBe(0.5);
    expect(game.generate(rng(5), 4).evidence.at(-1)!.pH).toBeLessThan(game.generate(rng(5), 4).evidence.at(-1)!.pNotH);
  });

  it("свойство: один seed — один уровень и одна партия", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.integer({ min: 1, max: 7 }), fc.array(fc.integer({ min: 0, max: 100 }), { maxLength: 4 }), (seed, d, qs) => {
        const a = game.generate(rng(seed), d);
        expect(game.generate(rng(seed), d)).toEqual(a);
        const actions = qs.flatMap((q) => [{ type: "set" as const, value: q }, { type: "answer" as const }]);
        expect(play(game.init(a, rng(seed)), actions)).toEqual(play(game.init(a, rng(seed)), actions));
      }),
    );
  });

  it("свойство: байесовский игрок решает уровень и набирает не меньше очков, чем любая постоянная стратегия", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.integer({ min: 1, max: 7 }), fc.integer({ min: 0, max: 100 }), (seed, d, constant) => {
        const lvl = game.generate(rng(seed), d);
        const start = game.init(lvl, rng(seed));
        const bayes = play(start, bayesPlayer(start));
        expect(game.status(bayes)).toBe("solved");
        expect(game.score(bayes)).toBeGreaterThanOrEqual(0.99);
        const naive = play(start, lvl.evidence.flatMap(() => [{ type: "set" as const, value: constant }, { type: "answer" as const }]));
        expect(game.totalPoints(bayes)).toBeGreaterThanOrEqual(game.totalPoints(naive));
      }),
    );
  });
});
