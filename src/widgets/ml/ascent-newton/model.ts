// Модель виджета «Подъём против Ньютона» (урок 1.4 «Основ ML»): ℓ(θ) для двух стандартизованных признаков «Квартир»
// (площадь, до метро) без свободного члена — плоскость весов (θ₁, θ₂). Площадь можно поделить на 3: Ньютон
// этого не замечает, подъём замедляется в разы. Линии уровня — поиск по лучам: ℓ вогнута, вдоль луча из максимума убывает.
import { ascentPath, meanLoglik, newtonPath, type Path } from "../../../lib/math/logistic";
import raw from "./data.json";

export type Vec2 = [number, number];

const mean = (v: readonly number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v: readonly number[]) => Math.sqrt(mean(v.map((x) => (x - mean(v)) ** 2)));
const za = raw.area.map((v) => (v - mean(raw.area)) / sd(raw.area));
const zm = raw.metro.map((v) => (v - mean(raw.metro)) / sd(raw.metro));
export const Y = raw.y;

export interface Problem {
  X: number[][];
  thetaHat: Vec2;
  ellHat: number;
  /** Шаг подъёма: половина безопасной границы 8/λ_max(XᵀX/n). */
  alpha: number;
}

export function problem(scale: number): Problem {
  const X = za.map((a, i) => [scale * a, zm[i]!]);
  const n = X.length;
  const s11 = X.reduce((s, x) => s + x[0]! * x[0]!, 0) / n;
  const s12 = X.reduce((s, x) => s + x[0]! * x[1]!, 0) / n;
  const s22 = X.reduce((s, x) => s + x[1]! * x[1]!, 0) / n;
  const lmax = (s11 + s22) / 2 + Math.hypot((s11 - s22) / 2, s12);
  const t = newtonPath(X, Y, [0, 0]).points.at(-1)!;
  return { X, thetaHat: [t[0]!, t[1]!], ellHat: meanLoglik(t, X, Y), alpha: 4 / lmax };
}

export const ell = (p: Problem, t: readonly number[]) => meanLoglik(t, p.X, Y);

export function paths(p: Problem, start: Vec2): { newton: Path; ascent: Path } {
  return { newton: newtonPath(p.X, Y, start), ascent: ascentPath(p.X, Y, start, p.alpha, 1e-6, 20_000) };
}

/** Линия уровня ℓ/n = level: на каждом луче из θ̂ — бисекция по радиусу. */
export function contour(p: Problem, level: number, rays = 120, rMax = 60): Vec2[] {
  const out: Vec2[] = [];
  for (let k = 0; k <= rays; k++) {
    const a = (2 * Math.PI * k) / rays;
    const u: Vec2 = [Math.cos(a), Math.sin(a)];
    const at = (r: number): Vec2 => [p.thetaHat[0] + r * u[0], p.thetaHat[1] + r * u[1]];
    if (ell(p, at(rMax)) > level) continue; // уровень на этом луче не достигается в пределах поля
    let lo = 0;
    let hi = rMax;
    for (let it = 0; it < 40; it++) {
      const mid = (lo + hi) / 2;
      if (ell(p, at(mid)) > level) lo = mid;
      else hi = mid;
    }
    out.push(at((lo + hi) / 2));
  }
  return out;
}
