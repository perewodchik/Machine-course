// «Линии уровня xᵀAx»: точки кривых лежат на уровне, классификация по собственным значениям, полуоси 1/√λ.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { classify, eig2, form, levelCurves, PRESETS } from "./model";

describe("линии уровня", () => {
  const v = fc.double({ min: -3, max: 3, noNaN: true });

  it("каждая точка каждой кривой лежит на уровне k", () => {
    fc.assert(
      fc.property(v, v, v, fc.constantFrom(1, 4, -1, -4), (a, b, c, k) => {
        for (const curve of levelCurves(a, b, c, k, 5, 24)) for (const p of curve) expect(form(a, b, c, p)).toBeCloseTo(k, 6);
      }),
    );
  });

  it("собственные значения: сумма — след, произведение — определитель", () => {
    fc.assert(
      fc.property(v, v, v, (a, b, c) => {
        const { l1, l2 } = eig2(a, b, c);
        expect(l1 + l2).toBeCloseTo(a + c, 9);
        expect(l1 * l2).toBeCloseTo(a * c - b * b, 9);
        expect(l1).toBeGreaterThanOrEqual(l2);
      }),
    );
  });

  it("заготовки — эллипсы, полосы, гиперболы; у эллипса xᵀAx = 1 полуоси 1/√λ", () => {
    expect(PRESETS.map((p) => classify(eig2(...p.abc).l1, eig2(...p.abc).l2))).toEqual(["pd", "psd", "indefinite"]);
    const [a, b, c] = [4, 0, 1]; // λ = 4 и 1: полуоси 0.5 и 1
    const pts = levelCurves(a, b, c, 1)[0]!;
    const r = pts.map(([x, y]) => Math.hypot(x, y));
    expect(Math.min(...r)).toBeCloseTo(0.5, 3);
    expect(Math.max(...r)).toBeCloseTo(1, 3);
  });

  it("для положительно определённой формы отрицательных уровней нет", () => {
    expect(levelCurves(2, 0.5, 1, -1)).toEqual([]);
  });
});
