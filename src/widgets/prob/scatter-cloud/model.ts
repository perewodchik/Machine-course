// Модель виджета «Облако точек» (урок III.9): три формы облака из 40 точек с фиксированным seed. Без DOM.
import { gauss, linearCloud, type Pt } from "../../../lib/math/correlation";
import { rng } from "../../../lib/math/rng";

export type CloudShape = "linear" | "parabola" | "ring";

export const SHAPE_NAMES: Record<CloudShape, string> = { linear: "линейное", parabola: "парабола", ring: "кольцо" };
export const N = 40;

// Парабола и кольцо — по равномерной сетке x и углов с шумом: на 40 точках выборочная корреляция близка к нулю,
// как у распределения, а не случайно отличается от него.
export function cloud(shape: CloudShape, rho: number): Pt[] {
  const r = rng(9);
  if (shape === "parabola")
    return Array.from({ length: N }, (_, i) => {
      const x = -2 + (4 * (i + 0.5)) / N;
      return [x, x * x - 1.3 + 0.3 * gauss(r)] as const;
    });
  if (shape === "ring")
    return Array.from({ length: N }, (_, i) => {
      const t = (2 * Math.PI * i) / N;
      const rad = 2 + 0.15 * gauss(r);
      return [rad * Math.cos(t), rad * Math.sin(t)] as const;
    });
  return linearCloud(r, rho, N);
}
