// Модель виджета «Поле градиентов над линиями уровня» (урок II.1): f(x) = ½ xᵀAx для симметричной
// A = [[a, b], [b, c]], её градиент ∇f = Ax, производная по направлению D_u f = ∇fᵀu и линия уровня через точку.
// Линии уровня — те же кривые, что в уроке I.10 (lib/math/conics.ts): ½ xᵀAx = k ⇔ xᵀAx = 2k.
import { form, levelCurves, type Vec2 } from "../../../lib/math/conics";

export type { Vec2 };
export type Abc = readonly [number, number, number];

export const f = ([a, b, c]: Abc, x: Vec2) => 0.5 * form(a, b, c, x);
export const grad = ([a, b, c]: Abc, [x, y]: Vec2): Vec2 => [a * x + b * y + 0, b * x + c * y + 0];
export const unit = (phi: number): Vec2 => [Math.cos(phi), Math.sin(phi)];
export const directional = (abc: Abc, x: Vec2, phi: number) => {
  const g = grad(abc, x);
  const u = unit(phi);
  return g[0] * u[0] + g[1] * u[1];
};
export const norm = ([x, y]: Vec2) => Math.hypot(x, y);

/** Линия уровня f = f(x₀) — ломаные (эллипс, пара прямых или ветви гиперболы). */
export const contourThrough = ([a, b, c]: Abc, x0: Vec2, far = 6) => levelCurves(a, b, c, 2 * f([a, b, c], x0), far, 120);

/** Ещё несколько уровней вокруг: k = ±0.5, ±2 (отрицательные есть только у седла). */
export const backgroundLevels = ([a, b, c]: Abc, far = 6) => [0.5, 2, -0.5, -2].flatMap((k) => levelCurves(a, b, c, 2 * k, far, 96).map((pts) => ({ k, pts })));

/**
 * Стрелки поля на сетке шага step: направление ∇f, длина растёт с |∇f|, но не больше 0.8 шага,
 * чтобы стрелки не налезали друг на друга. Нулевой градиент — без стрелки.
 */
export function arrows(abc: Abc, range: number, step: number): { from: Vec2; to: Vec2 }[] {
  const out: { from: Vec2; to: Vec2 }[] = [];
  const n = Math.floor(range / step);
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const p: Vec2 = [i * step, j * step];
      const g = grad(abc, p);
      const len = norm(g);
      if (len < 1e-9) continue;
      const s = (Math.min(len, 2) / 2) * 0.8 * step;
      out.push({ from: p, to: [p[0] + (g[0] / len) * s, p[1] + (g[1] / len) * s] });
    }
  return out;
}

export const PRESETS: readonly { id: string; name: string; abc: Abc }[] = [
  { id: "bowl", name: "чаша", abc: [1, 0, 1] },
  { id: "long", name: "вытянутая чаша", abc: [2, 0.6, 0.5] },
  { id: "saddle", name: "седло", abc: [1, 0, -1] },
];
