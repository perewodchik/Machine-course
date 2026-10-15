// Модель виджета «Подгонка прямой»: МНК для ŷ = θ₀ + θ₁x, функция потерь J(θ) = ½‖Xθ − y‖², остатки.
// Чистые функции: те же числа считает code/snippets/la/normal_equations.py (тест — model.test.ts).
import data from "./data.json";

export interface Theta {
  t0: number;
  t1: number;
}

export const DATA: { x: readonly number[]; y: readonly number[] } = data;

/** Решение нормальных уравнений XᵀXθ = Xᵀy для X = [1, x] (система 2 × 2 по формуле Крамера). */
export function leastSquares(xs: readonly number[], ys: readonly number[]): Theta {
  const n = xs.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i]!;
    sy += ys[i]!;
    sxx += xs[i]! * xs[i]!;
    sxy += xs[i]! * ys[i]!;
  }
  const det = n * sxx - sx * sx;
  if (Math.abs(det) < 1e-12) throw new Error("все x одинаковы: столбцы X линейно зависимы, решение не единственно");
  return { t0: (sxx * sy - sx * sxy) / det, t1: (n * sxy - sx * sy) / det };
}

/** Остатки εᵢ = yᵢ − ŷᵢ. */
export function residuals({ t0, t1 }: Theta, xs: readonly number[], ys: readonly number[]): number[] {
  return xs.map((x, i) => ys[i]! - (t0 + t1 * x));
}

/** J(θ) = ½ Σ εᵢ². */
export function loss(theta: Theta, xs: readonly number[], ys: readonly number[]): number {
  return 0.5 * residuals(theta, xs, ys).reduce((a, r) => a + r * r, 0);
}

/** ∇J(θ) = Xᵀ(Xθ − y): в минимуме ноль. */
export function gradient(theta: Theta, xs: readonly number[], ys: readonly number[]): Theta {
  const r = residuals(theta, xs, ys);
  return { t0: -r.reduce((a, v) => a + v, 0), t1: -r.reduce((a, v, i) => a + v * xs[i]!, 0) };
}

/** Промежуточное θ при анимации к минимуму: k ∈ [0, 1], замедление к концу. */
export function towards(from: Theta, to: Theta, k: number): Theta {
  const e = 1 - (1 - Math.min(1, Math.max(0, k))) ** 3;
  return { t0: from.t0 + (to.t0 - from.t0) * e, t1: from.t1 + (to.t1 - from.t1) * e };
}
