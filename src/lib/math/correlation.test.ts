// Корреляция: |ρ| ≤ 1, инвариантность к сдвигу и масштабу, знак при отражении; облака дают заданное ρ.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { corr, linearCloud, moments, parabolaCloud, ringCloud } from "./correlation";
import { rng } from "./rng";

describe("выборочная корреляция", () => {
  it("|ρ| ≤ 1, не меняется при сдвиге и положительном масштабе, меняет знак при отражении", () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: -50, max: 50 })), { minLength: 3, maxLength: 30 }), fc.integer({ min: 1, max: 9 }), (pts, a) => {
        const r = corr(pts);
        expect(Math.abs(r)).toBeLessThanOrEqual(1 + 1e-12);
        expect(corr(pts.map(([x, y]) => [a * x + 3, y - 7] as const))).toBeCloseTo(r, 9);
        expect(corr(pts.map(([x, y]) => [-x, y] as const))).toBeCloseTo(-r, 9);
      }),
    );
  });

  it("точки на прямой: ρ = ±1; Cov(X, X) = Var X", () => {
    expect(corr([[0, 1], [1, 3], [2, 5]])).toBeCloseTo(1, 12);
    expect(corr([[0, 1], [1, -1], [3, -5]])).toBeCloseTo(-1, 12);
    const m = moments([[1, 1], [2, 2], [4, 4]]);
    expect(m.cov).toBeCloseTo(m.vx, 12);
  });
});

describe("облака", () => {
  it("линейное облако из 2000 точек даёт ρ в пределах 0.05", () => {
    for (const rho of [-0.9, -0.3, 0, 0.5, 0.8]) expect(Math.abs(corr(linearCloud(rng(5), rho, 2000)) - rho)).toBeLessThan(0.05);
  });

  it("парабола и кольцо: зависимость есть, корреляция около нуля", () => {
    expect(Math.abs(corr(parabolaCloud(rng(3), 2000)))).toBeLessThan(0.06);
    expect(Math.abs(corr(ringCloud(rng(3), 2000)))).toBeLessThan(0.06);
  });
});
