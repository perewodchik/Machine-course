// Виджет «Касательные Ньютона» (урок II.7): метод Ньютона ищет ноль производной g = f′. Касательная к графику g
// в точке θₖ пересекает ось в θₖ₊₁ = θₖ − g(θₖ)/g′(θₖ). Модель без DOM: заготовки, итерации, касательные.
export type FnId = "logistic" | "cubic" | "arctan";

export interface Fn {
  id: FnId;
  /** Подпись кнопки и описания: что минимизируем. */
  name: string;
  /** g = f′ — функция, чей ноль ищем. */
  g: (t: number) => number;
  /** g′ = f″. */
  dg: (t: number) => number;
  /** Ноль g — минимум f (для проверки и показаний ошибки). */
  root: number;
  x: readonly [number, number];
  y: readonly [number, number];
  x0: number;
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

// логистическая регрессия с одним признаком без свободного члена: ℓ(θ) = Σ log(1 + e^{θxᵢ}) − yᵢθxᵢ
const LX = [-2, -1, -0.5, 0.5, 1, 1.5, 2, 3];
const LY = [0, 0, 1, 0, 1, 0, 1, 1];
const lg = (t: number) => LX.reduce((s, x, i) => s + (sigmoid(t * x) - LY[i]!) * x, 0);
const ldg = (t: number) => LX.reduce((s, x) => s + sigmoid(t * x) * (1 - sigmoid(t * x)) * x * x, 0);

/** Ноль g бисекцией: эталон для заготовок без формулы корня. */
export function bisect(g: (t: number) => number, a: number, b: number, iters = 200): number {
  let [lo, hi] = g(a) < 0 ? [a, b] : [b, a];
  for (let i = 0; i < iters; i++) {
    const m = (lo + hi) / 2;
    if (g(m) < 0) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export const FNS: Record<FnId, Fn> = {
  logistic: { id: "logistic", name: "логистическая потеря", g: lg, dg: ldg, root: bisect(lg, -5, 5), x: [-1, 3], y: [-8, 3], x0: 0 },
  // f = θ⁴/4 − θ² − 5θ: g = θ³ − 2θ − 5 — классический пример Ньютона, корень ≈ 2.0946
  cubic: { id: "cubic", name: "θ⁴/4 − θ² − 5θ", g: (t) => t ** 3 - 2 * t - 5, dg: (t) => 3 * t * t - 2, root: bisect((t) => t ** 3 - 2 * t - 5, 2, 3), x: [0, 4], y: [-10, 30], x0: 3.5 },
  // f = θ·arctg θ − ½ log(1 + θ²) выпукла, но Ньютон без контроля шага расходится при |θ₀| > 1.39
  arctan: { id: "arctan", name: "θ arctg θ − ½ log(1 + θ²)", g: Math.atan, dg: (t) => 1 / (1 + t * t), root: 0, x: [-4, 4], y: [-1.6, 1.6], x0: 1.2 },
};

export const FN_IDS = Object.keys(FNS) as FnId[];

/** θ₀, θ₁, …, θₖ — итерации Ньютона; останавливаемся, если g′ = 0 или θ ушло за 10⁶. */
export function newtonPath(fn: Fn, x0: number, k: number): number[] {
  const out = [x0];
  for (let i = 0; i < k; i++) {
    const t = out[out.length - 1]!;
    const d = fn.dg(t);
    if (d === 0 || !Number.isFinite(t) || Math.abs(t) > 1e6) break;
    out.push(t - fn.g(t) / d);
  }
  return out;
}

/** Число верных знаков после запятой: −log₁₀ |θ − θ*|, не больше 15. */
export const digits = (fn: Fn, t: number) => Math.min(15, Math.max(0, Math.floor(-Math.log10(Math.abs(t - fn.root) || 1e-16))));

/** Точки графика g. */
export function curve(fn: Fn, m = 200): [number, number][] {
  const [a, b] = fn.x;
  return Array.from({ length: m + 1 }, (_, i) => {
    const t = a + ((b - a) * i) / m;
    return [t, fn.g(t)];
  });
}
