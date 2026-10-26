// Виджет «Смесь двух гауссиан и ответственности» (урок III.12): плотность смеси φ N(μ₁, σ₁²) + (1 − φ) N(μ₂, σ₂²),
// взвешенные компоненты и ответственность w₁(x) = P(z = 1 | x) по формуле Байеса. Без DOM.
export interface Mix {
  phi: number;
  mu1: number;
  s1: number;
  mu2: number;
  s2: number;
}

export const normal = (x: number, mu: number, s: number) => Math.exp(-((x - mu) ** 2) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s);

/** Взвешенные компоненты φ p(x | z = 1) и (1 − φ) p(x | z = 2). */
export const parts = (m: Mix, x: number): [number, number] => [m.phi * normal(x, m.mu1, m.s1), (1 - m.phi) * normal(x, m.mu2, m.s2)];

/** Плотность смеси p(x) = Σ φ_k p(x | z = k). */
export const density = (m: Mix, x: number) => parts(m, x)[0] + parts(m, x)[1];

/** Ответственность первой компоненты через логарифмы: устойчиво и при далёких x. */
export function resp1(m: Mix, x: number): number {
  const a1 = Math.log(m.phi) - ((x - m.mu1) ** 2) / (2 * m.s1 * m.s1) - Math.log(m.s1);
  const a2 = Math.log(1 - m.phi) - ((x - m.mu2) ** 2) / (2 * m.s2 * m.s2) - Math.log(m.s2);
  const top = Math.max(a1, a2);
  return Math.exp(a1 - top) / (Math.exp(a1 - top) + Math.exp(a2 - top));
}

/** Моменты смеси: E X = Σ φ_k μ_k, Var X = Σ φ_k (σ_k² + μ_k²) − (E X)² (полное матожидание и дисперсия). */
export function mixMoments(m: Mix): { mean: number; variance: number } {
  const mean = m.phi * m.mu1 + (1 - m.phi) * m.mu2;
  const second = m.phi * (m.s1 ** 2 + m.mu1 ** 2) + (1 - m.phi) * (m.s2 ** 2 + m.mu2 ** 2);
  return { mean, variance: second - mean * mean };
}
