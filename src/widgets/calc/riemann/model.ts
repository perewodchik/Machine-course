// Виджет «Сумма прямоугольников → площадь» (урок 0.7): интеграл как предел сумм площадей прямоугольников.
// Модель без DOM: функции-заготовки, суммы по левым, средним и правым точкам, точное значение интеграла.
export type Rule = "left" | "mid" | "right";
export type FnId = "square" | "exp" | "gauss";

export interface Fn {
  id: FnId;
  /** Подпись для описания: «x²». */
  name: string;
  /** Та же подпись для кнопки: основание и показатель степени. */
  label: readonly [string, string];
  f: (x: number) => number;
  a: number;
  b: number;
  /** Верх оси y. */
  yMax: number;
  /** Точное значение ∫ₐᵇ f(x) dx. */
  exact: number;
}

/** Составная формула Симпсона: эталон для функций без элементарной первообразной (e^{−x²/2}). */
export function simpson(f: (x: number) => number, a: number, b: number, n = 2000): number {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

const gauss = (x: number) => Math.exp((-x * x) / 2);

export const FNS: Record<FnId, Fn> = {
  square: { id: "square", name: "x²", label: ["x", "2"], f: (x) => x * x, a: 0, b: 2, yMax: 4, exact: 8 / 3 },
  exp: { id: "exp", name: "e^(−x)", label: ["e", "−x"], f: (x) => Math.exp(-x), a: 0, b: 3, yMax: 1.2, exact: 1 - Math.exp(-3) },
  gauss: { id: "gauss", name: "e^(−x²/2)", label: ["e", "−x²/2"], f: gauss, a: -4, b: 4, yMax: 1.2, exact: simpson(gauss, -4, 4) },
};

export const RULE_NAMES: Record<Rule, string> = { left: "левые", mid: "средние", right: "правые" };

export interface Rect {
  x0: number;
  x1: number;
  h: number;
}

/** n прямоугольников равной ширины; высота — значение f в левой, средней или правой точке. */
export function rects(fn: Fn, n: number, rule: Rule): Rect[] {
  const w = (fn.b - fn.a) / n;
  const at = { left: 0, mid: 0.5, right: 1 }[rule];
  return Array.from({ length: n }, (_, i) => {
    const x0 = fn.a + i * w;
    return { x0, x1: x0 + w, h: fn.f(x0 + at * w) };
  });
}

export const riemann = (fn: Fn, n: number, rule: Rule) => rects(fn, n, rule).reduce((s, r) => s + (r.x1 - r.x0) * r.h, 0);

/** Точки графика функции: ломаная из m отрезков. */
export function curve(fn: Fn, m = 120): [number, number][] {
  return Array.from({ length: m + 1 }, (_, i) => {
    const x = fn.a + ((fn.b - fn.a) * i) / m;
    return [x, fn.f(x)];
  });
}
