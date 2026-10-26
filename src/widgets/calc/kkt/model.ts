// Виджет «Активное и неактивное ограничение» (урок II.9): минимум f(x) = ½‖x − c‖² при g(x) = aᵀx − b ≤ 0 —
// проекция c на полуплоскость. Если c допустима, ограничение неактивно и α = 0; иначе x* на границе, α > 0.
// В обоих случаях α·g(x*) = 0 — дополняющая нежёсткость. Двойственная функция d(α) = α(aᵀc − b) − ½α²‖a‖².
export type Vec = readonly [number, number];

export interface Problem {
  a: Vec;
  b: number;
}

/** Ограничение по умолчанию: x₁ + x₂ ≤ 1. */
export const PROBLEM: Problem = { a: [1, 1], b: 1 };

const dot = (u: Vec, v: Vec) => u[0] * v[0] + u[1] * v[1];

export const g = (p: Problem, x: Vec) => dot(p.a, x) - p.b;

/** Решение KKT: множитель α* = max(0, g(c)/‖a‖²) и x* = c − α*a. */
export function solve(p: Problem, c: Vec): { x: Vec; alpha: number; active: boolean } {
  const alpha = Math.max(0, g(p, c) / dot(p.a, p.a));
  return { x: [c[0] - alpha * p.a[0], c[1] - alpha * p.a[1]], alpha, active: alpha > 0 };
}

export const primal = (c: Vec, x: Vec) => 0.5 * ((x[0] - c[0]) ** 2 + (x[1] - c[1]) ** 2);

/** Двойственная функция: min по x лагранжиана ½‖x − c‖² + α g(x), достигается в x = c − αa. */
export const dual = (p: Problem, c: Vec, alpha: number) => alpha * g(p, c) - 0.5 * alpha * alpha * dot(p.a, p.a);
