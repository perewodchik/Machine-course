// Логистика для виджетов урока 1.4: на перекрытых классах Ньютон и подъём приходят в один максимум, градиент там ноль;
// на разделимых ℓ растёт с ‖θ‖; ℓ и сигмоида устойчивы при больших |θᵀx|. Числа урока — в тестах виджетов.
import { describe, expect, it } from "vitest";
import { ascentPath, meanGrad, meanLoglik, newtonPath, sigmoid, softplus } from "./logistic";

const X = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2].map((v) => [1, v]);
const y = [0, 0, 1, 0, 1, 0, 1, 1, 1];

describe("логистическая регрессия", () => {
  it("Ньютон и подъём — в один максимум, Ньютон за несколько итераций", () => {
    const n = newtonPath(X, y, [0, 0]);
    const a = ascentPath(X, y, [0, 0], 1);
    expect(n.iters).toBeLessThan(10);
    expect(a.iters!).toBeGreaterThan(3 * n.iters!);
    const t = n.points.at(-1)!;
    expect(Math.hypot(...meanGrad(t, X, y))).toBeLessThan(1e-8);
    expect(Math.hypot(t[0]! - a.points.at(-1)![0]!, t[1]! - a.points.at(-1)![1]!)).toBeLessThan(1e-5);
  });

  it("разделимые данные: ℓ растёт с крутизной к нулю", () => {
    const ys = [0, 0, 0, 0, 0, 1, 1, 1, 1];
    const Xs = X.map(([, v]) => [1, v! - 0.25]);
    expect(meanLoglik([0, 10], Xs, ys)).toBeGreaterThan(meanLoglik([0, 1], Xs, ys));
    expect(meanLoglik([0, 100], Xs, ys)).toBeLessThan(0);
  });

  it("устойчивость: softplus и сигмоида при больших аргументах", () => {
    expect(softplus(800)).toBe(800);
    expect(softplus(-800)).toBe(0);
    expect(sigmoid(-800)).toBe(0);
    expect(sigmoid(800)).toBe(1);
  });
});
