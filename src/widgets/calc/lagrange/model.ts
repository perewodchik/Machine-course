// Виджет «Касание линии уровня и ограничения» (урок II.8): точка движется по ограничению h(x) = 0; в условном
// экстремуме линия уровня f касается ограничения, то есть ∇f ∥ ∇h и ∇f = λ∇h. Модель без DOM: две заготовки —
// uᵀΣu на единичной окружности (PCA) и ½(a x₁² + c x₂²) на прямой x₁ + x₂ = 1.
export type CaseId = "pca" | "line";
export type Vec = readonly [number, number];
export type Sym2 = readonly [number, number, number];

export interface Case {
  id: CaseId;
  name: string;
  /** f(x) = s · (a x₁² + 2b x₁x₂ + c x₂²): коэффициенты формы и множитель s. */
  form: Sym2;
  scale: number;
  /** Точка ограничения по параметру p (угол в градусах или t на прямой). */
  at: (p: number) => Vec;
  gradH: (x: Vec) => Vec;
  range: readonly [number, number];
  step: number;
  init: number;
  /** Параметры точек касания (эталон для тестов и подсказки). */
  touches: readonly number[];
}

const SIGMA: Sym2 = [2, 0.8, 1]; // ковариация, как у вытянутого облака точек
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Угол (в градусах, 0–180) собственного вектора симметричной 2 × 2 с наибольшим собственным значением. */
export function topAngle([a, b, c]: Sym2): number {
  const t = (Math.atan2(2 * b, a - c) / 2) * (180 / Math.PI);
  return (t + 180) % 180;
}

export const CASES: Record<CaseId, Case> = {
  pca: {
    id: "pca",
    name: "uᵀΣu на окружности",
    form: SIGMA,
    scale: 1,
    at: (p) => [Math.cos(rad(p)), Math.sin(rad(p))],
    gradH: ([x, y]) => [2 * x, 2 * y],
    range: [0, 180],
    step: 1,
    init: 140,
    touches: [topAngle(SIGMA), (topAngle(SIGMA) + 90) % 180],
  },
  line: {
    id: "line",
    name: "½(x₁² + 2x₂²) на прямой",
    form: [0.5, 0, 1],
    scale: 1,
    at: (t) => [t, 1 - t],
    gradH: () => [1, 1],
    range: [-1, 2],
    step: 0.01,
    init: 0.2,
    // минимум x₁²/2 + x₂² при x₁ + x₂ = 1: x₁ = 2x₂ ⇒ x = (2/3, 1/3)
    touches: [2 / 3],
  },
};

export const CASE_IDS = Object.keys(CASES) as CaseId[];

export const value = (c: Case, [x, y]: Vec) => {
  const [a, b, d] = c.form;
  return c.scale * (a * x * x + 2 * b * x * y + d * y * y);
};

export const gradF = (c: Case, [x, y]: Vec): Vec => {
  const [a, b, d] = c.form;
  return [2 * c.scale * (a * x + b * y), 2 * c.scale * (b * x + d * y)];
};

/** Угол между ∇f и ∇h в градусах, 0–90: 0 — параллельны (касание). */
export function angleBetween(u: Vec, v: Vec): number {
  const cos = Math.abs(u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.min(1, cos)) * 180) / Math.PI;
}

/** Множитель λ из ∇f = λ∇h — проекцией ∇f на ∇h (точный в точке касания). */
export const lambda = (gf: Vec, gh: Vec) => (gf[0] * gh[0] + gf[1] * gh[1]) / (gh[0] * gh[0] + gh[1] * gh[1]);

/** Собственные значения λ₁ ≥ λ₂. */
export function eigs([a, b, c]: Sym2): Vec {
  const m = (a + c) / 2;
  const r = Math.hypot((a - c) / 2, b);
  return [m + r, m - r];
}

/** Касание с допуском в 1°. */
export const touching = (c: Case, p: number) => angleBetween(gradF(c, c.at(p)), c.gradH(c.at(p))) < 1;
