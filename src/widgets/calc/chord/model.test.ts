// «Хорда над графиком»: выпуклые заготовки не дают отрицательного зазора, невыпуклые — дают; f'' согласована с f.
import { describe, expect, it } from "vitest";
import { chord, FN_IDS, FNS, gap, minGap, mix } from "./model";

const grid = (fnId: keyof typeof FNS, k = 24) => {
  const [x0, x1] = FNS[fnId].x;
  return Array.from({ length: k + 1 }, (_, i) => x0 + ((x1 - x0) * i) / k);
};

describe("определение выпуклости", () => {
  it("концы хорды лежат на графике, середина x² — выше на (a − b)²/4", () => {
    const fn = FNS.square;
    expect(gap(fn, -1, 2, 0)).toBeCloseTo(0, 12);
    expect(gap(fn, -1, 2, 1)).toBeCloseTo(0, 12);
    expect(mix(-1, 2, 0.5)).toBe(0.5);
    expect(chord(fn, -1, 2, 0.5)).toBe(2.5);
    expect(gap(fn, -1, 2, 0.5)).toBeCloseTo(9 / 4, 12);
  });

  it.each(FN_IDS)("%s: флаг convex совпадает с перебором хорд", (id) => {
    const xs = grid(id);
    const worst = Math.min(...xs.flatMap((a) => xs.map((b) => minGap(FNS[id], a, b, 40).gap)));
    if (FNS[id].convex) expect(worst).toBeGreaterThan(-1e-9);
    else expect(worst).toBeLessThan(-0.05);
  });

  it("у x³ хорда из [−1.5, 0.5] уходит под график, а на [0, 1.5] — нет", () => {
    expect(minGap(FNS.cubic, -1.5, 0.5).gap).toBeLessThan(0);
    expect(minGap(FNS.cubic, 0, 1.5).gap).toBe(0);
  });
});

describe("вторая производная", () => {
  it.each(FN_IDS)("%s: d2 совпадает с конечными разностями", (id) => {
    const fn = FNS[id];
    const h = 1e-3;
    for (const x of grid(id, 8)) expect(fn.d2(x)).toBeCloseTo((fn.f(x + h) - 2 * fn.f(x) + fn.f(x - h)) / (h * h), 3);
  });

  it("x⁴ строго выпукла, хотя f''(0) = 0; у двойной ямы f'' < 0 в нуле", () => {
    expect(FNS.quartic.d2(0)).toBe(0);
    expect(FNS.well.d2(0)).toBe(-4);
  });
});
