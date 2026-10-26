// Виджет «Хорда над графиком» (урок II.5): выпуклость по определению — хорда между (a, f(a)) и (b, f(b))
// не ниже графика. Модель без DOM: функции-заготовки, точка хорды при параметре t, зазор «хорда − график».
export type FnId = "square" | "quartic" | "softplus" | "cubic" | "well";

export interface Fn {
  id: FnId;
  /** Подпись для описания и кнопки. */
  name: string;
  f: (x: number) => number;
  /** Вторая производная — критерий второго порядка. */
  d2: (x: number) => number;
  x: readonly [number, number];
  y: readonly [number, number];
  /** Концы хорды при выборе функции. */
  init: readonly [number, number];
  convex: boolean;
}

const softplus = (x: number) => (x > 0 ? x + Math.log1p(Math.exp(-x)) : Math.log1p(Math.exp(x)));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export const FNS: Record<FnId, Fn> = {
  square: { id: "square", name: "x²", f: (x) => x * x, d2: () => 2, x: [-2, 2], y: [-1, 4], init: [-1.5, 1], convex: true },
  quartic: { id: "quartic", name: "x⁴", f: (x) => x ** 4, d2: (x) => 12 * x * x, x: [-1.5, 1.5], y: [-1, 5], init: [-1, 1.2], convex: true },
  // потеря логистической регрессии при y = 0 как функция z = θᵀx: −log(1 − g(z)) = log(1 + eᶻ)
  softplus: { id: "softplus", name: "log(1 + eᶻ)", f: softplus, d2: (x) => sigmoid(x) * (1 - sigmoid(x)), x: [-4, 4], y: [-1, 4.5], init: [-3, 3], convex: true },
  cubic: { id: "cubic", name: "x³", f: (x) => x ** 3, d2: (x) => 6 * x, x: [-1.6, 1.6], y: [-4.1, 4.1], init: [-1.5, 0.5], convex: false },
  // двойная яма с наклоном: локальный минимум справа выше глобального слева
  well: { id: "well", name: "(x² − 1)² + 0.3x", f: (x) => (x * x - 1) ** 2 + 0.3 * x, d2: (x) => 12 * x * x - 4, x: [-1.6, 1.6], y: [-0.6, 3], init: [-1, 1], convex: false },
};

export const FN_IDS = Object.keys(FNS) as FnId[];

/** Точка аргумента при параметре t: t·a + (1 − t)·b, как в определении f(tx + (1 − t)y) ≤ t f(x) + (1 − t) f(y). */
export const mix = (a: number, b: number, t: number) => t * a + (1 - t) * b;

/** Значение хорды над точкой mix(a, b, t). */
export const chord = (fn: Fn, a: number, b: number, t: number) => t * fn.f(a) + (1 - t) * fn.f(b);

/** Зазор «хорда − график»: у выпуклой функции не меньше нуля при любых a, b и t ∈ [0, 1]. */
export const gap = (fn: Fn, a: number, b: number, t: number) => chord(fn, a, b, t) - fn.f(mix(a, b, t));

/** Наименьший зазор вдоль хорды (перебор t): отрицательный — хорда где-то проходит под графиком. */
export function minGap(fn: Fn, a: number, b: number, m = 200): { t: number; gap: number } {
  let best = { t: 0, gap: 0 };
  for (let i = 0; i <= m; i++) {
    const t = i / m;
    const g = gap(fn, a, b, t);
    if (g < best.gap) best = { t, gap: g };
  }
  return best;
}

/** Точки графика: ломаная из m отрезков. */
export function curve(fn: Fn, m = 160): [number, number][] {
  const [x0, x1] = fn.x;
  return Array.from({ length: m + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / m;
    return [x, fn.f(x)];
  });
}
