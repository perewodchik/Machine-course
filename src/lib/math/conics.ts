// Коники квадратичной формы 2 × 2 (уроки I.10, II.1): собственные пары симметричной матрицы и линии уровня xᵀAx = k
// в собственных осях — эллипсы, пары прямых, ветви гиперболы. Чистая математика без DOM, общая для виджетов.
export type Vec2 = readonly [number, number];

const EPS = 1e-9;

/**
 * Собственные пары симметричной 2 × 2: λ₁ ≥ λ₂ и угол оси λ₁ (радианы). Меньшее по модулю λ — через
 * определитель, λ₁λ₂ = ac − b²: в m ± r при |λ| ≪ r теряются знаки, и полуось √(k/λ) уходит с уровня.
 */
export function eig2(a: number, b: number, c: number): { l1: number; l2: number; theta: number } {
  const m = (a + c) / 2;
  const r = Math.hypot((a - c) / 2, b);
  const det = a * c - b * b;
  const [big, small] = m >= 0 ? [m + r, m - r] : [m - r, m + r];
  const precise = big !== 0 ? det / big : small;
  // при λ₁ ≈ λ₂ деление может переставить их на последний знак — порядок λ₁ ≥ λ₂ держим явно
  const [l1, l2] = m >= 0 ? [big, Math.min(precise, big)] : [Math.max(precise, big), big];
  return { l1, l2, theta: 0.5 * Math.atan2(2 * b, a - c) };
}

export const form = (a: number, b: number, c: number, [x, y]: Vec2) => a * x * x + 2 * b * x * y + c * y * y;

/** Кривые xᵀAx = k: список ломаных в координатах плоскости. far — до какого параметра вести гиперболы и прямые. */
export function levelCurves(a: number, b: number, c: number, k: number, far = 8, n = 96): Vec2[][] {
  const { l1, l2, theta } = eig2(a, b, c);
  const [q1, q2]: [Vec2, Vec2] = [[Math.cos(theta), Math.sin(theta)], [-Math.sin(theta), Math.cos(theta)]];
  const at = (u: number, w: number): Vec2 => [u * q1[0] + w * q2[0] + 0, u * q1[1] + w * q2[1] + 0];
  const range = (lo: number, hi: number) => Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
  const z = (x: number) => Math.abs(x) < EPS;
  // эллипс: λ₁u² + λ₂w² = k, оба коэффициента одного знака с k
  if (!z(l1) && !z(l2) && Math.sign(l1) === Math.sign(l2)) {
    if (Math.sign(k) !== Math.sign(l1)) return [];
    const [ru, rw] = [Math.sqrt(k / l1), Math.sqrt(k / l2)];
    return [range(0, 2 * Math.PI).map((t) => at(ru * Math.cos(t), rw * Math.sin(t)))];
  }
  // пары прямых: одно λ ноль
  if (z(l1) !== z(l2)) {
    const [l, along] = z(l2) ? [l1, "u"] : [l2, "w"];
    if (Math.sign(k) !== Math.sign(l)) return [];
    const d = Math.sqrt(k / l);
    return [d, -d].map((s) => range(-far, far).map((t) => (along === "u" ? at(s, t) : at(t, s))));
  }
  if (z(l1) && z(l2)) return [];
  // гиперболы: l1 > 0 > l2
  const S = Math.acosh(Math.max(2, far));
  if (k > 0) {
    const [ru, rw] = [Math.sqrt(k / l1), Math.sqrt(k / -l2)];
    return [1, -1].map((s) => range(-S, S).map((t) => at(s * ru * Math.cosh(t), rw * Math.sinh(t))));
  }
  const [ru, rw] = [Math.sqrt(-k / l1), Math.sqrt(-k / -l2)];
  return [1, -1].map((s) => range(-S, S).map((t) => at(ru * Math.sinh(t), s * rw * Math.cosh(t))));
}
