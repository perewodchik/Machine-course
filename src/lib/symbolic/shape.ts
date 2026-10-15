// Форма выражения по ходу ввода (S3.06, идея A6): «форма 3 × 1» рядом с полем формулы или строкой вывода,
// а если формы не сходятся — где именно. Значения случайные, формы — из shape символов задачи.
import { evaluate, EvalError, shapeText, type Json } from "./evaluate";
import { sampleEnv, type SymbolShape } from "./equivalent";
import { parseTex } from "./parse";

export interface ShapeNote {
  ok: boolean;
  text: string;
}

/** Узел ошибки разбора: ["Error", …] или он же в обёртке {fn: […], sourceOffsets}. */
const hasError = (j: Json): boolean => {
  if (Array.isArray(j)) return j[0] === "Error" || (j as Json[]).some(hasError);
  const fn = typeof j === "object" && j !== null ? (j as { fn?: Json }).fn : undefined;
  return fn !== undefined && hasError(fn);
};

function noteFor(tex: string, symbols: readonly SymbolShape[]): ShapeNote | null {
  const j = parseTex(tex);
  if (j === null) return null;
  if (hasError(j)) return { ok: false, text: "запись пока не разобрана" };
  try {
    const m = evaluate(j, sampleEnv(symbols, 1));
    return { ok: true, text: m.r === 1 && m.c === 1 ? "число" : `форма ${shapeText(m)}` };
  } catch (e) {
    if (e instanceof EvalError) return { ok: false, text: e.message };
    throw e;
  }
}

/** Форма формулы в поле ответа; null — поле пустое. */
export function shapeOf(tex: string, symbols: readonly SymbolShape[]): ShapeNote | null {
  return noteFor(tex, symbols);
}

/** Форма строки вывода: «= …», «\nabla … = …» (правая часть) или уравнение (обе части одной формы). */
export function lineShape(tex: string, symbols: readonly SymbolShape[]): ShapeNote | null {
  const t = tex.trim().replace(/^=\s*/, "");
  const eq = t.indexOf("=");
  if (eq < 0 || /^\\nabla/.test(t)) return noteFor(eq < 0 ? t : t.slice(eq + 1), symbols);
  const left = noteFor(t.slice(0, eq), symbols);
  const right = noteFor(t.slice(eq + 1), symbols);
  if (!left || !right) return left ?? right;
  if (!left.ok) return left;
  if (!right.ok) return right;
  // ноль справа — нулевая матрица любой формы
  if (left.text !== right.text && !/^\s*0\s*$/.test(t.slice(eq + 1))) return { ok: false, text: `части уравнения разной формы: ${left.text.replace("форма ", "")} и ${right.text.replace("форма ", "")}` };
  return { ok: true, text: `уравнение, ${left.text}` };
}
