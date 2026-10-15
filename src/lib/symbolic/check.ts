// Проверка формулы ученика для упражнения kind: "formula" (src/client/exercise.ts грузит модуль по требованию).
import { equivalent, type SymbolShape, type Verdict } from "./equivalent";
import { parseTex } from "./parse";

/** null — поле пустое. */
export function checkFormula(tex: string, answer: string, symbols: readonly SymbolShape[]): Verdict | null {
  const student = parseTex(tex);
  if (student === null) return null;
  const want = parseTex(answer);
  if (want === null) throw new Error("пустой эталон формулы");
  return equivalent(student, want, symbols);
}
