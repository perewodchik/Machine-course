// Модель «Окружность → эллипс по шагам»: U S Vᵀ = A, U и V ортогональны, σ₁ ≥ σ₂ ≥ 0, последний шаг — образ под A.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { apply, circleImage, det, partial, PRESETS, reflects, svd2, type M2, type Vec2 } from "./model";

const entry = fc.double({ min: -2, max: 2, noNaN: true });
const matrix = fc.tuple(entry, entry, entry, entry).map(([a, b, c, d]) => [[a, b], [c, d]] as M2);
const dot = (x: Vec2, y: Vec2) => x[0] * y[0] + x[1] * y[1];

describe("svd2", () => {
  it("U S Vᵀ = A, столбцы U и V ортонормированы, σ₁ ≥ σ₂ ≥ 0", () => {
    fc.assert(
      fc.property(matrix, (A) => {
        const svd = svd2(A);
        const [u1, u2] = svd.u;
        const [v1, v2] = svd.v;
        for (const [x, y, want] of [[u1, u1, 1], [u2, u2, 1], [u1, u2, 0], [v1, v1, 1], [v2, v2, 1], [v1, v2, 0]] as const) expect(dot(x, y)).toBeCloseTo(want, 6);
        expect(svd.s[0]).toBeGreaterThanOrEqual(svd.s[1]);
        expect(svd.s[1]).toBeGreaterThanOrEqual(0);
        for (const e of [[1, 0], [0, 1]] as const) {
          const [x, y] = partial(svd, 3, e);
          const [ax, ay] = apply(A, e);
          expect(x).toBeCloseTo(ax, 6);
          expect(y).toBeCloseTo(ay, 6);
        }
        // σ₁σ₂ = |det A|, σ₁² + σ₂² = ‖A‖²_F
        expect(svd.s[0] * svd.s[1]).toBeCloseTo(Math.abs(det(A)), 6);
        expect(svd.s[0] ** 2 + svd.s[1] ** 2).toBeCloseTo(A.flat().reduce((acc, x) => acc + x * x, 0), 6);
      }),
    );
  });

  it("A vᵢ = σᵢ uᵢ, а отражение — в U, когда det A < 0", () => {
    fc.assert(
      fc.property(matrix, (A) => {
        const svd = svd2(A);
        for (const i of [0, 1] as const) {
          const Av = apply(A, svd.v[i]);
          expect(Av[0]).toBeCloseTo(svd.s[i] * svd.u[i][0], 6);
          expect(Av[1]).toBeCloseTo(svd.s[i] * svd.u[i][1], 6);
        }
        expect(reflects(svd)).toBe(det(A) < 0);
      }),
    );
  });

  it("почти вырожденная матрица: u₂ единичный, U S Vᵀ = A (контрпример fast-check)", () => {
    const A: M2 = [[-0.12058973347082864, 0.012047320332183427], [0, 0]];
    const svd = svd2(A);
    expect(dot(svd.u[1], svd.u[1])).toBeCloseTo(1, 12);
    expect(svd.s[1]).toBe(0);
    for (const e of [[1, 0], [0, 1]] as const) expect(partial(svd, 3, e)[0]).toBeCloseTo(apply(A, e)[0], 12);
  });

  it("шаги: Vᵀ сохраняет окружность, S даёт эллипс с полуосями σ₁, σ₂ по осям", () => {
    const svd = svd2(PRESETS[0]!.A);
    for (const p of circleImage(svd, 1)) expect(Math.hypot(...p)).toBeCloseTo(1, 9);
    for (const [x, y] of circleImage(svd, 2)) expect((x / svd.s[0]) ** 2 + (y / svd.s[1]) ** 2).toBeCloseTo(1, 9);
    // сдвиг: σ — золотое сечение и обратное к нему (то же печатает ячейка Python урока)
    expect(svd.s[0]).toBeCloseTo((1 + Math.sqrt(5)) / 2, 12);
    expect(svd.s[1]).toBeCloseTo((Math.sqrt(5) - 1) / 2, 12);
  });

  it("заготовки: отражение у второй, σ₂ = 0 у вырожденной", () => {
    const [shear, flip, singular] = PRESETS.map((p) => svd2(p.A));
    expect(reflects(shear!)).toBe(false);
    expect(reflects(flip!)).toBe(true);
    expect(singular!.s[1]).toBeCloseTo(0, 12);
    expect(singular!.s[0]).toBeCloseTo(Math.sqrt(2.5), 12);
  });
});
