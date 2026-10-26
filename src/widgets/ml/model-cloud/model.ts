// Модель виджета «Облако моделей» (урок 2.2 «Основ ML»): истина h*(x) = sin 2.5x + 0.3x на [−1, 1], y = h* + ε,
// ε ~ N(0, σ²). B = 100 выборок по n точек, на каждой — полином степени k по МНК; облако моделей, средняя модель h̄,
// смещение² и разброс на сетке, значения ĥ_S(x₀) в выбранной точке и ожидаемая ошибка σ² + смещение² + разброс по степени.
import { gauss } from "../../../lib/math/correlation";
import { polyEval, polyFitMoments as polyFit } from "../../../lib/math/poly";
import { rng } from "../../../lib/math/rng";

export const hStar = (x: number) => Math.sin(2.5 * x) + 0.3 * x;
export const GRID = Array.from({ length: 81 }, (_, i) => -1 + i / 40);
export const B = 100;
export const DEGREES = 12;

export interface Cloud {
  /** B полиномов: коэффициенты. */
  models: number[][];
  /** Средняя модель на сетке. */
  mean: number[];
  bias2: number;
  variance: number;
}

/** Облако из B моделей степени k на B выборках по n точек (seed задаёт выборки, одинаковые для всех степеней). */
export function cloud(k: number, n: number, sigma: number, seed = 1): Cloud {
  const r = rng(seed);
  const models: number[][] = [];
  for (let b = 0; b < B; b++) {
    const pts = Array.from({ length: n }, () => {
      const x = -1 + 2 * r.next();
      return [x, hStar(x) + sigma * gauss(r)] as const;
    });
    models.push(polyFit(pts, k));
  }
  const preds = GRID.map((x) => models.map((m) => polyEval(m, x)));
  const mean = preds.map((v) => v.reduce((a, b) => a + b, 0) / B);
  const bias2 = GRID.reduce((a, x, i) => a + (mean[i]! - hStar(x)) ** 2, 0) / GRID.length;
  const variance = preds.reduce((a, v, i) => a + v.reduce((s, p) => s + (p - mean[i]!) ** 2, 0) / B, 0) / GRID.length;
  return { models, mean, bias2, variance };
}

/** Значения ĥ_S(x₀) по всем моделям облака. */
export const atPoint = (c: Cloud, x0: number) => c.models.map((m) => polyEval(m, x0));

/** Ожидаемая ошибка на свежих данных по степеням 0…12: σ² + смещение² + разброс. */
export function errorByDegree(n: number, sigma: number, seed = 1): { k: number; bias2: number; variance: number; total: number }[] {
  return Array.from({ length: DEGREES + 1 }, (_, k) => {
    const c = cloud(k, n, sigma, seed);
    return { k, bias2: c.bias2, variance: c.variance, total: sigma * sigma + c.bias2 + c.variance };
  });
}
