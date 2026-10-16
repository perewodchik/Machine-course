// «Ax = b»: ранги и число решений, единственное решение удовлетворяет обоим уравнениям, концы прямых лежат на прямой.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { analyze, FIRST, lineEnds, PRESETS, rank } from "./model";

describe("число решений по рангам", () => {
  it("заготовки: одно, нет, бесконечно много", () => {
    expect(PRESETS.map((p) => analyze(FIRST, p.row).kind)).toEqual(["one", "none", "many"]);
    expect(analyze(FIRST, PRESETS[1]!.row)).toMatchObject({ rankA: 1, rankAb: 2 });
    expect(analyze(FIRST, PRESETS[2]!.row)).toMatchObject({ rankA: 1, rankAb: 1 });
  });

  it("единственное решение удовлетворяет обоим уравнениям", () => {
    const int = fc.integer({ min: -4, max: 4 });
    fc.assert(
      fc.property(fc.tuple(int, int, int), fc.tuple(int, int, int), (r1, r2) => {
        const a = analyze(r1, r2);
        if (a.kind !== "one") return;
        for (const [p, q, b] of [r1, r2]) expect(p * a.x![0] + q * a.x![1]).toBeCloseTo(b, 9);
      }),
    );
  });

  it("ранг нулевой матрицы — 0, строки пропорциональны — 1", () => {
    expect(rank([[0, 0], [0, 0]])).toBe(0);
    expect(rank([[1, 2, 2], [2, 4, 4]])).toBe(1);
  });

  it("концы прямой лежат на ней; нулевая строка — не прямая", () => {
    for (const [p, q] of lineEnds([2, -3, 5])!) expect(2 * p - 3 * q).toBeCloseTo(5, 9);
    expect(lineEnds([0, 0, 1])).toBeNull();
  });
});
