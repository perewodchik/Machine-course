// Игра «Переводчик сумм» (урок 0.4): собрать матричную запись из индексной.
// Ученик ставит множители в цепочку (вектор, матрица, вектор из единиц), транспонирует их и видит
// размер произведения и его индексную запись — ту же сумму, что в задании, или другую.
// Проверка — на двух наборах случайных целых чисел: равные записи (xᵀy и yᵀx) принимаются обе.
import type { GameSpec, Rng } from "../_engine/types";
import { rng } from "../../lib/math/rng";

export type Kind = "dot" | "ones" | "matvec" | "bilinear" | "outer" | "xty" | "gram";

export interface Tile {
  /** Имя в записи: x, A, X, θ; вектор из единиц — «1» (полужирная единица). */
  name: string;
  rows: number;
  /** Вектор — столбец: cols = 1. */
  cols: number;
  ones?: boolean;
}

export interface Factor {
  tile: number;
  t: boolean;
}

export interface Level {
  kind: Kind;
  tiles: Tile[];
  answer: Factor[];
  /** Два набора значений: values[набор][плитка] — матрица rows × cols. */
  values: number[][][][];
}

export type Verdict = "empty" | "mismatch" | "shape" | "value" | "ok";

export interface State {
  level: Level;
  chain: Factor[];
  checks: number;
  hints: number;
  /** Итог последней проверки; сбрасывается, когда цепочка меняется. */
  last: Verdict | null;
  done: boolean;
}

export type Action =
  | { type: "add"; tile: number }
  | { type: "toggle"; at: number }
  | { type: "remove"; at: number }
  | { type: "clear" }
  | { type: "check" }
  | { type: "hint" }
  | { type: "reset" };

export const KINDS: readonly Kind[] = ["dot", "ones", "matvec", "bilinear", "outer", "xty", "gram"];
export const LEVELS = KINDS.length;
export const MAX_CHAIN = 4;

export const KIND_NAMES: Record<Kind, string> = {
  dot: "скалярное произведение",
  ones: "сумма элементов",
  matvec: "матрица на вектор",
  bilinear: "строка, матрица, столбец",
  outer: "без суммы",
  xty: "признаки на ответы",
  gram: "матрица Грама",
};

export const DEBRIEF: Record<Kind, { question: string; answer: string }> = {
  dot: {
    question: "Почему xᵀy и yᵀx — одно и то же?",
    answer: "Обе записи дают Σᵢ xᵢyᵢ: числа xᵢyᵢ и yᵢxᵢ равны, а имя индекса суммирования ни на что не влияет.",
  },
  ones: {
    question: "Как записать среднее значение y матрично?",
    answer: "Сумма — это 1ᵀy, среднее — (1/n)·1ᵀy. Вектор из единиц превращает «сложить все элементы» в произведение.",
  },
  matvec: {
    question: "Почему xᵀA не годится, если A — m × k, а x — из ℝᵏ?",
    answer: "Суммируют по общему индексу: он должен быть номером столбца левого множителя и номером строки правого. У xᵀ один столбец на каждый из k элементов, а у A строк m — числа не совпадают.",
  },
  bilinear: {
    question: "Какой множитель отвечает за индекс i, какой — за j?",
    answer: "xᵀ слева даёт индекс i — номер строки A, y справа — индекс j, номер столбца A. Двойная сумма по i и j — это строка, матрица и столбец.",
  },
  outer: {
    question: "Почему здесь получилась матрица, а не число?",
    answer: "Суммы нет: оба индекса свободные. Столбец на строку, x yᵀ, даёт таблицу всех произведений xᵢyⱼ, а строка на столбец, xᵀy, — их сумму по одному индексу.",
  },
  xty: {
    question: "Почему X пришлось транспонировать?",
    answer: "Суммируют по номеру объекта i — по строкам X. В произведении суммируют по столбцам левого множителя, поэтому строки X нужно сделать столбцами: Xᵀy. Это градиент МНК без константы (урок V.1).",
  },
  gram: {
    question: "Чем XᵀX отличается от XXᵀ?",
    answer: "XᵀX суммирует по объектам и даёт матрицу d × d — по паре признаков. XXᵀ суммирует по признакам и даёт матрицу n × n — по паре объектов. В нормальных уравнениях стоит XᵀX.",
  },
};

export interface Shape {
  rows: number;
  cols: number;
}

export interface Mismatch {
  ok: false;
  /** Номер правого из нестыкующихся множителей. */
  at: number;
  left: Shape;
  right: Shape;
}
export type ChainShape = { ok: true; shape: Shape } | Mismatch | { ok: false; at: -1 };

/** Множители есть, но не стыкуются. */
export const isMismatch = (s: ChainShape): s is Mismatch => !s.ok && "left" in s;

export const factorShape = (level: Level, f: Factor): Shape => {
  const tile = level.tiles[f.tile]!;
  return f.t ? { rows: tile.cols, cols: tile.rows } : { rows: tile.rows, cols: tile.cols };
};

/** Размер произведения или первое место, где множители не стыкуются (at — номер правого множителя). */
export function chainShape(level: Level, chain: readonly Factor[]): ChainShape {
  if (!chain.length) return { ok: false, at: -1 };
  const shapes = chain.map((f) => factorShape(level, f));
  for (let k = 1; k < shapes.length; k++) {
    if (shapes[k - 1]!.cols !== shapes[k]!.rows) return { ok: false, at: k, left: shapes[k - 1]!, right: shapes[k]! };
  }
  return { ok: true, shape: { rows: shapes[0]!.rows, cols: shapes[shapes.length - 1]!.cols } };
}

/** Индексная запись произведения: суммы, свободные индексы и множители с индексами. */
export interface IndexForm {
  free: { letter: string; to: number }[];
  sums: { letter: string; to: number }[];
  terms: { name: string; ones?: boolean; sub: string[] }[];
}

const LETTERS = ["i", "j", "k", "l", "p", "q"];

/**
 * Индексы назначаются по порядку появления в записи: у Aᵀ элемент (p, q) — это A_qp, поэтому у Xᵀy
 * сумма идёт по первому индексу X, как в CS229 (i — номер объекта). Единицы из записи пропадают.
 */
export function indexForm(level: Level, chain: readonly Factor[]): IndexForm | null {
  const shape = chainShape(level, chain);
  if (!shape.ok) return null;
  const shapes = chain.map((f) => factorShape(level, f));
  const sizes: number[] = [];
  const fresh = (size: number) => (size > 1 ? sizes.push(size) - 1 : null);
  const row: (number | null)[] = [fresh(shapes[0]!.rows)];
  const col: (number | null)[] = [];
  shapes.forEach((s, k) => {
    col[k] = fresh(s.cols);
    if (k + 1 < shapes.length) row[k + 1] = col[k] ?? null;
  });
  const freeVars = [row[0] ?? null, col[shapes.length - 1] ?? null].filter((v): v is number => v !== null);
  const termVars = chain.map((f, k) => {
    const tile = level.tiles[f.tile]!;
    const [r, c] = f.t ? [col[k] ?? null, row[k] ?? null] : [row[k] ?? null, col[k] ?? null];
    return { tile, vars: (tile.cols === 1 ? [r] : [r, c]).filter((v): v is number => v !== null) };
  });
  const letter = new Map<number, string>();
  const name = (v: number) => {
    if (!letter.has(v)) letter.set(v, LETTERS[letter.size]!);
    return letter.get(v)!;
  };
  const terms = termVars.filter((t) => !t.tile.ones).map((t) => ({ name: t.tile.name, sub: t.vars.map(name) }));
  // индекс, который остался только у единиц (1ᵀ1), тоже получает букву
  sizes.forEach((_, v) => name(v));
  const isFree = (v: number) => freeVars.includes(v);
  const vars = [...letter.entries()].sort((a, b) => LETTERS.indexOf(a[1]) - LETTERS.indexOf(b[1]));
  return {
    free: freeVars.map((v) => ({ letter: letter.get(v)!, to: sizes[v]! })).sort((a, b) => LETTERS.indexOf(a.letter) - LETTERS.indexOf(b.letter)),
    sums: vars.filter(([v]) => !isFree(v)).map(([v, l]) => ({ letter: l, to: sizes[v]! })),
    terms,
  };
}

/** Запись для тестов и описаний: Σ_{i=1}^{3} x_i y_i. */
export function formText(form: IndexForm): string {
  const sums = form.sums.map((s) => `Σ_{${s.letter}=1}^{${s.to}} `).join("");
  const terms = form.terms.length ? form.terms.map((t) => `${t.name}_${t.sub.join("")}`).join(" ") : "1";
  return sums + terms;
}

/** Запись для скринридера: «сумма по i от 1 до 3: x i, y i». */
export function formSpeech(form: IndexForm): string {
  const sums = form.sums.map((s) => `сумма по ${s.letter} от 1 до ${s.to}`).join(", ");
  const terms = form.terms.length ? form.terms.map((t) => `${t.name} ${t.sub.join(" ")}`).join(" на ") : "единица";
  return sums ? `${sums}: ${terms}` : terms;
}

/** Размер словами: «число», «столбец из 3 чисел», «матрица 3 × 4». */
export const sizeText = (s: Shape) =>
  s.rows === 1 && s.cols === 1 ? "число" : s.cols === 1 ? `столбец из ${s.rows} чисел` : s.rows === 1 ? `строка из ${s.cols} чисел` : `матрица ${s.rows}\u00a0×\u00a0${s.cols}`;
const factorText = (level: Level, f: Factor) => `${level.tiles[f.tile]!.name}${f.t ? "ᵀ" : ""}`;

/** Запись цепочки текстом: xᵀAy. */
export const chainText = (level: Level, chain: readonly Factor[]) => chain.map((f) => factorText(level, f)).join(" ");

/** Почему множители не стыкуются: «У xᵀ столбцов 3, а у A строк 4.» */
export function mismatchText(level: Level, chain: readonly Factor[], shape: Mismatch): string {
  return `У ${factorText(level, chain[shape.at - 1]!)} столбцов ${shape.left.cols}, а у ${factorText(level, chain[shape.at]!)} строк ${shape.right.rows} — не перемножить.`;
}

const transpose = (m: number[][]) => m[0]!.map((_, j) => m.map((r) => r[j]!));
const matmul = (a: number[][], b: number[][]) => a.map((r) => b[0]!.map((_, j) => r.reduce((s, v, k) => s + v * b[k]![j]!, 0)));

export function evaluate(level: Level, chain: readonly Factor[], set: number): number[][] {
  return chain.map((f) => (f.t ? transpose(level.values[set]![f.tile]!) : level.values[set]![f.tile]!)).reduce((a, b) => matmul(a, b));
}

export function verdict(level: Level, chain: readonly Factor[]): Verdict {
  const shape = chainShape(level, chain);
  if (!shape.ok) return shape.at < 0 ? "empty" : "mismatch";
  const target = chainShape(level, level.answer);
  if (!target.ok) throw new Error("ответ уровня не стыкуется");
  if (shape.shape.rows !== target.shape.rows || shape.shape.cols !== target.shape.cols) return "shape";
  const same = level.values.every((_, set) => JSON.stringify(evaluate(level, chain, set)) === JSON.stringify(evaluate(level, level.answer, set)));
  return same ? "ok" : "value";
}

const vec = (name: string, n: number): Tile => ({ name, rows: n, cols: 1 });
const mat = (name: string, rows: number, cols: number): Tile => ({ name, rows, cols });
const ones = (n: number): Tile => ({ name: "1", rows: n, cols: 1, ones: true });

/** Плитки и ответ уровня (без значений): размеры из rng, порядок плиток перемешан. */
function layout(kind: Kind, r: Rng): { tiles: Tile[]; answer: { name: string; t: boolean }[] } {
  const m = r.int(2, 3);
  const k = m + r.int(1, 2);
  const n = r.int(5, 7);
  const d = r.int(2, 4);
  switch (kind) {
    case "dot": {
      const s = r.int(3, 5);
      return { tiles: [vec("x", s), vec("y", s), mat("A", s, s)], answer: [{ name: "x", t: true }, { name: "y", t: false }] };
    }
    case "ones":
      return { tiles: [ones(n), vec("y", n), vec("x", d)], answer: [{ name: "1", t: true }, { name: "y", t: false }] };
    case "matvec":
      return { tiles: [mat("A", m, k), vec("x", k), vec("y", m)], answer: [{ name: "A", t: false }, { name: "x", t: false }] };
    case "bilinear":
      return { tiles: [mat("A", m, k), vec("x", m), vec("y", k)], answer: [{ name: "x", t: true }, { name: "A", t: false }, { name: "y", t: false }] };
    case "outer":
      return { tiles: [vec("x", m), vec("y", k), mat("A", m, k)], answer: [{ name: "x", t: false }, { name: "y", t: true }] };
    case "xty":
      return { tiles: [mat("X", n, d), vec("y", n), vec("θ", d)], answer: [{ name: "X", t: true }, { name: "y", t: false }] };
    case "gram":
      return { tiles: [mat("X", n, d), vec("y", n)], answer: [{ name: "X", t: true }, { name: "X", t: false }] };
  }
}

/** Все цепочки до MAX_CHAIN множителей из плиток уровня (каждая плитка — как есть или транспонированная). */
function allChains(tiles: number): Factor[][] {
  const one = Array.from({ length: tiles }, (_, i) => [{ tile: i, t: false }, { tile: i, t: true }]).flat();
  const out: Factor[][] = [];
  let layer: Factor[][] = one.map((f) => [f]);
  for (let len = 1; len <= MAX_CHAIN; len++) {
    out.push(...layer);
    layer = layer.flatMap((c) => one.map((f) => [...c, f]));
  }
  return out;
}

/**
 * Числа уровня случайно уравнивают ответ с другой цепочкой: например, если в обоих наборах Σ yᵢ = n, то 1ᵀ1
 * «равно» 1ᵀy. Такая цепочка совпадает с ответом на числах уровня, но не на независимых проверочных наборах.
 * Проверочный ГПСЧ свой, от чисел уровня: обычный уровень от проверки не меняется.
 */
function ambiguous(level: Level): boolean {
  const probe = rng(7919 + level.values.flat(3).reduce((s, v, i) => s + v * (i + 1), 0));
  const fresh: Level = { ...level, values: Array.from({ length: 3 }, () => level.tiles.map((t) => Array.from({ length: t.rows }, () => Array.from({ length: t.cols }, () => (t.ones ? 1 : probe.nonzero(-9, 9)))))) };
  return allChains(level.tiles.length).some((chain) => verdict(level, chain) === "ok" && verdict(fresh, chain) !== "ok");
}

export function makeLevel(kind: Kind, r: Rng): Level {
  const { tiles: raw, answer } = layout(kind, r);
  const tiles = r.shuffle(raw);
  const draw = () => tiles.map((t) => Array.from({ length: t.rows }, () => Array.from({ length: t.cols }, () => (t.ones ? 1 : r.nonzero(-5, 5)))));
  const base = { kind, tiles, answer: answer.map((a) => ({ tile: tiles.findIndex((t) => t.name === a.name), t: a.t })) };
  let level: Level = { ...base, values: [draw(), draw()] };
  while (ambiguous(level)) level = { ...base, values: [draw(), draw()] };
  return level;
}


export const sumTranslator: GameSpec<State, Action, Level> & {
  feedback(state: State): string;
  sizeText(shape: Shape): string;
} = {
  id: "nota.sum-translator",
  version: 1,
  concepts: ["nota.sums"],

  init: (level) => ({ level, chain: [], checks: 0, hints: 0, last: null, done: false }),

  step(state, action) {
    if (action.type === "reset") return sumTranslator.init(state.level, undefined as unknown as Rng);
    if (state.done) return state;
    switch (action.type) {
      case "hint":
        return { ...state, hints: state.hints + 1 };
      case "add":
        if (state.chain.length >= MAX_CHAIN || !state.level.tiles[action.tile]) return state;
        return { ...state, chain: [...state.chain, { tile: action.tile, t: false }], last: null };
      case "toggle":
        if (!state.chain[action.at]) return state;
        return { ...state, chain: state.chain.map((f, i) => (i === action.at ? { ...f, t: !f.t } : f)), last: null };
      case "remove":
        if (!state.chain[action.at]) return state;
        return { ...state, chain: state.chain.filter((_, i) => i !== action.at), last: null };
      case "clear":
        return state.chain.length ? { ...state, chain: [], last: null } : state;
      case "check": {
        const v = verdict(state.level, state.chain);
        if (v === "empty") return { ...state, last: v };
        return { ...state, checks: state.checks + 1, last: v, done: v === "ok" };
      }
    }
  },

  status: (s) => (s.done ? "solved" : "playing"),

  /** Точность перевода: 1 — с первой проверки. */
  score: (s) => (s.done ? 1 / Math.max(1, s.checks) : 0),

  describe(s) {
    const target = indexForm(s.level, s.level.answer)!;
    const mine = indexForm(s.level, s.chain);
    const shape = chainShape(s.level, s.chain);
    const built = !s.chain.length
      ? "Запись пуста."
      : `Ваша запись: ${chainText(s.level, s.chain)} — ${shape.ok ? `${sizeText(shape.shape)}, ${formSpeech(mine!)}.` : isMismatch(shape) ? mismatchText(s.level, s.chain, shape) : ""}`;
    return `Задание: ${formSpeech(target)}. ${built}`;
  },

  hint(s) {
    if (s.hints <= 1) return "Индекс, по которому суммируют, связывает соседей: это номер столбца левого множителя и номер строки правого.";
    if (s.hints === 2) return HINTS[s.level.kind];
    return `Ответ: ${chainText(s.level, s.level.answer)}.`;
  },

  generate(rng: Rng, difficulty: number): Level {
    const kind = KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!;
    return makeLevel(kind, rng);
  },

  feedback(s) {
    const target = chainShape(s.level, s.level.answer);
    const goal = target.ok ? sizeText(target.shape) : "";
    const shape = chainShape(s.level, s.chain);
    switch (s.last) {
      case "ok":
        return `Верно: ${chainText(s.level, s.chain)} — та же сумма${s.checks > 1 ? `, с ${s.checks}-й проверки` : ""}.`;
      case "empty":
        return "Запись пуста: добавьте множители кнопками ниже.";
      case "mismatch":
        return isMismatch(shape) ? `${mismatchText(s.level, s.chain, shape)} Транспонируйте множитель или поменяйте порядок.` : "";
      case "shape":
        return shape.ok ? `Получилось: ${sizeText(shape.shape)}, а нужно: ${goal}. Сравните свободные индексы — по ним видно, что должно получиться.` : "";
      case "value":
        return `Размер верный — ${goal}, но сумма другая: сравните индексы у множителей с заданием.`;
      default:
        return `Нужно получить: ${goal}. Соберите произведение и нажмите «Проверить».`;
    }
  },

  sizeText,
};

const HINTS: Record<Kind, string> = {
  dot: "Строка на столбец даёт число. Какой из векторов сделать строкой?",
  ones: "Сумма элементов — скалярное произведение с вектором из единиц.",
  matvec: "Свободный индекс i — номер строки результата. Он должен быть первым индексом первого множителя.",
  bilinear: "Слева нужна строка с индексом i, справа — столбец с индексом j, между ними — матрица.",
  outer: "Суммы нет, оба индекса свободные: результат — матрица. Столбец на строку даёт матрицу.",
  xty: "Суммируют по первому индексу X — по строкам. Чтобы он стал индексом столбца, X нужно транспонировать.",
  gram: "Оба множителя — X, суммирование по строкам. Какой из них транспонировать?",
};
