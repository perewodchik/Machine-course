// Численное значение выражения MathJSON (его даёт разбор TeX Compute Engine) на матрицах заданных форм.
// Матрица — строки × столбцы, число — матрица 1 × 1: так θᵀx остаётся числом, как в CS229.
// Ошибки — с текстом для ученика: форма не сходится, символ неизвестен, операция не поддерживается.

export type Json = number | string | readonly Json[] | { readonly [k: string]: unknown };

export interface Mat {
  r: number;
  c: number;
  /** Элементы по строкам. */
  v: Float64Array;
}

export class EvalError extends Error {
  constructor(
    message: string,
    /** shape — формы не сходятся; symbol — неизвестный символ; syntax — непонятная запись. */
    readonly kind: "shape" | "symbol" | "syntax",
  ) {
    super(message);
  }
}

export const scalar = (x: number): Mat => ({ r: 1, c: 1, v: Float64Array.of(x) });
export const isScalar = (m: Mat) => m.r === 1 && m.c === 1;
export const shapeText = (m: Mat) => `${m.r}\u202f×\u202f${m.c}`;

const map = (m: Mat, f: (x: number) => number): Mat => ({ r: m.r, c: m.c, v: m.v.map(f) });

function add(a: Mat, b: Mat, sign: 1 | -1): Mat {
  if (a.r !== b.r || a.c !== b.c) throw new EvalError(`складываются формы ${shapeText(a)} и ${shapeText(b)}: формы слагаемых должны совпадать`, "shape");
  return { r: a.r, c: a.c, v: a.v.map((x, i) => x + sign * b.v[i]!) };
}

function mul(a: Mat, b: Mat): Mat {
  if (isScalar(a)) return map(b, (x) => a.v[0]! * x);
  if (isScalar(b)) return map(a, (x) => x * b.v[0]!);
  if (a.c !== b.r) throw new EvalError(`произведение ${shapeText(a)} на ${shapeText(b)}: число столбцов слева должно равняться числу строк справа`, "shape");
  const v = new Float64Array(a.r * b.c);
  for (let i = 0; i < a.r; i++) for (let k = 0; k < a.c; k++) for (let j = 0; j < b.c; j++) v[i * b.c + j]! += a.v[i * a.c + k]! * b.v[k * b.c + j]!;
  return { r: a.r, c: b.c, v };
}

const transpose = (a: Mat): Mat => {
  const v = new Float64Array(a.r * a.c);
  for (let i = 0; i < a.r; i++) for (let j = 0; j < a.c; j++) v[j * a.r + i] = a.v[i * a.c + j]!;
  return { r: a.c, c: a.r, v };
};

function inverse(a: Mat): Mat {
  if (a.r !== a.c) throw new EvalError(`обратная есть только у квадратной матрицы, а здесь ${shapeText(a)}`, "shape");
  const n = a.r;
  const m = Array.from({ length: n }, (_, i) => [...a.v.slice(i * n, i * n + n), ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let p = col;
    for (let i = col + 1; i < n; i++) if (Math.abs(m[i]![col]!) > Math.abs(m[p]![col]!)) p = i;
    [m[col], m[p]] = [m[p]!, m[col]!];
    const piv = m[col]![col]!;
    if (Math.abs(piv) < 1e-12) throw new EvalError(`матрица ${shapeText(a)} вырождена: обратной нет`, "shape");
    for (let j = 0; j < 2 * n; j++) m[col]![j]! /= piv;
    for (let i = 0; i < n; i++) {
      if (i === col) continue;
      const f = m[i]![col]!;
      for (let j = 0; j < 2 * n; j++) m[i]![j]! -= f * m[col]![j]!;
    }
  }
  return { r: n, c: n, v: Float64Array.from(m.flatMap((row) => row.slice(n))) };
}

function det(a: Mat): number {
  if (a.r !== a.c) throw new EvalError(`определитель есть только у квадратной матрицы, а здесь ${shapeText(a)}`, "shape");
  const n = a.r;
  const m = Array.from({ length: n }, (_, i) => [...a.v.slice(i * n, i * n + n)]);
  let d = 1;
  for (let col = 0; col < n; col++) {
    let p = col;
    for (let i = col + 1; i < n; i++) if (Math.abs(m[i]![col]!) > Math.abs(m[p]![col]!)) p = i;
    if (Math.abs(m[p]![col]!) < 1e-300) return 0;
    if (p !== col) {
      [m[col], m[p]] = [m[p]!, m[col]!];
      d = -d;
    }
    d *= m[col]![col]!;
    for (let i = col + 1; i < n; i++) {
      const f = m[i]![col]! / m[col]![col]!;
      for (let j = col; j < n; j++) m[i]![j]! -= f * m[col]![j]!;
    }
  }
  return d;
}

const needScalar = (m: Mat, what: string): number => {
  if (!isScalar(m)) throw new EvalError(`${what} — от числа, а здесь матрица ${shapeText(m)}`, "shape");
  return m.v[0]!;
};

/** Функции, которые ученик пишет как f(x): сигмоида и обозначения курса. */
const FUNCTIONS: Record<string, (x: number) => number> = {
  sigma: (z) => 1 / (1 + Math.exp(-z)),
};

const NAMED: Record<string, number> = { Pi: Math.PI, ExponentialE: Math.E, Half: 0.5 };

export type Env = ReadonlyMap<string, Mat>;

/** Имя символа в MathJSON → имя в окружении: «x^(i)» для x^{(i)}. */
const indexedName = (base: string, idx: Json) => `${base}^(${typeof idx === "string" || typeof idx === "number" ? idx : JSON.stringify(idx)})`;

export function evaluate(e: Json, env: Env): Mat {
  if (typeof e === "number") return scalar(e);
  if (typeof e === "string") {
    const m = env.get(e);
    if (m) return m;
    if (e in NAMED) return scalar(NAMED[e]!);
    if (e === "e") return scalar(Math.E);
    throw new EvalError(`неизвестный символ «${e}»`, "symbol");
  }
  if (!Array.isArray(e)) {
    // {num: "…"} — число в виде строки
    const num = (e as { num?: string }).num;
    if (num !== undefined) return scalar(Number(num));
    // выражение с позицией в исходнике: {fn: [...], sourceOffsets}
    const fn = (e as { fn?: Json }).fn;
    if (fn !== undefined) return evaluate(fn, env);
    throw new EvalError("непонятная запись", "syntax");
  }
  const [head, ...args] = e as [string, ...Json[]];
  const ev = (x: Json) => evaluate(x, env);
  switch (head) {
    case "Delimiter":
      if (args.length !== 1) throw new EvalError("в скобках должно быть одно выражение", "syntax");
      return ev(args[0]!);
    case "Add":
      return args.map(ev).reduce((a, b) => add(a, b, 1));
    case "Subtract":
      return args.length === 1 ? map(ev(args[0]!), (x) => -x) : args.map(ev).reduce((a, b) => add(a, b, -1));
    case "Negate":
      return map(ev(args[0]!), (x) => -x);
    case "Multiply":
      return args.map(ev).reduce(mul);
    case "InvisibleOperator": {
      // f(x) — применение функции: σ(z)
      const out: Mat[] = [];
      for (let i = 0; i < args.length; i++) {
        const a = args[i]!;
        const next = args[i + 1];
        if (typeof a === "string" && a in FUNCTIONS && !env.has(a) && Array.isArray(next) && next[0] === "Delimiter") {
          out.push(map(ev(next), FUNCTIONS[a]!));
          i++;
        } else out.push(ev(a));
      }
      return out.reduce(mul);
    }
    case "Divide": {
      const den = needScalar(ev(args[1]!), "делить можно только на число: знаменатель");
      return map(ev(args[0]!), (x) => x / den);
    }
    case "Rational":
      return scalar(needScalar(ev(args[0]!), "дробь") / needScalar(ev(args[1]!), "дробь"));
    case "Power": {
      const [base, exp] = args as [Json, Json];
      // x^{(i)} — номер объекта, а не степень; x^{(i)\top} парсер читает как (i)·True — это транспонированный x^{(i)}
      if (typeof base === "string" && Array.isArray(exp)) {
        const parts = exp as Json[];
        if (parts[0] === "Delimiter") {
          const m = env.get(indexedName(base, parts[1]!));
          if (m) return m;
        }
        const inner = parts[1];
        if (parts[0] === "InvisibleOperator" && parts.length === 3 && Array.isArray(inner) && inner[0] === "Delimiter" && (parts[2] === "True" || parts[2] === "T")) {
          const m = env.get(indexedName(base, (inner as Json[])[1]!));
          if (m) return transpose(m);
        }
      }
      const b = ev(base);
      const p = ev(exp);
      const k = needScalar(p, "степень");
      if (!isScalar(b)) {
        if (k === -1) return inverse(b);
        if (Number.isInteger(k) && k >= 1) {
          let out = b;
          for (let i = 1; i < k; i++) out = mul(out, b);
          return out;
        }
        throw new EvalError(`матрицу ${shapeText(b)} нельзя возвести в степень ${k}`, "shape");
      }
      return scalar(b.v[0]! ** k);
    }
    case "Square":
      return ((m) => (isScalar(m) ? scalar(m.v[0]! ** 2) : mul(m, m)))(ev(args[0]!));
    case "Transpose":
      return transpose(ev(args[0]!));
    case "Inverse":
      return inverse(ev(args[0]!));
    case "Sqrt":
      return map(ev(args[0]!), Math.sqrt);
    case "Exp":
      return map(ev(args[0]!), Math.exp);
    case "Ln":
      return map(ev(args[0]!), Math.log);
    case "Log":
      // в CS229 log — натуральный; log с основанием — \log_b
      return args.length > 1 ? map(ev(args[0]!), (x) => Math.log(x) / Math.log(needScalar(ev(args[1]!), "основание"))) : map(ev(args[0]!), Math.log);
    case "Abs":
      return map(ev(args[0]!), Math.abs);
    case "Norm": {
      const m = ev(args[0]!);
      return scalar(Math.sqrt(m.v.reduce((s, x) => s + x * x, 0)));
    }
    case "Trace": {
      const m = ev(args[0]!);
      if (m.r !== m.c) throw new EvalError(`след есть только у квадратной матрицы, а здесь ${shapeText(m)}`, "shape");
      let t = 0;
      for (let i = 0; i < m.r; i++) t += m.v[i * m.c + i]!;
      return scalar(t);
    }
    case "Determinant":
      return scalar(det(ev(args[0]!)));
    case "Error":
      throw new EvalError("запись не разобрана: проверьте скобки и знаки", "syntax");
    default:
      throw new EvalError(`запись «${head}» пока не поддерживается`, "syntax");
  }
}
