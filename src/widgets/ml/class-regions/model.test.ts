// «Области классов»: оптимум — как в ячейке урока (J = 0.2702, 87 % верных); общий сдвиг всех θ_j не меняет ни
// вероятностей, ни областей; умножение на число меняет только резкость; ручки ↔ θ взаимно обратны.
import { describe, expect, it } from "vitest";
import { probs } from "../../../lib/math/softmax";
import { best, fromTheta, region, shiftAll, stats, toTheta, X } from "./model";

describe("области классов", () => {
  it("оптимум — как в ячейке урока", () => {
    const s = stats(best());
    expect(s.J).toBeCloseTo(0.2702, 4);
    expect(s.acc).toBeCloseTo(0.87, 3);
    const p = probs(best(), X[0]!);
    expect(p[0]).toBeCloseTo(0.562, 3);
  });

  it("сдвиг всех θ_j ничего не меняет, множитель — только резкость", () => {
    const t = best();
    const s = shiftAll(t, [0.4, 0.8, -0.5]);
    expect(stats(s).J).toBeCloseTo(stats(t).J, 10);
    for (const [a, b] of [[0, 0], [1, -1], [-1.5, 0.5]] as const) {
      expect(region(s, a, b).j).toBe(region(t, a, b).j);
      const t2 = t.map((th) => th.map((v) => 2 * v));
      expect(region(t2, a, b).j).toBe(region(t, a, b).j);
      expect(region(t2, a, b).p).toBeGreaterThanOrEqual(region(t, a, b).p - 1e-12);
    }
  });

  it("ручки и θ взаимно обратны", () => {
    const t = best();
    toTheta(fromTheta(t)).forEach((th, j) => th.forEach((v, i) => expect(v).toBeCloseTo(t[j]![i]!, 10)));
  });
});
