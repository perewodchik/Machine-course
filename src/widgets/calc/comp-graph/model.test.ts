// «Вычислительный граф»: обратный проход совпадает с численными производными и с формулой 2(θᵀx − y)x.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { known, run, STEPS, type Inputs } from "./model";

const v = fc.double({ min: -3, max: 3, noNaN: true });
const inputs = fc.tuple(v, v, v, v, v).map(([a, b, c, d, y]) => ({ theta: [a, b], x: [c, d], y }) as Inputs);
const loss = ({ theta, x, y }: Inputs) => (theta[0] * x[0] + theta[1] * x[1] - y) ** 2;

describe("вычислительный граф", () => {
  it("∂L/∂θ из обратного прохода — численная производная и 2(θᵀx − y)x", () => {
    fc.assert(
      fc.property(inputs, (inp) => {
        const p = run(inp);
        const h = 1e-6;
        for (const j of [0, 1] as const) {
          const plus = { ...inp, theta: inp.theta.map((t, k) => (k === j ? t + h : t)) as [number, number] };
          const minus = { ...inp, theta: inp.theta.map((t, k) => (k === j ? t - h : t)) as [number, number] };
          const numeric = (loss(plus) - loss(minus)) / (2 * h);
          expect(p.grad[j === 0 ? "t1" : "t2"]).toBeCloseTo(numeric, 4);
          expect(p.grad[j === 0 ? "t1" : "t2"]).toBeCloseTo(2 * p.value.r * inp.x[j], 9);
        }
        expect(p.value.L).toBeCloseTo(loss(inp), 9);
        expect(p.grad.y).toBeCloseTo(-2 * p.value.r, 9);
      }),
    );
  });

  it("шаги: сначала все значения, потом производные; в конце известны ∂L/∂θ₁ и ∂L/∂θ₂", () => {
    expect(known(0).grads.size).toBe(0);
    expect(known(5).values.has("L")).toBe(true);
    expect(known(5).grads.size).toBe(0);
    const end = known(STEPS.length);
    expect(end.grads.has("t1") && end.grads.has("t2")).toBe(true);
    const p = run({ theta: [0.5, 1], x: [2, 1], y: 3 });
    expect(STEPS.at(-1)!.text(p)).toContain("2(θᵀx − y)x");
  });
});
