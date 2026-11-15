// «Найди утечку»: у каждого уровня ровно один верный вариант и разбор у каждого варианта; бот проходит с очками 1;
// неверный выбор объясняется и снижает очки; «утечки нет» — последний вариант и верен только на последнем уровне.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { findLeak, LEVEL_KINDS, LEVELS, solve, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof findLeak.step>[1][]): State => actions.reduce((s, a) => findLeak.step(s, a), findLeak.init(level, rng(1)));

describe("найди утечку", () => {
  it("уровни: верный вариант существует, у всех вариантов есть разбор, «утечки нет» — последним", () => {
    for (let seed = 1; seed <= 10; seed++)
      for (let k = 1; k <= LEVELS; k++) {
        const l = findLeak.generate(rng(seed * 100 + k), k);
        expect(l.kind).toBe(LEVEL_KINDS[k - 1]);
        expect(l.candidates.filter((c) => c.id === l.answer)).toHaveLength(1);
        for (const c of l.candidates) expect(c.why.length).toBeGreaterThan(20);
        expect(l.candidates.at(-1)!.id).toBe("none");
        const s = play(l, solve(findLeak.init(l, rng(1))));
        expect(findLeak.status(s)).toBe("solved");
        expect(findLeak.score(s)).toBe(1);
      }
    expect(LEVEL_KINDS.filter((k) => findLeak.generate(rng(1), LEVEL_KINDS.indexOf(k) + 1).answer === "none")).toEqual(["no-leak"]);
  });

  it("неверный выбор объяснён и стоит 0.25", () => {
    const l = findLeak.generate(rng(3), 1);
    const wrong = l.candidates.find((c) => c.id !== l.answer)!.id;
    let s = play(l, [{ type: "pick", id: wrong }]);
    expect(findLeak.status(s)).toBe("playing");
    expect(findLeak.feedback(s)).toMatch(/^Не здесь\./);
    s = findLeak.step(s, { type: "pick", id: l.answer });
    expect(findLeak.score(s)).toBe(0.75);
  });
});
