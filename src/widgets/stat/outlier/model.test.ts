// «Перетащи выброс»: квантили как в NumPy; среднее сдвигается на Δ/n, а медиана и IQR не меняются, пока выброс
// остаётся правее середины выборки; стандартное отклонение растёт без границы.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BASE, iqr, mean, median, quantile, std } from "./model";

describe("описательные статистики", () => {
  it("квантили и стандартное отклонение — как np.quantile и np.std(ddof=1)", () => {
    const x = [1, 2, 3, 4, 10];
    expect(median(x)).toBe(3);
    expect(quantile(x, 0.25)).toBe(2);
    expect(quantile(x, 0.9)).toBeCloseTo(7.6, 12); // np.quantile([1, 2, 3, 4, 10], 0.9) = 7.6
    expect(std(x)).toBeCloseTo(3.5355339059327378, 12); // np.std(..., ddof=1)
    expect(std(x, 0)).toBeCloseTo(3.1622776601683795, 12);
  });

  it("выброс правее всех: медиана и IQR стоят, среднее уезжает на Δ/12", () => {
    const at = (v: number) => [...BASE, v];
    fc.assert(
      fc.property(fc.double({ min: 14, max: 60, noNaN: true }), fc.double({ min: 0, max: 40, noNaN: true }), (v, d) => {
        expect(median(at(v + d))).toBeCloseTo(median(at(v)), 12);
        expect(iqr(at(v + d))).toBeCloseTo(iqr(at(v)), 12);
        expect(mean(at(v + d)) - mean(at(v))).toBeCloseTo(d / 12, 9);
        expect(std(at(v + d))).toBeGreaterThanOrEqual(std(at(v)) - 1e-12);
      }),
    );
  });
});
