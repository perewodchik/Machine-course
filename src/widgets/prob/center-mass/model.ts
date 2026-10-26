// Виджет «Матожидание как центр масс» (урок III.5): дискретная величина на значениях 0–4 с весами, которые задаёт
// ученик. Матожидание — точка равновесия рычага, дисперсия — средний квадрат отклонения от неё. Для выпуклой
// f(x) = x² разрыв Йенсена E f(X) − f(E X) равен дисперсии. Модель без DOM.
export const VALUES: readonly number[] = [0, 1, 2, 3, 4];

/** Вероятности из неотрицательных весов; все нули — равномерное распределение. */
export function probs(weights: readonly number[]): number[] {
  const s = weights.reduce((a, b) => a + b, 0);
  return s > 0 ? weights.map((w) => w / s) : weights.map(() => 1 / weights.length);
}

/** E g(X) = Σ g(x) p(x) — LOTUS. */
export const expect = (p: readonly number[], g: (x: number) => number = (x) => x) => VALUES.reduce((s, x, i) => s + g(x) * p[i]!, 0);

/** Var X = E (X − E X)². */
export const variance = (p: readonly number[]) => {
  const m = expect(p);
  return expect(p, (x) => (x - m) ** 2);
};
