// Виджет «Линейное преобразование облака» (урок III.10): облако X ~ N(0, I) из 300 точек, Y = AX + b.
// Ковариация Y по формуле — AAᵀ, выборочная — по точкам; плотность Y в точке b делится на |det A|. Без DOM.
import { gauss } from "../../../lib/math/correlation";
import { rng } from "../../../lib/math/rng";

export type Mat2 = readonly [readonly [number, number], readonly [number, number]];
export type Vec2 = readonly [number, number];

export const N = 300;

/** Стандартное нормальное облако с фиксированным seed. */
export const baseCloud = (seed = 3): Vec2[] => {
  const r = rng(seed);
  return Array.from({ length: N }, () => [gauss(r), gauss(r)] as const);
};

export const apply = (A: Mat2, b: Vec2, [x, y]: Vec2): Vec2 => [A[0][0] * x + A[0][1] * y + b[0], A[1][0] * x + A[1][1] * y + b[1]];

export const mul = (A: Mat2, B: Mat2): Mat2 => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];

export const transpose = (A: Mat2): Mat2 => [
  [A[0][0], A[1][0]],
  [A[0][1], A[1][1]],
];

export const det = (A: Mat2) => A[0][0] * A[1][1] - A[0][1] * A[1][0];

/** Cov(AX + b) = A Σ Aᵀ. */
export const covLinear = (A: Mat2, S: Mat2): Mat2 => mul(mul(A, S), transpose(A));

/** Выборочная ковариация (деление на n). */
export function sampleCov(pts: readonly Vec2[]): Mat2 {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let a = 0;
  let b = 0;
  let c = 0;
  for (const [x, y] of pts) {
    a += (x - mx) ** 2;
    b += (x - mx) * (y - my);
    c += (y - my) ** 2;
  }
  return [
    [a / n, b / n],
    [b / n, c / n],
  ];
}

export const PRESETS: Record<string, Mat2> = {
  растяжение: [
    [2, 0],
    [0, 0.5],
  ],
  поворот: [
    [0.7, -0.7],
    [0.7, 0.7],
  ],
  сдвиг: [
    [1, 1],
    [0, 1],
  ],
  вырожденная: [
    [1, 0.5],
    [1, 0.5],
  ],
};
