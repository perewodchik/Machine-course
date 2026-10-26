// «Машина правдоподобия»: MLE по формуле — максимум ℓ на сетке бегунка; бот, выставив MLE, проходит любой уровень;
// θ на краю диапазона не принимается; замеров не больше шести.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { rng } from "../../lib/math/rng";
import { BUDGET, ell, likelihoodMachine, LEVELS, mle, solve } from "./model";

const level = (seed: number, l: number) => likelihoodMachine.generate(rng(seed * 1000 + l), l + 1);

describe("машина правдоподобия", () => {
  it("на любом seed и уровне MLE по формуле не хуже любой точки сетки, бот проходит", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.integer({ min: 0, max: LEVELS - 1 }), (seed, l) => {
        const lv = level(seed, l);
        const best = ell(lv, mle(lv));
        for (let t = lv.range[0]; t <= lv.range[1]; t += lv.step) expect(ell(lv, t)).toBeLessThanOrEqual(best + 1e-9);
        let s = likelihoodMachine.init(lv, rng(1));
        for (const a of solve(s)) s = likelihoodMachine.step(s, a);
        expect(likelihoodMachine.status(s)).toBe("solved");
        expect(likelihoodMachine.score(s)).toBe(1);
        // край диапазона далеко от максимума — сдача не принимается
        let edge = likelihoodMachine.init(lv, rng(1));
        edge = likelihoodMachine.step(edge, { type: "set", theta: lv.range[0] });
        edge = likelihoodMachine.step(edge, { type: "submit" });
        expect(edge.submitted).toBeNull();
      }),
      { numRuns: 80 },
    );
  });

  it("не больше шести замеров; промах объяснён", () => {
    let s = likelihoodMachine.init(level(2, 0), rng(1));
    for (let i = 0; i < 9; i++) s = likelihoodMachine.step(s, { type: "probe" });
    expect(s.probes).toHaveLength(BUDGET);
    s = likelihoodMachine.step(s, { type: "set", theta: 0.01 });
    s = likelihoodMachine.step(s, { type: "submit" });
    expect(likelihoodMachine.feedback(s)).toContain("не принято");
  });
});
