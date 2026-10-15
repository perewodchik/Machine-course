// Проверка формулы ученика для упражнения kind: "formula" (src/client/exercise.ts грузит модуль по требованию).
import { equivalent, sameAsMutation, type SymbolShape, type Verdict } from "./equivalent";
import { parseTex } from "./parse";

/** null — поле пустое. */
export function checkFormula(tex: string, answer: string, symbols: readonly SymbolShape[]): Verdict | null {
  const student = parseTex(tex);
  if (student === null) return null;
  const want = parseTex(answer);
  if (want === null) throw new Error("пустой эталон формулы");
  return equivalent(student, want, symbols);
}

/** Индекс типичной ошибки, которой равен ответ ученика (на случайных матрицах), или −1. */
export function matchMutation(tex: string, mutations: readonly string[], symbols: readonly SymbolShape[]): number {
  const student = parseTex(tex);
  if (student === null) return -1;
  return mutations.findIndex((m) => {
    const wrong = parseTex(m);
    return wrong !== null && sameAsMutation(student, wrong, symbols);
  });
}

