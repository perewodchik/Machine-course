// Двумерное нормальное распределение N(μ, Σ) (урок III.11, виджет «Редактор μ и Σ» и игра «Скульптор Σ»):
// Σ из σ₁, σ₂, ρ, собственные числа и оси, расстояние Махаланобиса, плотность, выборка через множитель
// Холецкого, расхождение Кульбака — Лейблера между двумя гауссианами. Без DOM; случайность — через rng(seed).
import { gauss } from "./correlation";
import type { Rng } from "./rng";

export type Vec2 = readonly [number, number];
/** Симметричная 2 × 2: [Σ₁₁, Σ₁₂, Σ₂₂]. */
export type Sym2 = readonly [number, number, number];

export const sigmaOf = (s1: number, s2: number, rho: number): Sym2 => [s1 * s1, rho * s1 * s2, s2 * s2];

export const det2 = ([a, b, c]: Sym2) => a * c - b * b;

export const inv2 = (S: Sym2): Sym2 => {
  const d = det2(S);
  return [S[2] / d, -S[1] / d, S[0] / d];
};

/** Собственные числа λ₁ ≥ λ₂ и единичный собственный вектор при λ₁. */
export function eig2([a, b, c]: Sym2): { l1: number; l2: number; u: Vec2 } {
  const m = (a + c) / 2;
  const r = Math.hypot((a - c) / 2, b);
  const l1 = m + r;
  // (Σ − λ₁I)u = 0 даёт два кандидата: (λ₁ − c, b) и (b, λ₁ − a). Берём более длинный — у короткого при малом b
  // координаты почти нули, и вычитание теряет точность.
  const p: Vec2 = [l1 - c, b];
  const q: Vec2 = [b, l1 - a];
  const w = Math.hypot(...p) >= Math.hypot(...q) ? p : q;
  const len = Math.hypot(...w);
  const u: Vec2 = len < 1e-15 ? [1, 0] : [w[0] / len, w[1] / len];
  return { l1, l2: m - r, u };
}

/** Квадрат расстояния Махаланобиса (x − μ)ᵀ Σ⁻¹ (x − μ). */
export function mahalanobis2(x: Vec2, mu: Vec2, S: Sym2): number {
  const [p, q, r] = inv2(S);
  const dx = x[0] - mu[0];
  const dy = x[1] - mu[1];
  return p * dx * dx + 2 * q * dx * dy + r * dy * dy;
}

export const pdf2 = (x: Vec2, mu: Vec2, S: Sym2) => Math.exp(-mahalanobis2(x, mu, S) / 2) / (2 * Math.PI * Math.sqrt(det2(S)));

/** n точек N(μ, Σ): x = μ + L z, L — нижнетреугольный множитель Холецкого, Σ = L Lᵀ. */
export function sample2(r: Rng, mu: Vec2, [a, b, c]: Sym2, n: number): Vec2[] {
  const l11 = Math.sqrt(a);
  const l21 = b / l11;
  const l22 = Math.sqrt(c - l21 * l21);
  return Array.from({ length: n }, () => {
    const z1 = gauss(r);
    const z2 = gauss(r);
    return [mu[0] + l11 * z1, mu[1] + l21 * z1 + l22 * z2] as const;
  });
}

/** Выборочные среднее и ковариация (деление на n — оценка максимального правдоподобия). */
export function fit2(pts: readonly Vec2[]): { mu: Vec2; S: Sym2 } {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p[0], 0) / n;
  const my = pts.reduce((s, p) => s + p[1], 0) / n;
  let a = 0;
  let b = 0;
  let c = 0;
  for (const [x, y] of pts) {
    a += (x - mx) ** 2;
    b += (x - mx) * (y - my);
    c += (y - my) ** 2;
  }
  return { mu: [mx, my], S: [a / n, b / n, c / n] };
}

/** KL(N(μ₀, Σ₀) ‖ N(μ₁, Σ₁)) = ½ [tr(Σ₁⁻¹Σ₀) + (μ₁ − μ₀)ᵀΣ₁⁻¹(μ₁ − μ₀) − 2 + ln(det Σ₁ / det Σ₀)]. */
export function kl2(mu0: Vec2, S0: Sym2, mu1: Vec2, S1: Sym2): number {
  const [p, q, r] = inv2(S1);
  const tr = p * S0[0] + 2 * q * S0[1] + r * S0[2];
  return 0.5 * (tr + mahalanobis2(mu0, mu1, S1) - 2 + Math.log(det2(S1) / det2(S0)));
}
