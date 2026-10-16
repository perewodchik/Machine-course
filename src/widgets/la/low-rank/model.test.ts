// Модель «Сжать картинку SVD»: метод Якоби даёт ортонормированные V и AᵀA V = V Λ; ошибка приближения ранга k
// совпадает с хвостом сингулярных чисел (Эккарт — Янг), при k = ранг картинка восстанавливается точно.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { lowRank, numericRank, picture, relError, storage, svdOf, symEig, type Matrix } from "./model";

const frob2 = (A: Matrix) => A.reduce((acc, row) => acc + row.reduce((a, x) => a + x * x, 0), 0);
const minus = (A: Matrix, B: Matrix) => A.map((row, i) => row.map((x, j) => x - B[i]![j]!));

describe("symEig", () => {
  it("собственные пары симметричной матрицы, векторы ортонормированы, значения по убыванию", () => {
    fc.assert(
      fc.property(fc.array(fc.double({ min: -3, max: 3, noNaN: true }), { minLength: 16, maxLength: 16 }), (xs) => {
        const B = [0, 1, 2, 3].map((i) => xs.slice(4 * i, 4 * i + 4));
        const S = B.map((_, i) => B.map((__, j) => B[i]![j]! + B[j]![i]!));
        const { values, vectors: V } = symEig(S);
        for (let c = 0; c < 4; c++) {
          for (let i = 0; i < 4; i++) expect(S[i]!.reduce((acc, x, j) => acc + x * V[j]![c]!, 0)).toBeCloseTo(values[c]! * V[i]![c]!, 8);
          for (let d = 0; d < 4; d++) expect(V.reduce((acc, row) => acc + row[c]! * row[d]!, 0)).toBeCloseTo(c === d ? 1 : 0, 10);
          if (c > 0) expect(values[c - 1]!).toBeGreaterThanOrEqual(values[c]!);
        }
      }),
      { numRuns: 50 },
    );
  });
});

describe("картинка", () => {
  const A = picture();
  const { s, V } = svdOf(A);

  it("Σ σᵢ² = ‖A‖²_F, ошибка ранга k — хвост сингулярных чисел", () => {
    expect(s.reduce((acc, x) => acc + x * x, 0)).toBeCloseTo(frob2(A), 8);
    for (const k of [1, 3, 8]) expect(Math.sqrt(frob2(minus(A, lowRank(A, V, k))) / frob2(A))).toBeCloseTo(relError(s, k), 9);
  });

  it("при k = ранг картинка восстанавливается точно; хвост убывает", () => {
    const r = numericRank(s);
    expect(r).toBeGreaterThan(12);
    expect(r).toBeLessThan(48);
    expect(Math.max(...minus(A, lowRank(A, V, r)).flat().map(Math.abs))).toBeLessThan(1e-9);
    for (let k = 1; k < r; k++) expect(relError(s, k + 1)).toBeLessThanOrEqual(relError(s, k));
  });

  it("память: k(m + n + 1) против mn", () => {
    expect(storage(48, 48, 5)).toBe(485);
    expect(storage(48, 48, 1)).toBeLessThan(48 * 48);
  });
});
