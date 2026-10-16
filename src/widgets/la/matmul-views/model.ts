// Виджет «Четыре взгляда на AB» (урок I.3): одно произведение, четыре способа его посчитать.
// Модель без DOM: произведение, слагаемые-внешние произведения, что подсвечивать и как это прочитать.
export type Matrix = readonly (readonly number[])[];
export type View = "entry" | "columns" | "rows" | "outer";

export const VIEWS: readonly { id: View; name: string }[] = [
  { id: "entry", name: "Строка на столбец" },
  { id: "columns", name: "Столбцы" },
  { id: "rows", name: "Строки" },
  { id: "outer", name: "Внешние произведения" },
];

/** Что выбрано: элемент (i, j), столбец j, строка i или слагаемое k. Индексы с нуля. */
export type Pick = { view: "entry"; i: number; j: number } | { view: "columns"; j: number } | { view: "rows"; i: number } | { view: "outer"; k: number };

export const dims = (M: Matrix) => [M.length, M[0]!.length] as const;

export function matmul(A: Matrix, B: Matrix): number[][] {
  const [m, n] = dims(A);
  const p = dims(B)[1];
  if (dims(B)[0] !== n) throw new Error(`произведение не определено: ${m} × ${n} на ${dims(B)[0]} × ${p}`);
  return Array.from({ length: m }, (_, i) => Array.from({ length: p }, (_, j) => A[i]!.reduce((s, a, k) => s + a * B[k]![j]!, 0)));
}

/** k-е слагаемое суммы внешних произведений: столбец k матрицы A на строку k матрицы B. */
export const outerTerm = (A: Matrix, B: Matrix, k: number): number[][] => A.map((row) => B[k]!.map((b) => row[k]! * b + 0));

/** Сумма первых k + 1 слагаемых: при k = n − 1 это AB. */
export function partialOuter(A: Matrix, B: Matrix, k: number): number[][] {
  const [m] = dims(A);
  const p = dims(B)[1];
  const out = Array.from({ length: m }, () => Array.from({ length: p }, () => 0));
  for (let l = 0; l <= k; l++) outerTerm(A, B, l).forEach((row, i) => row.forEach((v, j) => (out[i]![j]! += v)));
  return out;
}

/** Какие клетки A, B и AB подсвечены при выборе. */
export function lit(pick: Pick): { a: (i: number, k: number) => boolean; b: (k: number, j: number) => boolean; c: (i: number, j: number) => boolean } {
  switch (pick.view) {
    case "entry":
      return { a: (i) => i === pick.i, b: (_, j) => j === pick.j, c: (i, j) => i === pick.i && j === pick.j };
    case "columns":
      return { a: () => false, b: (_, j) => j === pick.j, c: (_, j) => j === pick.j };
    case "rows":
      return { a: (i) => i === pick.i, b: () => false, c: (i) => i === pick.i };
    case "outer":
      return { a: (_, k) => k === pick.k, b: (k) => k === pick.k, c: () => false };
  }
}

/** Индекс подстрочными цифрами: 12 → «₁₂». */
export const sub = (k: number) => String(k).replace(/\d/g, (c) => "₀₁₂₃₄₅₆₇₈₉"[Number(c)]!);
const n = (v: number) => (v < 0 ? `(−${-v})` : String(v));
const num = (v: number) => String(v).replace("-", "−");
const vec = (xs: readonly number[]) => `(${xs.map(num).join(", ")})`;

/** Расчёт выбранной части словами — для подписи под матрицами и для скринридера. */
export function explain(A: Matrix, B: Matrix, pick: Pick): string {
  const C = matmul(A, B);
  const inner = dims(A)[1];
  const ks = Array.from({ length: inner }, (_, k) => k);
  switch (pick.view) {
    case "entry":
      return `(AB)${sub(pick.i + 1)}${sub(pick.j + 1)} = строка ${pick.i + 1} A на столбец ${pick.j + 1} B = ${ks.map((k) => `${n(A[pick.i]![k]!)}·${n(B[k]![pick.j]!)}`).join(" + ")} = ${num(C[pick.i]![pick.j]!)}`;
    case "columns":
      return `столбец ${pick.j + 1} AB = ${ks.map((k) => `${n(B[k]![pick.j]!)}·a${sub(k + 1)}`).join(" + ")} = ${vec(C.map((r) => r[pick.j]!))}: комбинация столбцов A с коэффициентами из столбца ${pick.j + 1} B`;
    case "rows":
      return `строка ${pick.i + 1} AB = ${ks.map((k) => `${n(A[pick.i]![k]!)}·b${sub(k + 1)}ᵀ`).join(" + ")} = ${vec(C[pick.i]!)}: комбинация строк B с коэффициентами из строки ${pick.i + 1} A`;
    case "outer":
      return `слагаемое ${pick.k + 1}: столбец ${pick.k + 1} A на строку ${pick.k + 1} B; сумма первых ${pick.k + 1} из ${inner} слагаемых${pick.k + 1 === inner ? " — это AB" : ""}`;
  }
}

/** Выбор по умолчанию при переключении взгляда. */
export const firstPick = (view: View): Pick => (view === "entry" ? { view, i: 0, j: 0 } : view === "columns" ? { view, j: 0 } : view === "rows" ? { view, i: 0 } : { view, k: 0 });
