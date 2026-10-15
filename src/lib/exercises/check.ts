// Проверка ответов: чистые функции, общие для сервера (тесты, генераторы) и браузера (src/client/exercise.ts).
import { parseNumber } from "./parse";

export interface NumericResult {
  /** null — ввод не число: подсказать формат, попытку не засчитывать. */
  value: number | null;
  correct: boolean;
}

export function closeEnough(value: number, answer: number, tol = 0.005, rel = 0): boolean {
  return Math.abs(value - answer) <= Math.max(tol, rel * Math.abs(answer)) + 1e-12;
}

export function checkNumeric(raw: string, answer: number, tol?: number, rel?: number): NumericResult {
  const value = parseNumber(raw);
  return { value, correct: value !== null && closeEnough(value, answer, tol, rel) };
}

export interface MatrixResult {
  /** Для каждой клетки: true — верно, false — неверно, null — пусто или не число. */
  cells: (boolean | null)[][];
  correct: boolean;
  /** Все клетки заполнены числами. */
  complete: boolean;
}

export function checkMatrix(raw: string[][], answer: number[][], tol?: number): MatrixResult {
  const cells = answer.map((row, i) =>
    row.map((a, j) => {
      const v = parseNumber(raw[i]?.[j] ?? "");
      return v === null ? null : closeEnough(v, a, tol);
    }),
  );
  const flat = cells.flat();
  return { cells, correct: flat.every((c) => c === true), complete: flat.every((c) => c !== null) };
}

export interface OrderResult {
  /** Для каждой позиции: стоит ли на ней верный шаг. */
  positions: boolean[];
  correct: boolean;
}

/** order — индексы шагов (в верном порядке 0, 1, 2, …) в том порядке, как их расставил ученик. */
export function checkOrder(order: readonly number[]): OrderResult {
  const positions = order.map((step, i) => step === i);
  return { positions, correct: positions.every(Boolean) };
}

/** Перемешанный порядок, который не совпадает с верным (иначе задача решена до начала). */
export function scrambled(n: number, shuffle: (xs: number[]) => number[]): number[] {
  const identity = Array.from({ length: n }, (_, i) => i);
  if (n < 2) return identity;
  for (let i = 0; i < 10; i++) {
    const s = shuffle(identity);
    if (s.some((v, k) => v !== k)) return s;
  }
  return [...identity.slice(1), 0];
}
