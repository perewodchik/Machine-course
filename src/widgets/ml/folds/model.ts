// Модель виджета «Фолды» (урок 2.4 «Основ ML»): 60 «Квартир» (площадь → цена, data.json), полиномы степени 0–8.
// k-кратная кросс-валидация по перестановке с seed: ошибки фолдов, среднее и SE = s/√k; отложенная выборка 70/30 для
// сравнения; правило одной SE. Отклики 60 звонков банка — для показа стратификации.
import { polyEval, polyFitMoments } from "../../../lib/math/poly";
import { rng } from "../../../lib/math/rng";
import raw from "./data.json";

export const N = 60;
export const MAX_DEGREE = 8;
const X = raw.area.map((a) => (a - 72.5) / 47.5);
const Y = raw.price;
export const CALLS: number[] = raw.calls;

export function folds(k: number, seed: number): number[][] {
  const idx = rng(seed).shuffle(Array.from({ length: N }, (_, i) => i));
  return Array.from({ length: k }, (_, j) => idx.filter((_, p) => p % k === j));
}

/** Стратифицированные фолды для откликов: каждый класс раскладывается по фолдам отдельно. */
export function stratifiedFolds(k: number, seed: number): number[][] {
  const r = rng(seed);
  const out: number[][] = Array.from({ length: k }, () => []);
  for (const c of [0, 1]) {
    const idx = r.shuffle(CALLS.map((v, i) => (v === c ? i : -1)).filter((i) => i >= 0));
    idx.forEach((i, p) => out[p % k]!.push(i));
  }
  return out;
}

const mse = (theta: number[], idx: readonly number[]) => idx.reduce((s, i) => s + (polyEval(theta, X[i]!) - Y[i]!) ** 2, 0) / idx.length;
const fit = (idx: readonly number[], d: number) => polyFitMoments(idx.map((i) => [X[i]!, Y[i]!] as const), d);

export interface DegreeScore {
  d: number;
  errs: number[];
  mean: number;
  se: number;
}

export function cv(fs: number[][], maxDegree = MAX_DEGREE): DegreeScore[] {
  return Array.from({ length: maxDegree + 1 }, (_, d) => {
    const errs = fs.map((f) => {
      const inF = new Set(f);
      return mse(fit(Array.from({ length: N }, (_, i) => i).filter((i) => !inF.has(i)), d), f);
    });
    const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
    const sd = Math.sqrt(errs.reduce((a, e) => a + (e - mean) ** 2, 0) / Math.max(1, errs.length - 1));
    return { d, errs, mean, se: sd / Math.sqrt(errs.length) };
  });
}

/** Отложенная выборка: первые 70 % перестановки — обучение, остальные — валидация. */
export function holdout(seed: number, maxDegree = MAX_DEGREE): number[] {
  const idx = rng(seed).shuffle(Array.from({ length: N }, (_, i) => i));
  const tr = idx.slice(0, 42);
  const va = idx.slice(42);
  return Array.from({ length: maxDegree + 1 }, (_, d) => mse(fit(tr, d), va));
}

export const argmin = (v: readonly number[]) => v.indexOf(Math.min(...v));

/** Правило одной SE: наименьшая степень, чья средняя ошибка не выше минимума плюс его SE. */
export function oneSe(s: readonly DegreeScore[]): number {
  const best = s.reduce((a, b) => (b.mean < a.mean ? b : a));
  return s.find((x) => x.mean <= best.mean + best.se)!.d;
}
