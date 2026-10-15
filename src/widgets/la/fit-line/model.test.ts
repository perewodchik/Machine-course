// Числа виджета совпадают с Python (code/tests/test_normal_equations.py): урок показывает их в тексте.
import { describe, expect, it } from "vitest";
import { DATA, gradient, leastSquares, loss, residuals, towards } from "./model";

const { x, y } = DATA;

describe("подгонка прямой", () => {
  it("данные — двенадцать точек из make_data (seed = 7)", () => {
    expect(x).toHaveLength(12);
    expect(x[0]).toBeCloseTo(6.125859, 6);
    expect(y[6]).toBeCloseTo(0.36033, 5);
  });

  it("минимум θ* = (0.798, 0.548), как в NumPy", () => {
    const t = leastSquares(x, y);
    expect(t.t0.toFixed(3)).toBe("0.798");
    expect(t.t1.toFixed(3)).toBe("0.548");
  });

  it("J(2.5, 0.25) = 5.23 и J(θ*) = 1.466", () => {
    expect(loss({ t0: 2.5, t1: 0.25 }, x, y).toFixed(2)).toBe("5.23");
    expect(loss(leastSquares(x, y), x, y).toFixed(3)).toBe("1.466");
  });

  it("в минимуме градиент ноль, а сумма остатков ноль (есть столбец единиц)", () => {
    const t = leastSquares(x, y);
    const g = gradient(t, x, y);
    expect(Math.abs(g.t0)).toBeLessThan(1e-9);
    expect(Math.abs(g.t1)).toBeLessThan(1e-9);
    expect(Math.abs(residuals(t, x, y).reduce((a, r) => a + r, 0))).toBeLessThan(1e-9);
  });

  it("минимум глобальный: любой сдвиг увеличивает J", () => {
    const t = leastSquares(x, y);
    const j = loss(t, x, y);
    for (const [d0, d1] of [[0.1, 0], [0, 0.01], [-0.3, 0.05], [0.2, -0.02]]) {
      expect(loss({ t0: t.t0 + d0!, t1: t.t1 + d1! }, x, y)).toBeGreaterThan(j);
    }
  });

  it("одинаковые x — понятная ошибка вместо деления на ноль", () => {
    expect(() => leastSquares([1, 1, 1], [1, 2, 3])).toThrow("линейно зависимы");
  });

  it("анимация к минимуму начинается в from и кончается в to", () => {
    const from = { t0: 2.5, t1: 0.25 };
    const to = { t0: 0.8, t1: 0.55 };
    expect(towards(from, to, 0)).toEqual(from);
    expect(towards(from, to, 1)).toEqual(to);
  });
});
