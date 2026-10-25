// «Поле градиентов»: ∇f совпадает с численным, перпендикулярен линии уровня, D_u f максимальна вдоль ∇f.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { arrows, contourThrough, directional, f, grad, norm, PRESETS, type Abc, type Vec2 } from "./model";

const v = fc.double({ min: -2, max: 2, noNaN: true });
const abc = fc.tuple(v, v, v) as fc.Arbitrary<Abc>;
const pt = fc.tuple(v, v) as fc.Arbitrary<Vec2>;

describe("поле градиентов", () => {
  it("∇f совпадает с центральной разностью", () => {
    fc.assert(
      fc.property(abc, pt, (A, x) => {
        const h = 1e-5;
        const g = grad(A, x);
        expect(g[0]).toBeCloseTo((f(A, [x[0] + h, x[1]]) - f(A, [x[0] - h, x[1]])) / (2 * h), 5);
        expect(g[1]).toBeCloseTo((f(A, [x[0], x[1] + h]) - f(A, [x[0], x[1] - h])) / (2 * h), 5);
      }),
    );
  });

  it("производная по направлению — ∇fᵀu, наибольшая вдоль ∇f и равна |∇f|", () => {
    fc.assert(
      fc.property(abc, pt, fc.double({ min: 0, max: 2 * Math.PI, noNaN: true }), (A, x, phi) => {
        const g = grad(A, x);
        expect(directional(A, x, phi)).toBeLessThanOrEqual(norm(g) + 1e-12);
        if (norm(g) > 1e-6) expect(directional(A, x, Math.atan2(g[1], g[0]))).toBeCloseTo(norm(g), 9);
      }),
    );
  });

  it("градиент перпендикулярен линии уровня: касательная к кривой через x₀ ортогональна ∇f(x₀)", () => {
    for (const p of PRESETS)
      for (const x0 of [[1, 0.5], [-0.7, 1.2], [1.3, -0.4]] as Vec2[]) {
        const g = grad(p.abc, x0);
        // ближайшая к x₀ точка кривой и её соседи дают касательную
        let best = { d: Infinity, pts: [] as Vec2[], i: 0 };
        for (const pts of contourThrough(p.abc, x0))
          pts.forEach((q, i) => {
            const d = Math.hypot(q[0] - x0[0], q[1] - x0[1]);
            if (d < best.d && i > 0 && i < pts.length - 1) best = { d, pts, i };
          });
        const [q0, q1] = [best.pts[best.i - 1]!, best.pts[best.i + 1]!];
        const t = [q1[0] - q0[0], q1[1] - q0[1]];
        const cos = (t[0]! * g[0] + t[1]! * g[1]) / (Math.hypot(t[0]!, t[1]!) * norm(g));
        expect(Math.abs(cos), `${p.id} ${x0}`).toBeLessThan(0.08);
      }
  });

  it("стрелки направлены по градиенту и не длиннее 0.8 шага", () => {
    for (const p of PRESETS)
      for (const { from, to } of arrows(p.abc, 2, 0.5)) {
        const g = grad(p.abc, from);
        const d = [to[0] - from[0], to[1] - from[1]] as Vec2;
        expect(norm(d)).toBeLessThanOrEqual(0.4 + 1e-12);
        expect((d[0] * g[0] + d[1] * g[1]) / (norm(d) * norm(g))).toBeCloseTo(1, 9);
      }
  });
});
