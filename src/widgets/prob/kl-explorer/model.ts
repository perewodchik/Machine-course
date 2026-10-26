// Виджет «KL между двумя распределениями» (урок III.13): энтропия, кросс-энтропия и KL-дивергенция двух
// распределений на четырёх исходах, в натах (натуральный логарифм, как в CS229). 0 · log 0 = 0; если q(x) = 0
// там, где p(x) > 0, кросс-энтропия и KL бесконечны. Без DOM.
export const OUTCOMES = ["0", "1", "2", "3"] as const;

/** Вероятности из неотрицательных весов; все нули — равномерное. */
export function probs(w: readonly number[]): number[] {
  const s = w.reduce((a, b) => a + b, 0);
  return s > 0 ? w.map((v) => v / s) : w.map(() => 1 / w.length);
}

/** H(p) = −Σ p log p. */
export const entropy = (p: readonly number[]) => -p.reduce((s, v) => s + (v > 0 ? v * Math.log(v) : 0), 0);

/** H(p, q) = −Σ p log q; ∞, если q = 0 там, где p > 0. */
export const crossEntropy = (p: readonly number[], q: readonly number[]) =>
  -p.reduce((s, v, i) => s + (v > 0 ? v * Math.log(q[i]!) : 0), 0);

/** D_KL(p ‖ q) = Σ p log (p/q). */
export const kl = (p: readonly number[], q: readonly number[]) => p.reduce((s, v, i) => s + (v > 0 ? v * Math.log(v / q[i]!) : 0), 0);
