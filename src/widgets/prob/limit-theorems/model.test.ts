// Предельные теоремы: бегущее среднее сходится к μ с ошибкой порядка σ/√n; стандартизованная сумма —
// среднее 0, дисперсия 1, при большом n гистограмма близка к N(0, 1); модель детерминирована по seed.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BASES, histogram, insideOne, phi, runningMeans, standardizedSums, type BaseId } from "./model";

const IDS = Object.keys(BASES) as BaseId[];

describe("закон больших чисел", () => {
  it("для любого seed и распределения среднее 4000 значений в пределах 4σ/√n от μ", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1e6 }), fc.constantFrom(...IDS), (seed, id) => {
        const m = runningMeans(id, 4000, seed);
        const { mean, variance } = BASES[id];
        expect(Math.abs(m[3999]! - mean)).toBeLessThan((4 * Math.sqrt(variance)) / Math.sqrt(4000));
      }),
      { numRuns: 40 },
    );
  });

  it("один seed — одна и та же выборка", () => {
    expect(runningMeans("dice", 50, 7)).toEqual(runningMeans("dice", 50, 7));
    expect(runningMeans("dice", 50, 7)).not.toEqual(runningMeans("dice", 50, 8));
  });
});

describe("центральная предельная теорема", () => {
  it("стандартизованная сумма: среднее около 0, дисперсия около 1", () => {
    for (const id of IDS) {
      const z = standardizedSums(id, 30, 4000, 3);
      const m = z.reduce((a, b) => a + b, 0) / z.length;
      const v = z.reduce((a, b) => a + (b - m) ** 2, 0) / z.length;
      expect(Math.abs(m)).toBeLessThan(0.07);
      expect(Math.abs(v - 1)).toBeLessThan(0.1);
    }
  });

  it("при n = 50 доля в [−1, 1] близка к 0.683, а у одной показательной (n = 1) — нет", () => {
    expect(Math.abs(insideOne(standardizedSums("exponential", 50, 6000, 5)) - 0.683)).toBeLessThan(0.03);
    // n = 1: |X − 1| ≤ 1 ⇔ X ≤ 2, P = 1 − e⁻² ≈ 0.865
    expect(insideOne(standardizedSums("exponential", 1, 6000, 5))).toBeGreaterThan(0.84);
  });

  it("гистограмма — плотность: площадь равна доле внутри отрезка; при n = 50 близка к φ", () => {
    const z = standardizedSums("uniform", 50, 8000, 11);
    const bins = histogram(z, -4, 4, 0.5);
    expect(bins).toHaveLength(16);
    const area = bins.reduce((s, b) => s + b.density * (b.hi - b.lo), 0);
    expect(area).toBeCloseTo(z.filter((v) => v >= -4 && v < 4).length / z.length, 12);
    for (const b of bins) expect(Math.abs(b.density - phi((b.lo + b.hi) / 2))).toBeLessThan(0.05);
  });
});
