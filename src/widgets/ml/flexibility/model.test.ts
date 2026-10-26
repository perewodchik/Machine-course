// «Гибкость модели»: числа совпадают с ячейкой урока 1.3 (code/tests/test_features_lwr.py), ошибка на обучении падает
// с гибкостью, LWR при большом τ — прямая МНК, при малом — гонится за шумом.
import { describe, expect, it } from "vitest";
import { localLine, loadData, lwrModel, polyModel } from "./model";

const d = loadData();

describe("гибкость модели", () => {
  it("56 обучающих и 24 валидационных точки", () => {
    expect(d.train).toHaveLength(56);
    expect(d.val).toHaveLength(24);
  });

  it("полином: RMSE как в ячейке урока, минимум валидации — степень 4", () => {
    const table: [number, number, number][] = [[1, 20.22, 22.29], [2, 14.64, 19.2], [3, 10.58, 12.24], [4, 10.55, 11.98], [6, 10.46, 12.17], [9, 10.41, 12.52]];
    for (const [p, tr, va] of table) {
      const f = polyModel(d, p);
      expect(f.train).toBeCloseTo(tr, 2);
      expect(f.val).toBeCloseTo(va, 2);
    }
    const vals = Array.from({ length: 12 }, (_, i) => polyModel(d, i + 1).val);
    expect(vals.indexOf(Math.min(...vals)) + 1).toBe(4);
  });

  it("LWR: RMSE как в ячейке урока; малое τ — почти интерполяция, большое — прямая", () => {
    for (const [tau, tr, va] of [[0.5, 6.93, 12.76], [1, 9.17, 12.25], [5, 11.66, 15.55], [100, 20.1, 22.21]] as const) {
      const f = lwrModel(d, tau);
      expect(f.train).toBeCloseTo(tr, 2);
      expect(f.val).toBeCloseTo(va, 2);
    }
    const line = polyModel(d, 1);
    const wide = lwrModel(d, 1e5);
    for (const x of [3, 20, 35]) expect(wide.predict(x)).toBeCloseTo(line.predict(x), 3);
  });

  it("веса: у точки запроса — единица, на расстоянии τ — e^(−1/2)", () => {
    const { w } = localLine([[10, 0], [12, 1], [30, 2]], 10, 2);
    expect(w[0]).toBe(1);
    expect(w[1]).toBeCloseTo(Math.exp(-0.5), 12);
  });
});
