// Модель виджета «Окружность → эллипс по шагам» (урок I.11): сингулярное разложение 2 × 2 и образы
// единичной окружности после Vᵀ, S Vᵀ и U S Vᵀ = A. Чистые функции — их проверяет model.test.ts.

export type Vec2 = readonly [number, number];
/** Матрица 2 × 2 по строкам. */
export type M2 = readonly [Vec2, Vec2];

export interface Svd2 {
  /** Левые сингулярные векторы u₁, u₂ — столбцы U. */
  u: readonly [Vec2, Vec2];
  /** σ₁ ≥ σ₂ ≥ 0. */
  s: readonly [number, number];
  /** Правые сингулярные векторы v₁, v₂ — столбцы V; V всегда поворот (det V = 1), отражение уходит в U. */
  v: readonly [Vec2, Vec2];
}

const EPS = 1e-9;

export const apply = (A: M2, x: Vec2): Vec2 => [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]];
export const det = (A: M2) => A[0][0] * A[1][1] - A[0][1] * A[1][0];

/**
 * SVD через собственное разложение AᵀA = V S² Vᵀ (урок I.11, формула 1): v₁, v₂ — оси AᵀA, σ₁ = √λ₁,
 * u₁ = A v₁ / σ₁. Второе — без деления на малое σ₂: σ₂ = |det A| / σ₁, а u₂ ⟂ u₁ — поворот u₁ на 90°,
 * со сменой знака при det A < 0 (V — поворот, значит, отражение несёт U). Так u₂ единичный и у почти вырожденной A.
 */
export function svd2(A: M2): Svd2 {
  const [[a, b], [c, d]] = A;
  const p = a * a + c * c;
  const q = a * b + c * d;
  const r = b * b + d * d;
  const theta = 0.5 * Math.atan2(2 * q, p - r);
  const v1: Vec2 = [Math.cos(theta), Math.sin(theta)];
  const v2: Vec2 = [-Math.sin(theta), Math.cos(theta)];
  const s1 = Math.sqrt((p + r) / 2 + Math.hypot((p - r) / 2, q));
  const D = det(A);
  const s2 = s1 > EPS ? Math.abs(D) / s1 : 0;
  const Av1 = apply(A, v1);
  const u1: Vec2 = s1 > EPS ? [Av1[0] / s1, Av1[1] / s1] : [1, 0];
  const sign = D < 0 ? -1 : 1;
  const u2: Vec2 = [-sign * u1[1], sign * u1[0]];
  return { u: [u1, u2], s: [s1, s2], v: [v1, v2] };
}

/** Шаги разложения: что уже применено к x. */
export const STEPS = [
  { id: 0, name: "x", tex: "x" },
  { id: 1, name: "Vᵀx", tex: "V^\\top x" },
  { id: 2, name: "SVᵀx", tex: "S V^\\top x" },
  { id: 3, name: "USVᵀx = Ax", tex: "U S V^\\top x" },
] as const;
export type Step = 0 | 1 | 2 | 3;

/** Отображение «первые step множителей справа»: I, Vᵀ, S Vᵀ, U S Vᵀ. */
export function partial(svd: Svd2, step: Step, x: Vec2): Vec2 {
  if (step === 0) return x;
  const [v1, v2] = svd.v;
  const z: Vec2 = [v1[0] * x[0] + v1[1] * x[1], v2[0] * x[0] + v2[1] * x[1]]; // Vᵀx
  if (step === 1) return z;
  const w: Vec2 = [svd.s[0] * z[0], svd.s[1] * z[1]];
  if (step === 2) return w;
  const [u1, u2] = svd.u;
  return [u1[0] * w[0] + u2[0] * w[1], u1[1] * w[0] + u2[1] * w[1]];
}

/** Образ единичной окружности после шага — замкнутая ломаная из n точек. */
export function circleImage(svd: Svd2, step: Step, n = 120): Vec2[] {
  return Array.from({ length: n + 1 }, (_, k) => partial(svd, step, [Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n)]));
}

/** Подписи образов v₁ и v₂ на каждом шаге. */
export const LABELS: Record<Step, readonly [string, string]> = {
  0: ["v_1", "v_2"],
  1: ["e_1", "e_2"],
  2: ["σ_1e_1", "σ_2e_2"],
  3: ["σ_1u_1", "σ_2u_2"],
};

/** Ориентация U: поворот или отражение — знак det U совпадает со знаком det A (V — поворот). */
export const reflects = (svd: Svd2) => svd.u[0][0] * svd.u[1][1] - svd.u[1][0] * svd.u[0][1] < 0;

export const PRESETS: readonly { id: string; name: string; A: M2 }[] = [
  { id: "shear", name: "сдвиг", A: [[1, 1], [0, 1]] },
  { id: "flip", name: "с отражением", A: [[2, 1], [1, -1]] },
  { id: "singular", name: "вырожденная", A: [[0.5, 1], [0.5, 1]] },
];
