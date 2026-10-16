// «Проекция y на плоскость столбцов»: остаток перпендикулярен столбцам, ŷ ближе к y любой другой точки плоскости.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { A, B, camera, norm, project, residDots, sub } from "./model";

describe("проекция на плоскость", () => {
  const coord = fc.double({ min: -3, max: 3, noNaN: true });

  it("Xᵀ(y − ŷ) = 0 и точка плоскости дальше от y, чем ŷ", () => {
    fc.assert(
      fc.property(coord, coord, coord, coord, coord, (y1, y2, y3, s, t) => {
        const y = [y1, y2, y3] as const;
        const { yhat, resid } = project(y);
        for (const v of residDots(resid)) expect(v).toBeCloseTo(0, 9);
        const other = [s * A[0] + t * B[0], s * A[1] + t * B[1], s * A[2] + t * B[2]] as const;
        expect(norm(sub(y, other))).toBeGreaterThanOrEqual(norm(sub(y, yhat)) - 1e-9);
      }),
    );
  });

  it("точка плоскости проецируется в себя, нормаль — в ноль", () => {
    expect(project([1, 1, 1]).yhat.map((v) => Math.round(v * 1e9) / 1e9)).toEqual([1, 1, 1]);
    const n = [-0.5, -0.5, 1] as const; // перпендикулярна A и B
    expect(norm(project(n).yhat)).toBeCloseTo(0, 12);
  });

  it("камера сверху без наклона — вид на плоскость xy", () => {
    expect(camera(0, 90)([1, 2, 3])).toEqual([1, 2]);
  });
});
