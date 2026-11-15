// Модель виджета «Порог: кривые и цена» (урок 2.1 «Основ ML»): два гауссовых класса признака z — N(±d/2, 1), доля
// положительных φ. Оценка — апостериорная вероятность g(d·z + log(φ/(1 − φ))), то есть откалибрована по построению
// (урок III.3); «исказить» возводит её в куб. Метрики — src/lib/math/classification.ts.
import { aucRanks, averagePrecision, brier, confusion, prPoints, reliability, rocPoints, totalCost } from "../../../lib/math/classification";
import { gauss } from "../../../lib/math/correlation";
import { rng } from "../../../lib/math/rng";

export interface Sample {
  s: number[];
  y: number[];
}

export function sample(seed: number, d: number, phi: number, distort: boolean, n = 2000): Sample {
  const r = rng(seed);
  const s: number[] = [];
  const y: number[] = [];
  const prior = Math.log(phi / (1 - phi));
  for (let i = 0; i < n; i++) {
    const yi = r.next() < phi ? 1 : 0;
    const z = (yi ? d / 2 : -d / 2) + gauss(r);
    const p = 1 / (1 + Math.exp(-(d * z + prior)));
    s.push(distort ? p ** 3 : p);
    y.push(yi);
  }
  return { s, y };
}

/** Гистограммы оценок по классам: доли объектов класса в каждой из bins корзин [0, 1]. */
export function histograms(x: Sample, bins = 25): { pos: number[]; neg: number[] } {
  const pos = new Array<number>(bins).fill(0);
  const neg = new Array<number>(bins).fill(0);
  x.s.forEach((v, i) => {
    const b = Math.min(bins - 1, Math.floor(v * bins));
    if (x.y[i]) pos[b]!++;
    else neg[b]!++;
  });
  const np = Math.max(1, pos.reduce((a, b) => a + b, 0));
  const nn = Math.max(1, neg.reduce((a, b) => a + b, 0));
  return { pos: pos.map((v) => v / np), neg: neg.map((v) => v / nn) };
}

export const T_GRID = Array.from({ length: 201 }, (_, k) => k / 200);

export function summary(x: Sample, cFp: number, cFn: number) {
  const costs = T_GRID.map((t) => totalCost(x.s, x.y, t, cFp, cFn) / x.s.length);
  const k = costs.indexOf(Math.min(...costs));
  return {
    roc: rocPoints(x.s, x.y),
    pr: prPoints(x.s, x.y),
    auc: aucRanks(x.s, x.y),
    ap: averagePrecision(x.s, x.y),
    brier: brier(x.s, x.y),
    rel: reliability(x.s, x.y),
    costs,
    bestT: T_GRID[k]!,
  };
}

export { confusion };
