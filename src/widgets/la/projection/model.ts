// Виджет «Проекция с подвижным углом» (урок I.2): b поворачивается вокруг начала координат, a закреплён вдоль оси x.
// Модель без DOM: скалярное произведение, косинус угла и проекция b на a.
export type Vec2 = readonly [number, number];

export const dot = (a: Vec2, b: Vec2) => a[0] * b[0] + a[1] * b[1];
export const len = (a: Vec2) => Math.hypot(a[0], a[1]);

/** b длины r под углом φ (в градусах) к оси x. */
export const polar = (r: number, deg: number): Vec2 => [r * Math.cos((deg * Math.PI) / 180) + 0, r * Math.sin((deg * Math.PI) / 180) + 0];

/** Проекция b на a: (aᵀb / aᵀa) · a. */
export function project(a: Vec2, b: Vec2): Vec2 {
  const t = dot(a, b) / dot(a, a);
  return [t * a[0] + 0, t * a[1] + 0];
}

export const cosAngle = (a: Vec2, b: Vec2) => dot(a, b) / (len(a) * len(b));
