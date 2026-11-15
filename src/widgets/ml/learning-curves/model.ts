// Модель виджета «Кривые обучения» (урок 2.5 «Основ ML»): истина h*(x) = sin 2.5x + 0.3x на [−1, 1], шум σ = 0.3,
// полином степени k со штрафом λ. Для каждого размера обучающей выборки n — 20 повторов: средние и разброс MSE на
// обучении и на 400 фиксированных свежих точках. Диагноз — по разрыву кривых и уровню валидационной ошибки.
import { gauss } from "../../../lib/math/correlation";
import { polyEval, polyFitMoments } from "../../../lib/math/poly";
import { rng } from "../../../lib/math/rng";

export const SIGMA = 0.3;
export const TARGET = 0.11; // цель: чуть выше неустранимой ошибки σ² = 0.09
export const REPEATS = 20;
const hStar = (x: number) => Math.sin(2.5 * x) + 0.3 * x;

const fresh = (() => {
  const r = rng(999);
  return Array.from({ length: 400 }, () => {
    const x = -1 + 2 * r.next();
    return [x, hStar(x) + SIGMA * gauss(r)] as const;
  });
})();

export interface CurvePoint {
  n: number;
  train: number;
  val: number;
  trainLo: number;
  trainHi: number;
  valLo: number;
  valHi: number;
}

export const sizes = (maxN: number) => Array.from({ length: 30 }, (_, i) => Math.round(10 * (maxN / 10) ** (i / 29))).filter((v, i, a) => a.indexOf(v) === i);

const mse = (theta: number[], pts: readonly (readonly [number, number])[]) => pts.reduce((s, [x, y]) => s + (polyEval(theta, x) - y) ** 2, 0) / pts.length;
const quant = (v: number[], q: number) => [...v].sort((a, b) => a - b)[Math.min(v.length - 1, Math.floor(q * v.length))]!;

export function curves(k: number, lam: number, maxN: number, seed = 1): CurvePoint[] {
  const r = rng(seed);
  return sizes(maxN).map((n) => {
    const tr: number[] = [];
    const va: number[] = [];
    for (let rep = 0; rep < REPEATS; rep++) {
      const pts = Array.from({ length: n }, () => {
        const x = -1 + 2 * r.next();
        return [x, hStar(x) + SIGMA * gauss(r)] as const;
      });
      const theta = polyFitMoments(pts, k, lam * n + 1e-10);
      tr.push(mse(theta, pts));
      va.push(mse(theta, fresh));
    }
    const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
    return { n, train: mean(tr), val: mean(va), trainLo: quant(tr, 0.1), trainHi: quant(tr, 0.9), valLo: quant(va, 0.1), valHi: quant(va, 0.9) };
  });
}

export type Diagnosis = "bias" | "variance" | "ok";

/** Диагноз по последней точке: цель достигнута — всё в порядке; разрыв больше половины избытка над σ² — разброс. */
export function diagnose(c: readonly CurvePoint[]): Diagnosis {
  const last = c.at(-1)!;
  if (last.val <= TARGET) return "ok";
  const gap = last.val - last.train;
  return gap > 0.5 * (last.val - SIGMA * SIGMA) ? "variance" : "bias";
}
