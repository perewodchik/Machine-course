// Виджеты урока III.8 «Бегущее среднее» и «Гистограмма суммы»: выборки из четырёх базовых распределений
// с seed, бегущее среднее (закон больших чисел) и гистограмма стандартизованной суммы n величин
// (центральная предельная теорема). Модель без DOM; случайность — только через rng(seed).
import { rng, type Rng } from "../../../lib/math/rng";

export type BaseId = "uniform" | "exponential" | "bernoulli" | "dice";

export interface Base {
  name: string;
  mean: number;
  variance: number;
  draw: (r: Rng) => number;
}

export const BASES: Record<BaseId, Base> = {
  uniform: { name: "равномерное [0, 1]", mean: 0.5, variance: 1 / 12, draw: (r) => r.next() },
  exponential: { name: "показательное, λ = 1", mean: 1, variance: 1, draw: (r) => -Math.log(1 - r.next()) },
  bernoulli: { name: "Бернулли, φ = 0.2", mean: 0.2, variance: 0.16, draw: (r) => (r.next() < 0.2 ? 1 : 0) },
  dice: { name: "кубик", mean: 3.5, variance: 35 / 12, draw: (r) => r.int(1, 6) },
};

/** Бегущие средние m_k = (x_1 + … + x_k)/k, k = 1, …, n. */
export function runningMeans(id: BaseId, n: number, seed: number): number[] {
  const r = rng(seed);
  const out: number[] = [];
  let s = 0;
  for (let k = 1; k <= n; k++) {
    s += BASES[id].draw(r);
    out.push(s / k);
  }
  return out;
}

/** Стандартизованные суммы Z = (S_n − nμ)/(σ√n) в reps повторах. */
export function standardizedSums(id: BaseId, n: number, reps: number, seed: number): number[] {
  const r = rng(seed);
  const { mean, variance, draw } = BASES[id];
  const scale = Math.sqrt(n * variance);
  return Array.from({ length: reps }, () => {
    let s = 0;
    for (let i = 0; i < n; i++) s += draw(r);
    return (s - n * mean) / scale;
  });
}

export interface Bin {
  lo: number;
  hi: number;
  /** Высота-плотность: доля попаданий, делённая на ширину столбика. */
  density: number;
}

/** Гистограмма-плотность на [lo, hi] со столбиками ширины width; значения вне отрезка не рисуются, но входят в долю. */
export function histogram(values: readonly number[], lo: number, hi: number, width: number): Bin[] {
  const k = Math.round((hi - lo) / width);
  const counts = new Array<number>(k).fill(0);
  for (const v of values) {
    const i = Math.floor((v - lo) / width);
    if (i >= 0 && i < k) counts[i]!++;
  }
  return counts.map((c, i) => ({ lo: lo + i * width, hi: lo + (i + 1) * width, density: c / (values.length * width) }));
}

/** Плотность N(0, 1). */
export const phi = (z: number) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);

/** Доля значений в [−1, 1]: у N(0, 1) около 0.683. */
export const insideOne = (values: readonly number[]) => values.filter((v) => Math.abs(v) <= 1).length / values.length;
