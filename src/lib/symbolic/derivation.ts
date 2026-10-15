// Проверка вывода ученика по шагам (S3.04, идея A1) — TS-версия харнесса code/mlf/formulas.py: каждая строка
// сверяется со строкой выше на случайных матрицах заданных форм. Вид шага — по записи строки:
//   «= выражение» или просто выражение — то же значение (same);
//   «\nabla_\theta … = выражение» — градиент строки выше по θ (gradient, конечными разностями);
//   «A = B» — уравнение, равносильное строке выше (stationary: невязка A − B пропорциональна невязке выше);
//   «\theta = выражение» — решение: подстановка обращает невязку строки выше в ноль (solution).
// Первая неверная строка получает понятное сообщение; остальные не проверяются.
import { evaluate, EvalError, shapeText, type Env, type Json, type Mat } from "./evaluate";
import { sampleEnv, type SymbolShape } from "./equivalent";
import { parseTex } from "./parse";

export type LineKind = "same" | "gradient" | "equation" | "solution";

export interface Line {
  kind: LineKind;
  /** Значение строки (same, gradient, solution — правая часть). */
  expr?: Json;
  /** Уравнение: левая и правая части. */
  lhs?: Json;
  rhs?: Json;
}

export interface LineVerdict {
  ok: boolean;
  message?: string;
}

export interface DerivationVerdict {
  /** Все введённые строки верны. */
  ok: boolean;
  /** Последняя строка — цель (значение и вид совпали). */
  done: boolean;
  /** Номер первой неверной строки (с нуля); −1 — ошибок нет. */
  first: number;
  lines: LineVerdict[];
}

const DECOR = /\^\{?\\(?:star|ast)\}?|\^\{?\*\}?|\\(?:hat|bar|tilde)\b/g;

/** Строка TeX → вид шага и выражения. wrt — переменная вывода в TeX и в MathJSON: «\theta» и «theta». */
export function classify(tex: string, wrt: { tex: string; name: string }, symbols: readonly SymbolShape[]): Line {
  const t = tex.trim().replace(/^=\s*/, "");
  const eq = t.indexOf("=");
  const parse = (s: string): Json => {
    const j = parseTex(s);
    if (j === null) throw new EvalError("пустая часть строки", "syntax");
    return j;
  };
  if (/^\\nabla/.test(t)) {
    if (eq < 0) throw new EvalError("после градиента нужен знак «=» и выражение", "syntax");
    return { kind: "gradient", expr: parse(t.slice(eq + 1)) };
  }
  if (eq < 0) return { kind: "same", expr: parse(t) };
  const left = t.slice(0, eq).trim();
  const right = t.slice(eq + 1);
  if (left.replace(DECOR, "").replace(/[{}\s]/g, "") === wrt.tex.replace(/[{}\s]/g, "")) return { kind: "solution", expr: parse(right) };
  // «J(\theta) = …», «\ell = …» — имя для строки выше, а не уравнение
  const lhs = parseTex(left);
  const named = (j: Json | null): boolean =>
    typeof j === "string" ? !symbols.some((s) => s.name === j) : Array.isArray(j) && typeof j[0] === "string" && !symbols.some((s) => s.name === j[0]) && /^[A-Za-z]+$/.test(j[0]) && j.length === 2 && j[1] === wrt.name;
  if (named(lhs)) return { kind: "same", expr: parse(right) };
  return { kind: "equation", lhs: lhs ?? 0, rhs: parse(right) };
}

const isZero = (m: Mat) => m.r === 1 && m.c === 1 && m.v[0] === 0;
const sub = (a: Mat, b: Mat): Mat => {
  // «… = 0»: ноль-число означает нулевую матрицу формы другой части
  if (isZero(b)) return a;
  if (isZero(a)) return { r: b.r, c: b.c, v: b.v.map((x) => -x) };
  if (a.r !== b.r || a.c !== b.c) throw new EvalError(`части уравнения разной формы: ${shapeText(a)} и ${shapeText(b)}`, "shape");
  return { r: a.r, c: a.c, v: a.v.map((x, i) => x - b.v[i]!) };
};
const norm = (m: Mat) => Math.sqrt(m.v.reduce((s, x) => s + x * x, 0));

/** Состояние после строки: значение (выражение) или уравнение (невязка). */
type State = { kind: "expr"; expr: Json } | { kind: "eq"; lhs: Json; rhs: Json };

const residual = (s: State, env: Env): Mat => (s.kind === "expr" ? evaluate(s.expr, env) : sub(evaluate(s.lhs, env), evaluate(s.rhs, env)));

function gradientAt(expr: Json, env: Env, wrt: string): Mat {
  const x = env.get(wrt)!;
  const g = new Float64Array(x.v.length);
  for (let k = 0; k < x.v.length; k++) {
    const h = 1e-5 * Math.max(1, Math.abs(x.v[k]!));
    const at = (d: number) => {
      const v = Float64Array.from(x.v);
      v[k]! += d;
      const f = evaluate(expr, new Map(env).set(wrt, { r: x.r, c: x.c, v }));
      if (f.r !== 1 || f.c !== 1) throw new EvalError(`градиент берут у числа, а строка выше — матрица ${shapeText(f)}`, "shape");
      return f.v[0]!;
    };
    g[k] = (at(h) - at(-h)) / (2 * h);
  }
  return { r: x.r, c: x.c, v: g };
}

const TRIALS = 3;

/** Проверка одного шага: строка line против состояния prev. Сообщение — для ученика. */
function checkStep(prev: State, line: Line, symbols: readonly SymbolShape[], wrt: string, seed: number): LineVerdict {
  try {
    let ratio: number | undefined;
    for (let t = 0; t < TRIALS; t++) {
      const env = sampleEnv(symbols, seed + 31 * t);
      if (line.kind === "same") {
        if (prev.kind === "eq") return { ok: false, message: "строка выше — уравнение: дальше пишите уравнение или решение «θ = …»" };
        const want = evaluate(prev.expr, env);
        const got = evaluate(line.expr!, env);
        if (got.r !== want.r || got.c !== want.c) return { ok: false, message: `форма ${shapeText(got)}, а у строки выше ${shapeText(want)}` };
        if (norm(sub(got, want)) > 1e-7 * Math.max(1, norm(want))) return { ok: false, message: "не равна строке выше: значения расходятся на случайных матрицах" };
      } else if (line.kind === "gradient") {
        if (prev.kind === "eq") return { ok: false, message: "градиент берут у выражения, а строка выше — уравнение" };
        const want = gradientAt(prev.expr, env, wrt);
        const got = evaluate(line.expr!, env);
        if (got.r !== want.r || got.c !== want.c) return { ok: false, message: `форма ${shapeText(got)}, а у градиента — форма переменной, ${shapeText(want)}` };
        if (norm(sub(got, want)) > 1e-4 * Math.max(1, norm(want))) return { ok: false, message: "это не градиент строки выше: сверка конечными разностями не сходится" };
      } else if (line.kind === "equation") {
        // невязка нового уравнения пропорциональна невязке строки выше (выражение выше читается как «= 0»)
        const a = residual({ kind: "eq", lhs: line.lhs!, rhs: line.rhs! }, env);
        const b = residual(prev, env);
        if (a.r !== b.r || a.c !== b.c) return { ok: false, message: `форма уравнения ${shapeText(a)}, а у строки выше ${shapeText(b)}` };
        const bb = b.v.reduce((s, x) => s + x * x, 0);
        const c = a.v.reduce((s, x, i) => s + x * b.v[i]!, 0) / (bb || 1);
        ratio ??= c;
        const off = norm({ r: a.r, c: a.c, v: a.v.map((x, i) => x - c * b.v[i]!) });
        if (Math.abs(c) < 1e-9 || off > 1e-7 * Math.max(1, norm(a)) || Math.abs(c - ratio) > 1e-6 * Math.max(1, Math.abs(ratio))) {
          return { ok: false, message: "уравнение не равносильно строке выше: обе части можно умножать на одно и то же число или матрицу, но не менять слагаемые" };
        }
      } else {
        // решение: правая часть без θ, подстановка обращает невязку строки выше в ноль
        const noX = new Map(env);
        noX.delete(wrt);
        let x: Mat;
        try {
          x = evaluate(line.expr!, noX);
        } catch (e) {
          if (e instanceof EvalError && e.kind === "symbol" && e.message.includes(`«${wrt}»`)) return { ok: false, message: "в решении справа не должно быть самой переменной" };
          throw e;
        }
        const was = env.get(wrt)!;
        if (x.r !== was.r || x.c !== was.c) return { ok: false, message: `форма решения ${shapeText(x)}, а у переменной ${shapeText(was)}` };
        const at = new Map(env).set(wrt, x);
        const r = residual(prev, at);
        const scale = prev.kind === "eq" ? Math.max(norm(evaluate(prev.lhs, at)), norm(evaluate(prev.rhs, at)), 1) : Math.max(1, norm(x));
        if (norm(r) > 1e-6 * scale) return { ok: false, message: "подстановка не обращает строку выше в верное равенство" };
      }
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof EvalError) return { ok: false, message: e.message };
    throw e;
  }
}

const parens = (j: Json): number => (Array.isArray(j) ? (j[0] === "Delimiter" ? 1 : 0) + (j as Json[]).slice(1).reduce((s: number, x) => s + parens(x), 0) : 0);

export interface DerivationTask {
  /** Первая строка (дана): выражение в TeX. */
  start: string;
  /** Цель — последняя строка: выражение или решение «\theta = …». */
  goal: string;
  symbols: readonly SymbolShape[];
  /** Переменная вывода: TeX и имя в MathJSON. */
  wrt?: { tex: string; name: string };
}

export function checkDerivation(task: DerivationTask, lines: readonly string[], seed = 1): DerivationVerdict {
  const wrt = task.wrt ?? { tex: String.raw`\theta`, name: "theta" };
  let state: State = { kind: "expr", expr: classify(task.start, wrt, task.symbols).expr! };
  const out: LineVerdict[] = [];
  let first = -1;
  let last: Line | undefined;
  for (const [i, tex] of lines.entries()) {
    if (first >= 0) break;
    let line: Line;
    try {
      line = classify(tex, wrt, task.symbols);
    } catch (e) {
      if (!(e instanceof EvalError)) throw e;
      out.push({ ok: false, message: e.message });
      first = i;
      break;
    }
    const v = checkStep(state, line, task.symbols, wrt.name, seed + i);
    out.push(v);
    if (!v.ok) {
      first = i;
      break;
    }
    last = line;
    state = line.kind === "equation" ? { kind: "eq", lhs: line.lhs!, rhs: line.rhs! } : line.kind === "solution" ? { kind: "eq", lhs: wrt.name, rhs: line.expr! } : { kind: "expr", expr: line.expr! };
  }
  // цель: тот же вид и то же значение; у выражения — не больше скобок, чем в цели («раскройте скобки»)
  let done = false;
  if (first < 0 && last) {
    const goal = classify(task.goal, wrt, task.symbols);
    if (goal.kind === "solution") {
      done = last.kind === "solution" && checkStep({ kind: "expr", expr: goal.expr! }, { kind: "same", expr: last.expr! }, task.symbols, wrt.name, seed).ok;
    } else if (last.kind !== "solution" && last.kind !== "equation" && goal.expr !== undefined) {
      done = checkStep({ kind: "expr", expr: goal.expr }, { kind: "same", expr: last.expr! }, task.symbols, wrt.name, seed).ok && parens(last.expr!) <= parens(goal.expr);
    }
  }
  return { ok: first < 0, done, first, lines: out };
}

/** Проверка задачи автором (при сборке): первая строка и цель разбираются и вычисляются на своих символах. */
export function validateTask(task: DerivationTask): void {
  const wrt = task.wrt ?? { tex: String.raw`\theta`, name: "theta" };
  const env = sampleEnv(task.symbols, 1);
  const start = classify(task.start, wrt, task.symbols);
  const goal = classify(task.goal, wrt, task.symbols);
  if (start.kind !== "same") throw new Error(`первая строка вывода «${task.start}» — должна быть выражением`);
  evaluate(start.expr!, env);
  if (goal.kind === "equation") throw new Error(`цель «${task.goal}» — выражение или решение «${wrt.tex} = …», не уравнение`);
  evaluate(goal.expr!, env);
}

