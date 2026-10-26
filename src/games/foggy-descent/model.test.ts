// «Спуск в тумане»: стрелка — градиент (или его зашумлённая оценка), бот против стрелки доходит до оптимума,
// оракул задаёт решаемость; шум детерминирован.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { DIRS, foggyDescent, gradient, greedyMove, ideal, LEVEL_KINDS, LEVELS, MAX_MOVES, oracleMove, shownGradient, value, type Action, type Level, type State } from "./model";

const run = (level: Level, bot: (s: State) => Action, limit = MAX_MOVES) => {
  let s = foggyDescent.init(level, rng(1));
  for (let k = 0; k < limit && foggyDescent.status(s) !== "solved"; k++) s = foggyDescent.step(s, bot(s));
  return s;
};

describe("уровни", () => {
  it("градиент совпадает с конечными разностями; оракул решает каждый уровень, бот против стрелки — каждый без шума", () => {
    let noisy = 0;
    let noisySolved = 0;
    for (let seed = 1; seed <= 60; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const level = foggyDescent.generate(rng(seed * 1000 + k - 1), k);
        expect(level.kind).toBe(LEVEL_KINDS[k - 1]);
        const p = [0.3, -0.7] as const;
        const h = 1e-6;
        const g = gradient(level, p);
        expect(g[0]).toBeCloseTo((value(level, [p[0] + h, p[1]]) - value(level, [p[0] - h, p[1]])) / (2 * h), 5);
        expect(g[1]).toBeCloseTo((value(level, [p[0], p[1] + h]) - value(level, [p[0], p[1] - h])) / (2 * h), 5);
        const o = run(level, oracleMove);
        expect(foggyDescent.status(o)).toBe("solved");
        expect(foggyDescent.moves(o)).toBeLessThanOrEqual(ideal(level) + 2);
        const solved = foggyDescent.status(run(level, greedyMove)) === "solved";
        if (level.noise) {
          noisy++;
          noisySolved += Number(solved);
        } else expect(solved).toBe(true);
      }
    // по шумной стрелке бот иногда не укладывается в лимит шагов — но в большинстве партий доходит
    expect(noisySolved / noisy).toBeGreaterThan(0.85);
  });

  it("на уровне «подъём» цель — максимум, на «шумном» стрелка отличается от градиента, но повторяется", () => {
    const up = foggyDescent.generate(rng(2), 3);
    expect(up.sign).toBe(-1);
    expect(value(up, up.m)).toBeGreaterThan(value(up, up.start));
    const noisy = foggyDescent.generate(rng(3), 4);
    const a = shownGradient(noisy, noisy.start, 0);
    expect(a).toEqual(shownGradient(noisy, noisy.start, 0));
    expect(a).not.toEqual(gradient(noisy, noisy.start));
  });
});

describe("ходы", () => {
  const level: Level = { kind: "round", A: [1, 0, 1], m: [1, 1], sign: 1, start: [-2, -2], noise: 0, noiseSeed: 1 };
  it("шаг по стрелке поднимает f, против — опускает; счёт — доля от наименьшего числа шагов", () => {
    const up = foggyDescent.step(foggyDescent.init(level, rng(1)), { type: "move", dir: 5 });
    expect(foggyDescent.feedback(up)).toMatch(/выше, чем было/);
    // от (−2, −2) до (1, 1) — 4.24; восемь длинных шагов по диагонали дают (0.83, 0.83), до центра 0.24
    let s = foggyDescent.init(level, rng(1));
    for (let k = 0; k < 8; k++) s = foggyDescent.step(s, { type: "move", dir: 1 });
    expect(foggyDescent.status(s)).toBe("solved");
    expect(ideal(level)).toBe(8);
    expect(foggyDescent.score(s)).toBe(1);
    s = foggyDescent.step(foggyDescent.init(level, rng(1)), { type: "move", dir: 0 });
    for (let k = 0; k < 8; k++) s = foggyDescent.step(s, { type: "move", dir: 1 });
    expect(foggyDescent.status(s)).toBe("solved");
    expect(foggyDescent.score(s)).toBeCloseTo(8 / 9, 12);
    expect(DIRS[1]!.arrow).toBe("↗");
    // короткий шаг — 0.2
    const short = foggyDescent.step(foggyDescent.init(level, rng(1)), { type: "move", dir: 0, short: true });
    expect(short.path[1]![0]).toBeCloseTo(-1.8, 12);
  });
});
