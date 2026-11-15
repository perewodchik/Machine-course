// «Переобучи, если сможешь: облако»: бот проходит все уровни; на богатых данных лучшая степень выше, чем на десяти
// точках с шумом; степень 10 на малой выборке не принимается.
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { bestDegree, LEVEL_KINDS, LEVELS, overfitCloud, solve, type Level, type State } from "./model";

const play = (level: Level, actions: Parameters<typeof overfitCloud.step>[1][]): State => actions.reduce((s, a) => overfitCloud.step(s, a), overfitCloud.init(level, rng(1)));

describe("облако: предскажи степень", () => {
  it("бот проходит все уровни; лучшая степень падает от богатых данных к малым", () => {
    for (let seed = 1; seed <= 6; seed++) {
      const best: number[] = [];
      for (let k = 1; k <= LEVELS; k++) {
        const level = overfitCloud.generate(rng(seed * 1000 + k - 1), k);
        expect(level.kind).toBe(LEVEL_KINDS[k - 1]);
        const s = play(level, solve(overfitCloud.init(level, rng(1))));
        expect(overfitCloud.status(s)).toBe("solved");
        expect(overfitCloud.score(s)).toBe(1);
        best.push(bestDegree(level));
      }
      expect(best[0]!).toBeGreaterThan(best[3]!);
      expect(best[3]!).toBeLessThanOrEqual(2);
    }
  });

  it("степень 10 на десяти точках не принята", () => {
    const level = overfitCloud.generate(rng(5), 4);
    const s = play(level, [{ type: "set", k: 10 }, { type: "submit" }]);
    expect(overfitCloud.status(s)).toBe("playing");
    expect(overfitCloud.feedback(s)).toMatch(/не принята/);
  });
});
