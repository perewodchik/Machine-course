// «Underflow»: ноль во float64 находится перемножением; у каждого уровня ноль наступает в пределах оси,
// сумма логарифмов конечна, в «сравнении» обе модели обнуляются, а логарифмы их различают (fast-check по seed).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { accuracy, answer, better, COMPARE_N, KINDS, LEVELS, logSum, makeLevel, underflow as game, underflowAt, type Action, type Kind, type State } from "./model";

const level = (kind: Kind, seed = 1) => makeLevel(kind, rng(seed));
const play = (s: State, actions: Action[]) => actions.reduce(game.step, s);

describe("числа", () => {
  it("0.5ⁿ обращается в ноль на n = 1075: 2⁻¹⁰⁷⁴ — наименьшее положительное число float64", () => {
    expect(underflowAt(level("half").probs)).toBe(1075);
    expect(2 ** -1074).toBe(Number.MIN_VALUE);
    expect(underflowAt([0.5, 0.5])).toBe(0);
  });

  it("точность — отношение меньшего к большему", () => {
    const l = level("half");
    expect(accuracy(l, 1075)).toBe(1);
    expect(accuracy(l, 2150)).toBeCloseTo(0.5, 10);
    expect(accuracy(l, 1075 / 2)).toBeCloseTo(0.5, 10);
  });
});

describe("ходы", () => {
  it("прогноз округляется к шагу и не выходит за ось; «Перемножить» решает уровень, счёт — точность", () => {
    const l = level("half");
    const s = play(game.init(l, rng(1)), [{ type: "set", value: 1077 }, { type: "set", value: 99999 }, { type: "set", value: 1062 }]);
    expect(s.guess).toBe(1060);
    expect(s.moves).toBe(3);
    const done = game.step(s, { type: "reveal" });
    expect(game.status(done)).toBe("solved");
    expect(game.score(done)).toBeCloseTo(1060 / 1075, 10);
    expect(game.feedback(done)).toBe("Произведение стало нулём на объекте 1075. Прогноз точный.");
    expect(game.step(done, { type: "set", value: 500 })).toBe(done);
  });

  it("сравнение: «не различить» не решает уровень, после логарифмов верный выбор решает со счётом ½", () => {
    const l = level("compare");
    const s = play(game.init(l, rng(1)), [{ type: "pick", pick: "same" }]);
    expect(game.status(s)).toBe("playing");
    expect(game.feedback(s)).toMatch(/^По произведениям — не различить/);
    const done = play(s, [{ type: "logs" }, { type: "pick", pick: better(l) }]);
    expect(game.status(done)).toBe("solved");
    expect(game.score(done)).toBe(0.5);
    expect(game.describe(done)).toMatch(/Суммы логарифмов: A — −\d+(\.\d)?, B — −\d+(\.\d)?\.$/);
  });
});

describe("уровни", () => {
  it("уровни идут по KINDS, генерация детерминирована", () => {
    expect(LEVELS).toBe(KINDS.length);
    KINDS.forEach((kind, k) => expect(game.generate(rng(5 * 1000 + k), k + 1).kind).toBe(kind));
    expect(game.generate(rng(9), 2)).toEqual(game.generate(rng(9), 2));
  });

  it("ноль наступает внутри оси; сумма логарифмов в пределах прогноза; в сравнении обе модели — ноль, а логарифмы различают", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, k) => {
        const l = game.generate(rng(seed * 1000 + k), k + 1);
        if (l.kind === "logsum") {
          expect(answer(l)).toBeGreaterThan(-3000);
          expect(answer(l)).toBeLessThan(0);
          expect(underflowAt(l.probs)).toBeGreaterThan(0); // само произведение — ноль
        } else if (l.kind === "compare") {
          expect(underflowAt(l.probs)).toBeGreaterThan(0);
          expect(underflowAt(l.probsB!)).toBeGreaterThan(0);
          expect(l.probs).toHaveLength(COMPARE_N);
          expect(Math.abs(logSum(l.probs) - logSum(l.probsB!))).toBeGreaterThan(50);
          expect(better(l)).toBe("A");
        } else {
          const n = answer(l);
          expect(n).toBeGreaterThan(l.step);
          expect(n).toBeLessThan(l.xMax);
        }
      }),
      { numRuns: 80 },
    );
  });
});
