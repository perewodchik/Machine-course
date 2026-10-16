// Виджет «Проекция y на плоскость столбцов» (урок I.8): в ℝ³ плоскость — оболочка двух столбцов X, точка y,
// её проекция ŷ = X(XᵀX)⁻¹Xᵀy и остаток y − ŷ, перпендикулярный плоскости. Сцена рисуется ортографической
// проекцией на экран: камера поворачивается вокруг вертикальной оси. Модель без DOM.
export type Vec3 = readonly [number, number, number];
export type Vec2 = readonly [number, number];

/** Столбцы X: наклонная плоскость через ноль. */
export const A: Vec3 = [1, 0, 0.5];
export const B: Vec3 = [0, 1, 0.5];

const dot = (u: Vec3, v: Vec3) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const comb = (s: number, u: Vec3, t: number, v: Vec3): Vec3 => [s * u[0] + t * v[0] + 0, s * u[1] + t * v[1] + 0, s * u[2] + t * v[2] + 0];
export const sub = (u: Vec3, v: Vec3): Vec3 => [u[0] - v[0] + 0, u[1] - v[1] + 0, u[2] - v[2] + 0];
export const norm = (u: Vec3) => Math.sqrt(dot(u, u));

/** Коэффициенты проекции θ̂ = (XᵀX)⁻¹Xᵀy для X = [a b] — нормальные уравнения 2 × 2. */
export function coefs(y: Vec3, a: Vec3 = A, b: Vec3 = B): Vec2 {
  const [aa, ab, bb] = [dot(a, a), dot(a, b), dot(b, b)];
  const [ay, by] = [dot(a, y), dot(b, y)];
  const det = aa * bb - ab * ab;
  return [(bb * ay - ab * by) / det, (aa * by - ab * ay) / det];
}

export function project(y: Vec3, a: Vec3 = A, b: Vec3 = B): { theta: Vec2; yhat: Vec3; resid: Vec3 } {
  const theta = coefs(y, a, b);
  const yhat = comb(theta[0], a, theta[1], b);
  return { theta, yhat, resid: sub(y, yhat) };
}

/** Xᵀ(y − ŷ): скалярные произведения остатка со столбцами — оба нули. */
export const residDots = (resid: Vec3, a: Vec3 = A, b: Vec3 = B): Vec2 => [dot(a, resid) + 0, dot(b, resid) + 0];

/** Ортографическая камера: поворот на азимут (градусы) вокруг оси z, наклон elev (градусы) к горизонту. */
export function camera(azimuth: number, elev = 22) {
  const [fa, fe] = [(azimuth * Math.PI) / 180, (elev * Math.PI) / 180];
  return ([x, y, z]: Vec3): Vec2 => {
    const xr = x * Math.cos(fa) - y * Math.sin(fa);
    const yr = x * Math.sin(fa) + y * Math.cos(fa);
    return [xr + 0, z * Math.cos(fe) + yr * Math.sin(fe) + 0];
  };
}

/** Угол плоскости: параллелограмм ±s·a ± s·b. */
export const patch = (s: number, a: Vec3 = A, b: Vec3 = B): Vec3[] => [comb(s, a, s, b), comb(-s, a, s, b), comb(-s, a, -s, b), comb(s, a, -s, b)];
