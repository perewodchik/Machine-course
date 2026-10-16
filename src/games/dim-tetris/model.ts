// Игра «Тетрис размерностей» (уроки I.3 и II.3): собрать из матриц-блоков произведение нужной формы.
// Соседние блоки стыкуются, когда число столбцов левого равно числу строк правого; форма произведения —
// строки первого × столбцы последнего. На поздних уровнях блоки можно транспонировать: так собираются
// Xᵀy, XᵀXθ и внешнее произведение uvᵀ. Ход — добавить блок, убрать, сдвинуть или транспонировать.
// Модель чистая: уровни из rng(seed), без Math.random и Date (контракт — src/games/_engine/types.ts).
import type { GameSpec, Rng } from "../_engine/types";
import type { Role } from "../../widgets/_kit";

export type Kind = "pair" | "chain" | "outer" | "gradient" | "normal" | "mixed";

export interface Piece {
  id: string;
  /** Имя на блоке: «X», «θ», «u». */
  name: string;
  rows: number;
  cols: number;
  role: Role;
}

export interface Level {
  kind: Kind;
  pieces: Piece[];
  /** Форма, которую нужно получить: [строки, столбцы]. */
  target: readonly [number, number];
  /** Можно ли транспонировать блоки. */
  allowT: boolean;
  /** Что за произведение собираем — одна фраза для заголовка уровня. */
  story: string;
}

export interface Slot {
  id: string;
  t: boolean;
}

export interface State {
  level: Level;
  chain: Slot[];
  moves: number;
  hints: number;
}

export type Action =
  | { type: "place"; id: string }
  | { type: "remove"; index: number }
  | { type: "move"; index: number; dir: -1 | 1 }
  | { type: "transpose"; index: number }
  | { type: "reset" }
  | { type: "hint" };

export const KINDS: readonly Kind[] = ["pair", "chain", "outer", "gradient", "normal", "mixed"];
export const LEVELS = KINDS.length;

export const KIND_NAMES: Record<Kind, string> = {
  pair: "матрица на вектор",
  chain: "цепочка из трёх",
  outer: "внешнее произведение",
  gradient: "градиент МНК",
  normal: "нормальные уравнения",
  mixed: "решите сами",
};

export const DEBRIEF: Record<Kind, { question: string; answer: string }> = {
  pair: {
    question: "Почему произведение в другом порядке не определено?",
    answer: "Стыкуются внутренние размеры: у Av это столбцы A и строки v. В порядке vA число столбцов v (1) не равно числу строк A.",
  },
  chain: {
    question: "От каких размеров зависит форма произведения цепочки?",
    answer: "Только от крайних: строк первого блока и столбцов последнего. Внутренние размеры должны совпасть попарно и «сокращаются».",
  },
  outer: {
    question: "Чем uwᵀ отличается от uᵀw?",
    answer: "uᵀw — строка на столбец, число 1 × 1 (скалярное произведение). uwᵀ — столбец на строку, целая матрица, у которой все строки пропорциональны: её ранг 1.",
  },
  gradient: {
    question: "Почему в градиенте МНК стоит Xᵀ, а не X?",
    answer: "Градиент по θ — той же формы, что θ: d × 1. Из X (n × d) и y (n × 1) такую форму даёт только Xᵀy: d × n на n × 1.",
  },
  normal: {
    question: "Какой формы матрица XᵀX и почему её можно обращать?",
    answer: "d × d — квадратная, сколько бы ни было объектов. Обратима, когда столбцы X независимы (урок V.1).",
  },
  mixed: {
    question: "С чего начинать сборку?",
    answer: "С краёв: первый блок задаёт число строк ответа, последний — число столбцов. Середину подбирают по совпадению внутренних размеров.",
  },
};

/** «1 ход», «3 хода», «5 ходов». */
export const moves = (k: number) => `${k} ${k % 10 === 1 && k % 100 !== 11 ? "ход" : k % 10 >= 2 && k % 10 <= 4 && (k % 100 < 12 || k % 100 > 14) ? "хода" : "ходов"}`;

export const shapeOf = (p: Piece, t: boolean): readonly [number, number] => (t ? [p.cols, p.rows] : [p.rows, p.cols]);
export const fmtShape = ([r, c]: readonly [number, number]) => `${r} × ${c}`;
export const label = (p: Piece, t: boolean) => (t ? `${p.name}ᵀ` : p.name);

const piece = (level: Level, id: string) => level.pieces.find((p) => p.id === id)!;

/** Стыки цепочки: для каждой пары соседей — совпали ли внутренние размеры. */
export function joints(level: Level, chain: readonly Slot[]): { left: number; right: number; ok: boolean }[] {
  const out: { left: number; right: number; ok: boolean }[] = [];
  for (let i = 1; i < chain.length; i++) {
    const left = shapeOf(piece(level, chain[i - 1]!.id), chain[i - 1]!.t)[1];
    const right = shapeOf(piece(level, chain[i]!.id), chain[i]!.t)[0];
    out.push({ left, right, ok: left === right });
  }
  return out;
}

/** Форма произведения или null, если хоть один стык не сходится. */
export function product(level: Level, chain: readonly Slot[]): readonly [number, number] | null {
  if (!chain.length || joints(level, chain).some((j) => !j.ok)) return null;
  return [shapeOf(piece(level, chain[0]!.id), chain[0]!.t)[0], shapeOf(piece(level, chain.at(-1)!.id), chain.at(-1)!.t)[1]];
}

export const solved = (s: State) => {
  const p = product(s.level, s.chain);
  return p !== null && s.chain.length === s.level.pieces.length && p[0] === s.level.target[0] && p[1] === s.level.target[1];
};

function permutations<T>(xs: readonly T[]): T[][] {
  if (xs.length <= 1) return [xs.slice()];
  return xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((rest) => [x, ...rest]));
}

/** Все решения: порядок блоков и транспонирования (перебор — блоков не больше пяти). */
export function solutions(level: Level): Slot[][] {
  const out: Slot[][] = [];
  const masks = level.allowT ? 2 ** level.pieces.length : 1;
  for (const order of permutations(level.pieces.map((p) => p.id)))
    for (let m = 0; m < masks; m++) {
      const chain = order.map((id, i) => ({ id, t: ((m >> i) & 1) === 1 }));
      const p = product(level, chain);
      if (p && p[0] === level.target[0] && p[1] === level.target[1]) out.push(chain);
    }
  return out;
}

const flips = (chain: readonly Slot[]) => chain.filter((s) => s.t).length;

/** Решение с наименьшим числом транспонирований — его показывают подсказки и собирает бот. */
export const best = (level: Level) => solutions(level).reduce((a, b) => (flips(b) < flips(a) ? b : a));

/** Наименьшее число ходов: поставить каждый блок и транспонировать нужные. */
export const optimalMoves = (level: Level) => level.pieces.length + flips(best(level));

const P = (id: string, name: string, rows: number, cols: number, role: Role): Piece => ({ id, name, rows, cols, role });

export function makeLevel(kind: Kind, r: Rng): Level {
  switch (kind) {
    case "pair": {
      const [m, k] = [r.int(2, 4), r.int(2, 5)];
      const pieces = r.shuffle([P("v", "v", k, 1, "param"), P("A", "A", m, k, "data")]);
      return { kind, pieces, target: [m, 1], allowT: false, story: `Матрица A (${m} × ${k}) умножается на вектор v.` };
    }
    case "chain": {
      const [m, k, l] = [r.int(2, 3), r.int(4, 5), r.int(2, 3)];
      const pieces = r.shuffle([P("A", "A", m, k, "data"), P("B", "B", k, l, "data"), P("C", "C", l, 1, "param")]);
      return { kind, pieces, target: [m, 1], allowT: false, story: "Три блока — одна цепочка. Порядок подберите по размерам." };
    }
    case "outer": {
      const k = r.int(3, 4);
      return { kind, pieces: [P("u", "u", k, 1, "data"), P("w", "w", k, 1, "param")], target: [k, k], allowT: true, story: `Два столбца длины ${k} — а нужна матрица ${k} × ${k}.` };
    }
    case "gradient": {
      const [n, d] = [r.int(5, 6), r.int(2, 3)];
      return { kind, pieces: r.shuffle([P("X", "X", n, d, "data"), P("y", "y", n, 1, "target")]), target: [d, 1], allowT: true, story: `${n} объектов, ${d} признака: соберите вектор формы θ.` };
    }
    case "normal": {
      const [n, d] = [r.int(5, 6), r.int(2, 3)];
      const pieces = r.shuffle([P("X1", "X", n, d, "data"), P("X2", "X", n, d, "data"), P("theta", "θ", d, 1, "param")]);
      return { kind, pieces, target: [d, 1], allowT: true, story: `Левая часть нормальных уравнений: ${n} объектов, ${d} признака.` };
    }
    case "mixed": {
      // случайная цепочка из четырёх блоков с размерами 1–5; часть блоков выдана транспонированными
      for (;;) {
        const dims = [r.int(1, 5), r.int(2, 5), r.int(2, 5), r.int(2, 5), r.int(1, 5)];
        if (new Set(dims.slice(1, 4)).size < 3) continue; // внутренние размеры разные: стыки однозначны
        const names = ["A", "B", "C", "D"];
        const pieces = names.map((name, i) => (r.next() < 0.4 ? P(name, name, dims[i + 1]!, dims[i]!, "data") : P(name, name, dims[i]!, dims[i + 1]!, "data")));
        const level: Level = { kind, pieces: r.shuffle(pieces), target: [dims[0]!, dims[4]!], allowT: true, story: "Четыре блока, некоторые выданы транспонированными." };
        if (solutions(level).length) return level;
      }
    }
  }
}

export const dimTetris: GameSpec<State, Action, Level> & {
  feedback(state: State): string;
  optimal(state: State): number;
} = {
  id: "la.dim-tetris",
  version: 1,
  concepts: ["la.matmul", "la.transpose"],

  init: (level) => ({ level, chain: [], moves: 0, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return dimTetris.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (solved(state)) return state; // уровень решён: поле застыло до перехода
    const chain = state.chain.slice();
    switch (action.type) {
      case "place":
        if (chain.some((s) => s.id === action.id) || !state.level.pieces.some((p) => p.id === action.id)) return state;
        chain.push({ id: action.id, t: false });
        break;
      case "remove":
        if (!chain[action.index]) return state;
        chain.splice(action.index, 1);
        break;
      case "move": {
        const j = action.index + action.dir;
        if (!chain[action.index] || !chain[j]) return state;
        [chain[action.index], chain[j]] = [chain[j]!, chain[action.index]!];
        break;
      }
      case "transpose":
        if (!state.level.allowT || !chain[action.index]) return state;
        chain[action.index] = { ...chain[action.index]!, t: !chain[action.index]!.t };
        break;
    }
    return { ...state, chain, moves: state.moves + 1 };
  },

  status: (state) => (solved(state) ? "solved" : "playing"),

  /** Доля минимума ходов: собрал без лишних перестановок — 1. */
  score: (state) => (solved(state) ? Math.min(1, optimalMoves(state.level) / Math.max(1, state.moves)) : 0),

  describe(state) {
    const { level, chain } = state;
    const tray = level.pieces.filter((p) => !chain.some((s) => s.id === p.id));
    const parts = chain.map((s) => `${label(piece(level, s.id), s.t)} (${fmtShape(shapeOf(piece(level, s.id), s.t))})`);
    const p = product(level, chain);
    return (
      `Цель — ${fmtShape(level.target)}. ` +
      (chain.length ? `Цепочка: ${parts.join(" · ")}${p ? ` = ${fmtShape(p)}` : " — стык не сходится"}. ` : "Цепочка пуста. ") +
      (tray.length ? `Свободные блоки: ${tray.map((q) => `${q.name} (${fmtShape([q.rows, q.cols])})`).join(", ")}.` : "Все блоки в цепочке.")
    );
  },

  hint(state) {
    const { level } = state;
    const first = best(level);
    if (state.hints <= 1) return `Ответ — ${fmtShape(level.target)}: первый блок должен дать ${level.target[0]} строк, последний — ${level.target[1]} столбцов.`;
    if (state.hints === 2) {
      const head = piece(level, first[0]!.id);
      return `Начните с блока ${label(head, first[0]!.t)} (${fmtShape(shapeOf(head, first[0]!.t))}).`;
    }
    return `Ответ: ${first.map((s) => label(piece(level, s.id), s.t)).join(" · ")}.`;
  },

  generate(rng: Rng, difficulty: number): Level {
    const kind = KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!;
    return makeLevel(kind, rng);
  },

  feedback(state) {
    const { level, chain } = state;
    if (solved(state)) {
      const best = optimalMoves(level);
      return state.moves <= best ? `Собрано за ${moves(state.moves)} — это минимум.` : `Собрано за ${moves(state.moves)}; минимум — ${best}.`;
    }
    if (!chain.length) return `Соберите произведение формы ${fmtShape(level.target)} из всех блоков.`;
    const bad = joints(level, chain).findIndex((j) => !j.ok);
    if (bad >= 0) {
      const j = joints(level, chain)[bad]!;
      return `Стык ${bad + 1} не сходится: столбцов у левого блока — ${j.left}, строк у правого — ${j.right}.`;
    }
    const p = product(level, chain)!;
    if (chain.length < level.pieces.length) return `Пока ${fmtShape(p)}. Нужно использовать все блоки.`;
    return `Получилось ${fmtShape(p)}, а нужно ${fmtShape(level.target)}.${level.allowT ? " Попробуйте транспонировать блок." : ""}`;
  },

  optimal: (state) => optimalMoves(state.level),
};

/** Бот для тестов: ставит блоки первого решения и транспонирует нужные. */
export function solve(state: State): Action[] {
  const actions: Action[] = [];
  best(state.level).forEach((s, i) => {
    actions.push({ type: "place", id: s.id });
    if (s.t) actions.push({ type: "transpose", index: i });
  });
  return actions;
}
