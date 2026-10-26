// Виджет «Плотность и CDF при перетаскивании порога» (урок III.4): сверху — функция вероятности или плотность,
// площадь слева от порога t закрашена; снизу — функция распределения F(t) = P(X ≤ t). Модель без DOM: заготовки
// распределений, F через сумму (дискретные) или интеграл Симпсона (непрерывные).
export type DistId = "binomial" | "uniform" | "exponential" | "normal";

export interface Dist {
  id: DistId;
  name: string;
  discrete: boolean;
  /** Значения дискретной величины и их вероятности. */
  support?: readonly number[];
  pmf?: (x: number) => number;
  /** Плотность непрерывной величины. */
  pdf?: (x: number) => number;
  /** Функция распределения в явном виде, если она есть (иначе — интеграл плотности). */
  F?: (x: number) => number;
  x: readonly [number, number];
  /** Верх оси плотности. */
  yMax: number;
  init: number;
}

const choose = (n: number, k: number) => {
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
};

export const DISTS: Record<DistId, Dist> = {
  // число орлов в четырёх бросках монеты
  binomial: { id: "binomial", name: "орлы в 4 бросках", discrete: true, support: [0, 1, 2, 3, 4], pmf: (k) => (Number.isInteger(k) && k >= 0 && k <= 4 ? choose(4, k) / 16 : 0), x: [-1, 5], yMax: 0.5, init: 2 },
  // равномерное на [0, 0.5]: плотность 2 > 1 — значение плотности не вероятность
  uniform: { id: "uniform", name: "равномерное на [0, 0.5]", discrete: false, pdf: (x) => (x >= 0 && x <= 0.5 ? 2 : 0), F: (x) => Math.min(1, Math.max(0, 2 * x)), x: [-0.5, 1], yMax: 2.5, init: 0.25 },
  exponential: { id: "exponential", name: "показательное, λ = 1", discrete: false, pdf: (x) => (x >= 0 ? Math.exp(-x) : 0), F: (x) => (x >= 0 ? 1 - Math.exp(-x) : 0), x: [-0.5, 5], yMax: 1.2, init: 1 },
  normal: { id: "normal", name: "нормальное N(0, 1)", discrete: false, pdf: (x) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI), x: [-4, 4], yMax: 0.5, init: 0.5 },
};

export const DIST_IDS = Object.keys(DISTS) as DistId[];

/** Составная формула Симпсона. */
export function simpson(f: (x: number) => number, a: number, b: number, n = 2000): number {
  if (b <= a) return 0;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

/** F(t) = P(X ≤ t): сумма вероятностей, явная формула или интеграл плотности (нормальное — от −8, хвост меньше 10⁻¹⁵). */
export function cdf(d: Dist, t: number): number {
  if (d.discrete) return d.support!.filter((k) => k <= t).reduce((s, k) => s + d.pmf!(k), 0);
  if (d.F) return d.F(t);
  return Math.min(1, simpson(d.pdf!, -8, t, 800));
}

/** Точки графика плотности. */
export function pdfCurve(d: Dist, m = 200): [number, number][] {
  const [a, b] = d.x;
  return Array.from({ length: m + 1 }, (_, i) => {
    const x = a + ((b - a) * i) / m;
    return [x, d.pdf!(x)];
  });
}

/** Точки графика F: у дискретных — ступеньки. */
export function cdfCurve(d: Dist, m = 200): [number, number][] {
  const [a, b] = d.x;
  return Array.from({ length: m + 1 }, (_, i) => {
    const x = a + ((b - a) * i) / m;
    return [x, cdf(d, x)];
  });
}
