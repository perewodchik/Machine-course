// «Подъём против Ньютона»: число итераций Ньютона не зависит от масштаба признака, подъёма — растёт; точки линии
// уровня лежат на уровне; оба метода приходят в один максимум.
import { describe, expect, it } from "vitest";
import { contour, ell, paths, problem } from "./model";

describe("подъём против Ньютона", () => {
  it("площадь ÷ 3: Ньютон — столько же итераций, подъём — в разы больше", () => {
    const a = paths(problem(1), [0, 0]);
    const b = paths(problem(1 / 3), [0, 0]);
    expect(a.newton.iters).not.toBeNull();
    expect(b.newton.iters).toBe(a.newton.iters);
    expect(b.ascent.iters!).toBeGreaterThan(5 * a.ascent.iters!);
    expect(a.ascent.iters!).toBeGreaterThan(20 * a.newton.iters!);
    // числа урока 1.4
    expect([a.newton.iters, a.ascent.iters, b.ascent.iters]).toEqual([8, 1445, 11261]);
  });

  it("оба метода приходят в θ̂; при площади ÷ 3 первый вес умножается на 3", () => {
    const p = problem(1);
    const { newton, ascent } = paths(p, [0, 0]);
    expect(Math.hypot(newton.points.at(-1)![0]! - ascent.points.at(-1)![0]!, newton.points.at(-1)![1]! - ascent.points.at(-1)![1]!)).toBeLessThan(1e-4);
    expect(problem(1 / 3).thetaHat[0]).toBeCloseTo(3 * p.thetaHat[0], 6);
  });

  it("линия уровня: ℓ/n на ней равен уровню", () => {
    const p = problem(1);
    const level = p.ellHat - 0.05;
    for (const q of contour(p, level).slice(0, 10)) expect(ell(p, q)).toBeCloseTo(level, 6);
  });
});
