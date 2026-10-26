// Виджет «Перетащи выброс» (урок IV.1): описательные статистики выборки — среднее, медиана, выборочное стандартное
// отклонение, квантили (линейная интерполяция, как np.quantile по умолчанию) и межквартильный размах. Без DOM.

/** Цены одиннадцати квартир, млн ₽, — неподвижная часть выборки; двенадцатую двигает ученик. */
export const BASE: readonly number[] = [6.2, 7.1, 7.8, 8.4, 8.9, 9.3, 9.8, 10.5, 11.2, 12.6, 14.0];

export const mean = (x: readonly number[]) => x.reduce((a, b) => a + b, 0) / x.length;

/** Квантиль уровня q ∈ [0, 1]: позиция q(n − 1) в отсортированной выборке, между соседями — линейно. */
export function quantile(x: readonly number[], q: number): number {
  const s = [...x].sort((a, b) => a - b);
  const pos = q * (s.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo]! + (pos - lo) * (s[hi]! - s[lo]!);
}

export const median = (x: readonly number[]) => quantile(x, 0.5);

/** Выборочное стандартное отклонение: деление на n − ddof (по умолчанию n − 1). */
export function std(x: readonly number[], ddof = 1): number {
  const m = mean(x);
  return Math.sqrt(x.reduce((a, v) => a + (v - m) ** 2, 0) / (x.length - ddof));
}

export const iqr = (x: readonly number[]) => quantile(x, 0.75) - quantile(x, 0.25);
