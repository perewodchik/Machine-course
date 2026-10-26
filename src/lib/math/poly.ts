// Полиномиальная регрессия по одному признаку (виджет «Обучение и тест» курса «Основы ML»): признак масштабируется
// на [−1, 1], веса — нормальные уравнения с крошечным гребневым штрафом (без него степень 12 на 20 точках вырождена).
import { gauss } from "./correlation";
import type { Rng } from "./rng";

export type Pt = readonly [number, number];

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i]![c]!) > Math.abs(M[p]![c]!)) p = i;
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let i = c + 1; i < n; i++) {
      const k = M[i]![c]! / M[c]![c]!;
      for (let j = c; j <= n; j++) M[i]![j]! -= k * M[c]![j]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i]![n]!;
    for (let j = i + 1; j < n; j++) s -= M[i]![j]! * x[j]!;
    x[i] = s / M[i]![i]!;
  }
  return x;
}

/** Коэффициенты полинома степени d по точкам с x ∈ [−1, 1]. */
export function polyFit(pts: readonly Pt[], d: number, lambda = 1e-10): number[] {
  const A = Array.from({ length: d + 1 }, (_, i) => Array.from({ length: d + 1 }, (_, j) => pts.reduce((s, [x]) => s + x ** (i + j), 0) + (i === j ? lambda : 0)));
  const b = Array.from({ length: d + 1 }, (_, i) => pts.reduce((s, [x, y]) => s + x ** i * y, 0));
  return solve(A, b);
}

export const polyEval = (theta: readonly number[], x: number) => theta.reduceRight((s, t) => s * x + t, 0);
export const rmse = (theta: readonly number[], pts: readonly Pt[]) => Math.sqrt(pts.reduce((s, [x, y]) => s + (polyEval(theta, x) - y) ** 2, 0) / pts.length);

/** «Квартиры» для виджета: площадь 25–120 м² → x ∈ [−1, 1], цена ≈ 1.5 + 0.11 · площадь + шум 0.8, как в mlf.datasets. */
export function apartmentPoints(r: Rng, n: number): Pt[] {
  return Array.from({ length: n }, () => {
    const area = 25 + 95 * r.next();
    return [(area - 72.5) / 47.5, 1.5 + 0.11 * area + 0.8 * gauss(r)] as const;
  });
}

export const toArea = (x: number) => 72.5 + 47.5 * x;
