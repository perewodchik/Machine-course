// Проверка символьного ответа: ответ ученика и эталон вычисляются на случайных матрицах заданных форм
// (как шаги выводов в code/mlf/formulas.py) и сравниваются. Совпали на нескольких наборах — ответ верен.
import { rng } from "../math/rng";
import { evaluate, EvalError, shapeText, type Env, type Json, type Mat } from "./evaluate";

/** Символ ответа: имя в MathJSON («theta», «X», «x^(i)»), форма («d», 1) и знак (под логарифмом — положительный). */
export interface SymbolShape {
  name: string;
  shape?: readonly (number | string)[];
  positive?: boolean;
}

/** Размеры, как в численной проверке выводов (code/mlf/formulas.py). */
export const DIMS: Readonly<Record<string, number>> = { n: 7, d: 3, m: 4, k: 5, p: 2 };

export type Verdict = { ok: true } | { ok: false; kind: "shape" | "symbol" | "syntax" | "value"; message: string };

function dims(shape: readonly (number | string)[] | undefined): [number, number] {
  const s = (shape ?? []).map((x) => (typeof x === "number" ? x : (DIMS[x] ?? 3)));
  return s.length === 0 ? [1, 1] : s.length === 1 ? [s[0]!, 1] : [s[0]!, s[1]!];
}

/** Случайные значения символов: нормальные (Бокс — Мюллер), у положительных — из [0.5, 2]. */
export function sampleEnv(symbols: readonly SymbolShape[], seed: number): Env {
  const r = rng(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r.next())) * Math.cos(2 * Math.PI * r.next());
  return new Map(
    symbols.map((s): [string, Mat] => {
      const [rows, cols] = dims(s.shape);
      const v = Float64Array.from({ length: rows * cols }, () => (s.positive ? 0.5 + 1.5 * r.next() : normal()));
      return [s.name, { r: rows, c: cols, v }];
    }),
  );
}

export function equivalent(student: Json, answer: Json, symbols: readonly SymbolShape[], { trials = 4, seed = 1, rtol = 1e-7 } = {}): Verdict {
  for (let t = 0; t < trials; t++) {
    const env = sampleEnv(symbols, seed + 97 * t);
    const want = evaluate(answer, env); // ошибка эталона — ошибка автора задачи, её видят тесты
    let got: Mat;
    try {
      got = evaluate(student, env);
    } catch (e) {
      if (e instanceof EvalError) return { ok: false, kind: e.kind, message: e.message };
      throw e;
    }
    if (got.r !== want.r || got.c !== want.c) return { ok: false, kind: "shape", message: `форма ответа ${shapeText(got)}, а нужна ${shapeText(want)}` };
    const close = got.v.every((x, i) => Math.abs(x - want.v[i]!) <= rtol * Math.max(1, Math.abs(want.v[i]!)));
    if (!close) return { ok: false, kind: "value", message: "форма верная, но значения не совпадают с ответом на случайных матрицах" };
  }
  return { ok: true };
}
