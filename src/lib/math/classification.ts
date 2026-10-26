// Классификация по порогу (курс «Основы ML», урок 2.1; виджет «Порог классификатора», игра «Цена ошибки»): матрица ошибок,
// точность и полнота, ROC и AUC, цена ошибок и лучший порог. Те же функции, что в code/snippets/ml_basics/threshold.py.

export interface Confusion {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
}

/** Объект считаем положительным (отказ в кредите), если оценка не меньше порога. */
export function confusion(scores: readonly number[], y: readonly number[], t: number): Confusion {
  const c = { tp: 0, fp: 0, fn: 0, tn: 0 };
  for (let i = 0; i < scores.length; i++) {
    const pos = scores[i]! >= t;
    if (pos && y[i]) c.tp++;
    else if (pos) c.fp++;
    else if (y[i]) c.fn++;
    else c.tn++;
  }
  return c;
}

/** Точность без отказов не определена — как в Python, считаем её единицей. */
export const precision = (c: Confusion) => (c.tp + c.fp ? c.tp / (c.tp + c.fp) : 1);
export const recall = (c: Confusion) => (c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0);
export const fpr = (c: Confusion) => (c.fp + c.tn ? c.fp / (c.fp + c.tn) : 0);
export const accuracy = (c: Confusion) => (c.tp + c.tn) / Math.max(1, c.tp + c.fp + c.fn + c.tn);

/** AUC = P(оценка положительного > оценки отрицательного); ничья — за ½. */
export function rocAuc(scores: readonly number[], y: readonly number[]): number {
  const pos = scores.filter((_, i) => y[i]);
  const neg = scores.filter((_, i) => !y[i]);
  let s = 0;
  for (const p of pos) for (const q of neg) s += p > q ? 1 : p === q ? 0.5 : 0;
  return s / (pos.length * neg.length);
}

/** Точки ROC (FPR, TPR) при пороге, идущем от большего к меньшему; ничьи оценок — одной точкой. */
export function rocPoints(scores: readonly number[], y: readonly number[]): [number, number][] {
  const idx = scores.map((_, i) => i).sort((a, b) => scores[b]! - scores[a]!);
  const P = y.reduce((a, v) => a + v, 0);
  const N = y.length - P;
  const pts: [number, number][] = [[0, 0]];
  let tp = 0;
  let fp = 0;
  idx.forEach((i, k) => {
    if (y[i]) tp++;
    else fp++;
    if (k === idx.length - 1 || scores[idx[k + 1]!] !== scores[i]) pts.push([fp / N, tp / P]);
  });
  return pts;
}

export const totalCost = (scores: readonly number[], y: readonly number[], t: number, cFp: number, cFn: number) => {
  const c = confusion(scores, y, t);
  return cFp * c.fp + cFn * c.fn;
};

/** Перебор порогов по всем различным оценкам и «никого не отмечать» (1.001); при равной цене — меньший порог. */
export function bestThreshold(scores: readonly number[], y: readonly number[], cFp: number, cFn: number): { t: number; cost: number } {
  const candidates = [...new Set(scores)].sort((a, b) => a - b).concat([1.001]);
  let best = { t: candidates[0]!, cost: Infinity };
  for (const t of candidates) {
    const cost = totalCost(scores, y, t, cFp, cFn);
    if (cost < best.cost) best = { t, cost };
  }
  return best;
}

/** Для калиброванных вероятностей: отмечать, если p · c_fn > (1 − p) · c_fp, то есть p > c_fp / (c_fp + c_fn). */
export const bayesThreshold = (cFp: number, cFn: number) => cFp / (cFp + cFn);
