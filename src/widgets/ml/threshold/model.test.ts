// «Порог классификатора»: числа модели совпадают с Python (code/tests/test_threshold.py) на тех же данных (data.json).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import data from "./data.json";
import { accuracy, bayesThreshold, bestThreshold, confusion, fpr, precision, recall, rocAuc, rocPoints, totalCost } from "./model";

const { scores: s, y } = data as { scores: number[]; y: number[] };

describe("порог классификатора", () => {
  it("числа урока 2.1 — как в Python", () => {
    expect([s.length, y.reduce((a, b) => a + b, 0)]).toEqual([300, 84]);
    expect(rocAuc(s, y)).toBeCloseTo(0.848, 3);
    const c = confusion(s, y, 0.5);
    expect(c).toEqual({ tp: 34, fp: 10, fn: 50, tn: 206 });
    expect(precision(c)).toBeCloseTo(0.773, 3);
    expect(recall(c)).toBeCloseTo(0.405, 3);
    expect(accuracy(c)).toBeCloseTo(0.8, 2);
    expect(totalCost(s, y, 1.001, 1, 5)).toBe(420);
    expect(totalCost(s, y, 0.5, 1, 5)).toBe(260);
    expect(bayesThreshold(1, 5)).toBeCloseTo(0.167, 3);
    expect(totalCost(s, y, bayesThreshold(1, 5), 1, 5)).toBe(125);
    expect(bestThreshold(s, y, 1, 5)).toEqual({ t: 0.181, cost: 121 });
  });

  it("ROC: от (0, 0) до (1, 1), монотонна; площадь под ломаной — AUC", () => {
    const pts = rocPoints(s, y);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts.at(-1)).toEqual([1, 1]);
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i]![0]).toBeGreaterThanOrEqual(pts[i - 1]![0]);
      expect(pts[i]![1]).toBeGreaterThanOrEqual(pts[i - 1]![1]);
    }
    let area = 0;
    for (let i = 1; i < pts.length; i++) area += (pts[i]![0] - pts[i - 1]![0]) * (pts[i]![1] + pts[i - 1]![1]) / 2;
    expect(area).toBeCloseTo(rocAuc(s, y), 6);
  });

  it("свойства: клетки матрицы в сумме n; с ростом порога полнота и FPR не растут", () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: 1, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (a, b) => {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const c1 = confusion(s, y, lo);
        const c2 = confusion(s, y, hi);
        expect(c1.tp + c1.fp + c1.fn + c1.tn).toBe(s.length);
        expect(recall(c2)).toBeLessThanOrEqual(recall(c1));
        expect(fpr(c2)).toBeLessThanOrEqual(fpr(c1));
      }),
    );
  });
});
