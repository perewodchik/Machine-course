// «Четыре взгляда на AB»: все четыре способа дают одно и то же произведение.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { explain, matmul, outerTerm, partialOuter, type Matrix } from "./model";

const A: Matrix = [[1, 0, 3], [2, -1, 1]];
const B: Matrix = [[2, 1], [-1, 0], [1, 4]];

describe("четыре взгляда", () => {
  it("строка на столбец: AB = [[5, 13], [6, 6]]", () => {
    expect(matmul(A, B)).toEqual([[5, 13], [6, 6]]);
    expect(explain(A, B, { view: "entry", i: 0, j: 1 })).toBe("(AB)₁₂ = строка 1 A на столбец 2 B = 1·1 + 0·0 + 3·4 = 13");
  });

  it("сумма внешних произведений и комбинации столбцов и строк совпадают с AB на любых матрицах", () => {
    const mat = (r: number, c: number) => fc.array(fc.array(fc.integer({ min: -5, max: 5 }), { minLength: c, maxLength: c }), { minLength: r, maxLength: r });
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 4 }), fc.integer({ min: 1, max: 4 }), fc.integer({ min: 1, max: 4 }), (m, k, p) =>
        fc.assert(
          fc.property(mat(m, k), mat(k, p), (X, Y) => {
            const C = matmul(X, Y);
            expect(partialOuter(X, Y, k - 1)).toEqual(C);
            // столбец j — комбинация столбцов X, строка i — комбинация строк Y
            for (let j = 0; j < p; j++) expect(X.map((row) => row.reduce((s, x, l) => s + x * Y[l]![j]!, 0))).toEqual(C.map((r) => r[j]));
            for (let i = 0; i < m; i++) expect(Y[0]!.map((_, j) => X[i]!.reduce((s, x, l) => s + x * Y[l]![j]!, 0))).toEqual(C[i]);
          }),
          { numRuns: 10 },
        ),
      ),
      { numRuns: 20 },
    );
  });

  it("слагаемое — матрица ранга 1: строки пропорциональны строке B", () => {
    expect(outerTerm(A, B, 2)).toEqual([[3, 12], [1, 4]]);
  });

  it("несогласованные размеры — понятная ошибка", () => {
    expect(() => matmul(A, A)).toThrow("произведение не определено: 2 × 3 на 2 × 3");
  });
});
