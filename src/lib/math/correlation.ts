// Выборочные ковариация и корреляция и генераторы облаков точек (урок III.9, виджет «Облако точек» и игра
// «Угадай корреляцию»). Случайность — только через rng(seed): одно облако при одном seed.
import type { Rng } from "./rng";

export type Pt = readonly [number, number];

const mean = (v: readonly number[]) => v.reduce((a, b) => a + b, 0) / v.length;

/** Выборочная ковариация (1/n Σ (x − x̄)(y − ȳ)) и дисперсии. */
export function moments(pts: readonly Pt[]) {
  const mx = mean(pts.map((p) => p[0]));
  const my = mean(pts.map((p) => p[1]));
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const [x, y] of pts) {
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
    sxy += (x - mx) * (y - my);
  }
  const n = pts.length;
  return { mx, my, vx: sxx / n, vy: syy / n, cov: sxy / n };
}

/** Выборочная корреляция; 0, если одна из дисперсий нулевая. */
export function corr(pts: readonly Pt[]): number {
  const { vx, vy, cov } = moments(pts);
  return vx > 0 && vy > 0 ? cov / Math.sqrt(vx * vy) : 0;
}

/** Стандартная нормальная величина (Бокс — Мюллер). */
export function gauss(r: Rng): number {
  const u = 1 - r.next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r.next());
}

/** n точек пары (X, ρX + √(1 − ρ²) E) с независимыми стандартными X, E: корреляция ρ. */
export function linearCloud(r: Rng, rho: number, n: number): Pt[] {
  const s = Math.sqrt(1 - rho * rho);
  return Array.from({ length: n }, () => {
    const x = gauss(r);
    return [x, rho * x + s * gauss(r)] as const;
  });
}

/** Y = X² + шум при X, симметричной около нуля: Y зависит от X, а корреляция около нуля. */
export function parabolaCloud(r: Rng, n: number): Pt[] {
  return Array.from({ length: n }, () => {
    const x = -2 + 4 * r.next();
    return [x, x * x + 0.3 * gauss(r)] as const;
  });
}

/** Кольцо: точки на окружности с шумом — зависимые, некоррелированные. */
export function ringCloud(r: Rng, n: number): Pt[] {
  return Array.from({ length: n }, () => {
    const t = 2 * Math.PI * r.next();
    const rad = 2 + 0.15 * gauss(r);
    return [rad * Math.cos(t), rad * Math.sin(t)] as const;
  });
}
