// «Сигмоида над плоскостью»: ручки ↔ θ взаимно обратны; максимум — как в ячейке урока; ×10 к крутизне не двигает
// границу; выброс сдвигает оптимальную границу.
import { describe, expect, it } from "vitest";
import { ascentPath, newtonPath } from "../../../lib/math/logistic";
import { BASE, OUTLIER, best, boundary, design, fromTheta, prob, stats, toTheta } from "./model";

describe("сигмоида над плоскостью", () => {
  it("ручки и θ взаимно обратны", () => {
    const t = [0.3, -2, 1.5];
    const back = toTheta(fromTheta(t));
    t.forEach((v, i) => expect(back[i]).toBeCloseTo(v, 12));
  });

  it("максимум: θ, ℓ/n и доля верных — как в ячейке урока", () => {
    const t = best(BASE);
    expect(t[1]).toBeCloseTo(7.418, 3);
    const s = stats(t, BASE);
    expect(s.ell).toBeCloseTo(-0.1105, 4);
    expect(s.acc).toBeCloseTo(0.965, 3);
  });

  it("Ньютон — 8 итераций, подъём с α = 2 — 2978, как в ячейке урока", () => {
    const X = design(BASE);
    const y = BASE.map((d) => d.y);
    expect(newtonPath(X, y, [0, 0, 0]).iters).toBe(8);
    expect(ascentPath(X, y, [0, 0, 0], 2).iters).toBe(2978);
  });

  it("крутизна ×10: граница та же, вероятности ближе к 0 и 1", () => {
    const t = best(BASE);
    const k = fromTheta(t);
    const t10 = toTheta({ ...k, k: 10 * k.k });
    const [a, b] = boundary(t);
    const [a10] = boundary(t10);
    // точка одной границы лежит на другой
    expect(prob(t10, a10[0], a10[1])).toBeCloseTo(0.5, 9);
    expect(prob(t, a[0], a[1])).toBeCloseTo(0.5, 9);
    expect(prob(t, b[0], b[1])).toBeCloseTo(0.5, 9);
    expect(prob(t10, 100, 5)).toBeGreaterThan(prob(t, 100, 5));
  });

  it("выброс у метро сдвигает оптимальную границу", () => {
    const a = fromTheta(best(BASE));
    const b = fromTheta(best([...BASE, OUTLIER]));
    expect(Math.abs(a.c - b.c) + Math.abs(a.phi - b.phi) / 10).toBeGreaterThan(0.02);
  });
});
