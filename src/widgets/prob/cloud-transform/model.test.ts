// «Линейное преобразование облака»: выборочная ковариация AX близка к AAᵀ; AΣAᵀ симметрична и ⪰ 0 для любой A;
// ошибка AΣ несимметрична; у вырожденной A det = 0 и облако лежит на прямой.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { apply, baseCloud, covLinear, det, mul, PRESETS, sampleCov, type Mat2 } from "./model";

const I: Mat2 = [
  [1, 0],
  [0, 1],
];
const mat = fc.tuple(fc.integer({ min: -20, max: 20 }), fc.integer({ min: -20, max: 20 }), fc.integer({ min: -20, max: 20 }), fc.integer({ min: -20, max: 20 })).map(([a, b, c, d]) => [[a / 10, b / 10], [c / 10, d / 10]] as Mat2);

describe("линейное преобразование облака", () => {
  it("выборочная ковариация AX + b близка к AAᵀ, сдвиг её не меняет", () => {
    const X = baseCloud();
    for (const A of Object.values(PRESETS)) {
      const S = sampleCov(X.map((p) => apply(A, [1.5, -1], p)));
      const F = covLinear(A, sampleCov(X));
      for (const i of [0, 1]) for (const j of [0, 1]) expect(S[i]![j]!).toBeCloseTo(F[i]![j]!, 9);
      const T = covLinear(A, I);
      for (const i of [0, 1]) for (const j of [0, 1]) expect(Math.abs(S[i]![j]! - T[i]![j]!)).toBeLessThan(0.35);
    }
  });

  it("для любой A: AΣAᵀ симметрична, след ≥ 0, det = (det A)² det Σ ≥ 0", () => {
    const S: Mat2 = [
      [2, 0.6],
      [0.6, 1],
    ];
    fc.assert(
      fc.property(mat, (A) => {
        const C = covLinear(A, S);
        expect(C[0][1]).toBeCloseTo(C[1][0], 12);
        expect(C[0][0] + C[1][1]).toBeGreaterThanOrEqual(0);
        expect(det(C)).toBeCloseTo(det(A) ** 2 * det(S), 9);
      }),
    );
  });

  it("ошибка AΣ: несимметрична у сдвига; вырожденная A: det 0, точки на прямой y = x", () => {
    const wrong = mul(PRESETS.сдвиг!, I);
    expect(wrong[0][1]).not.toBeCloseTo(wrong[1][0], 3);
    expect(det(PRESETS.вырожденная!)).toBe(0);
    for (const p of baseCloud().slice(0, 20)) {
      const [x, y] = apply(PRESETS.вырожденная!, [0, 0], p);
      expect(x).toBeCloseTo(y, 12);
    }
  });
});
