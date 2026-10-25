// «Порог расходимости»: порог 2/λ_max совпадает с поведением траектории, бот сдаёт шаг почти у порога.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { descend, divergence, eigs, LEVEL_KINDS, LEVELS, rate, solve, threshold, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof divergence.step>[1][]): State => actions.reduce((s, a) => divergence.step(s, a), divergence.init(level, rng(1)));
const norm = ([x, y]: [number, number]) => Math.hypot(x, y);

describe("уровни", () => {
  it("A положительно определена, порог 2/λ_max разделяет сходимость и расходимость; бот проходит всё", () => {
    for (let seed = 1; seed <= 60; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const level = divergence.generate(rng(seed * 1000 + k - 1), k);
        expect(level.kind).toBe(LEVEL_KINDS[k - 1]);
        const [l1, l2] = eigs(level.A);
        expect(l2).toBeGreaterThan(0);
        const t = threshold(level.A);
        expect(t).toBeCloseTo(2 / l1, 12);
        expect(level.etaMax).toBeGreaterThan(t);
        // чуть ниже порога траектория приближается к минимуму, чуть выше — уходит
        expect(norm(descend(level, 0.95 * t, 200).at(-1)!)).toBeLessThan(norm(descend(level, 0.95 * t, 0)[0]!));
        expect(norm(descend(level, 1.05 * t, 200).at(-1)!)).toBeGreaterThan(10);
        const s = play(level, solve(divergence.init(level, rng(1))));
        expect(divergence.status(s)).toBe("solved");
        expect(divergence.score(s)).toBeGreaterThan(0.9);
        expect(divergence.score(s)).toBeLessThan(1);
      }
  });

  it("у вытянутой чаши число обусловленности не меньше 16", () => {
    const [l1, l2] = eigs(divergence.generate(rng(5), 4).A);
    expect(l1 / l2).toBeGreaterThanOrEqual(16);
  });
});

describe("ходы", () => {
  const level: Level = { kind: "one-d", A: [4, 0, 4], x0: [2.5, 0], etaMax: 0.75 };
  it("расходящийся шаг нельзя сдать, непроверенный — тоже; счёт — доля от порога", () => {
    let s = play(level, [{ type: "set", eta: 0.6 }, { type: "run" }, { type: "submit" }]);
    expect(s.runs[0]!.converged).toBe(false);
    expect(rate(level.A, 0.6)).toBeCloseTo(1.4, 12);
    expect(divergence.status(s)).toBe("playing");
    expect(divergence.feedback(s)).toMatch(/расходится/);
    s = play(level, [{ type: "set", eta: 0.4 }, { type: "run" }, { type: "set", eta: 0.45 }, { type: "submit" }]);
    expect(divergence.status(s)).toBe("playing");
    expect(divergence.feedback(s)).toMatch(/запустите спуск/);
    s = [{ type: "run" } as const, { type: "submit" } as const].reduce((st, a) => divergence.step(st, a), s);
    expect(divergence.status(s)).toBe("solved");
    expect(divergence.score(s)).toBeCloseTo(0.9, 12);
    expect(divergence.feedback(s)).toBe("Сдан шаг η = 0.45: 90 % от порога 2/λ_max = 0.5.");
  });

  it("бегунок округляется к сетке 0.01 и не выходит за границы", () => {
    expect(play(level, [{ type: "set", eta: 0.123 }]).eta).toBeCloseTo(0.12, 12);
    expect(play(level, [{ type: "set", eta: 5 }]).eta).toBe(0.75);
    expect(play(level, [{ type: "set", eta: -1 }]).eta).toBe(0.01);
  });
});
