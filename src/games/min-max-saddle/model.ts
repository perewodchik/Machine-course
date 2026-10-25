// Игра «Минимум, максимум или седло» (урок II.4): в критической точке функция ведёт себя как ½ hᵀHh. На каждом
// уровне — четыре карточки с гессианом H; нужно назвать тип точки. Сначала по картинке линий уровня, потом только
// по числам — по знакам собственных значений, следу и определителю; последний уровень — с вырожденным гессианом.
// Модель чистая: карточки из rng(seed), без Math.random и Date.
import type { GameSpec, Rng } from "../_engine/types";

export type Kind = "min" | "max" | "saddle" | "degenerate";
export type Sym2 = readonly [number, number, number]; // H = [[a, b], [b, c]]

export interface Card {
  H: Sym2;
  kind: Kind;
  picture: boolean;
}

export type LevelKind = "picture-axes" | "picture-rotated" | "numbers" | "degenerate" | "mixed";

export interface Level {
  kind: LevelKind;
  cards: Card[];
}

export interface State {
  level: Level;
  index: number;
  /** Ответ на каждую карточку: верно ли с первого раза. */
  answers: boolean[];
  last: { chosen: Kind; correct: boolean } | null;
  hints: number;
}

export type Action = { type: "answer"; kind: Kind } | { type: "next" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["picture-axes", "picture-rotated", "numbers", "degenerate", "mixed"];
export const LEVELS = LEVEL_KINDS.length;
export const CARDS = 4;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  "picture-axes": "по картинке",
  "picture-rotated": "повёрнутые оси",
  numbers: "только числа",
  degenerate: "вырожденный гессиан",
  mixed: "решите сами",
};

export const KIND_NAMES: Record<Kind, string> = { min: "минимум", max: "максимум", saddle: "седло", degenerate: "по гессиану не определить" };

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  "picture-axes": {
    question: "Как по линиям уровня отличить седло от минимума?",
    answer: "У минимума и максимума линии уровня — вложенные эллипсы вокруг точки. У седла — гиперболы: вдоль одной оси функция растёт, вдоль другой убывает.",
  },
  "picture-rotated": {
    question: "Что меняется, когда оси эллипсов наклонены?",
    answer: "Ничего по существу: оси — собственные векторы H, а тип точки решают знаки собственных значений, а не элементы матрицы по отдельности.",
  },
  numbers: {
    question: "Как классифицировать точку по H 2 × 2 без собственных значений?",
    answer: "det H = λ₁λ₂, tr H = λ₁ + λ₂. det > 0 — одного знака: минимум при tr > 0, максимум при tr < 0. det < 0 — разных знаков: седло.",
  },
  degenerate: {
    question: "Почему при det H = 0 гессиан не даёт ответа?",
    answer: "Одно собственное значение — ноль: вдоль этого направления квадратичная часть не меняется, и всё решают члены третьего и четвёртого порядка. Например, x⁴ и −x⁴ дают минимум и максимум с одинаковым H = 0.",
  },
  mixed: {
    question: "Что общего у всех четырёх правил?",
    answer: "H ≻ 0 — минимум, H ≺ 0 — максимум, собственные значения разных знаков — седло, есть нулевое — гессиан ничего не решает.",
  },
};

export const det = ([a, b, c]: Sym2) => a * c - b * b;
export const trace = ([a, , c]: Sym2) => a + c;

export function classify(H: Sym2): Kind {
  const d = det(H);
  if (Math.abs(d) < 1e-12) return "degenerate";
  if (d < 0) return "saddle";
  return trace(H) > 0 ? "min" : "max";
}

/** Собственные значения λ₁ ≥ λ₂. */
export function eigs([a, b, c]: Sym2): readonly [number, number] {
  const m = (a + c) / 2;
  const r = Math.hypot((a - c) / 2, b);
  return [m + r, m - r];
}

function cardOf(r: Rng, kind: Kind, rotated: boolean, picture: boolean): Card {
  for (;;) {
    let H: Sym2;
    if (kind === "degenerate") {
      const [p, q] = rotated ? [r.nonzero(-2, 2), r.nonzero(-2, 2)] : r.pick([[1, 0], [0, 1]] as const);
      const s = r.pick([1, -1]);
      H = [s * p * p, s * p * q, s * q * q];
    } else {
      const b = rotated ? r.nonzero(-2, 2) : 0;
      const [a, c] = [r.nonzero(-3, 3), r.nonzero(-3, 3)];
      H = [a, b, c];
    }
    if (classify(H) === kind) return { H, kind, picture };
  }
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const plan: Record<LevelKind, { kinds: Kind[]; rotated: boolean; picture: boolean }> = {
    "picture-axes": { kinds: ["min", "max", "saddle", "saddle"], rotated: false, picture: true },
    "picture-rotated": { kinds: ["min", "max", "saddle", "min"], rotated: true, picture: true },
    numbers: { kinds: ["min", "max", "saddle", "saddle"], rotated: true, picture: false },
    degenerate: { kinds: ["degenerate", "min", "degenerate", "saddle"], rotated: true, picture: false },
    mixed: { kinds: [r.pick(["min", "max"] as const), "saddle", "degenerate", r.pick(["min", "max", "saddle"] as const)], rotated: true, picture: false },
  };
  const p = plan[kind];
  return { kind, cards: r.shuffle(p.kinds).map((k) => cardOf(r, k, p.rotated, p.picture)) };
}

const f2 = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");
const hText = ([a, b, c]: Sym2) => `H = (${f2(a)} ${f2(b)}; ${f2(b)} ${f2(c)})`;

/** Разбор ответа: что говорят знаки. */
export function explain(card: Card): string {
  const [l1, l2] = eigs(card.H);
  const d = det(card.H);
  const t = trace(card.H);
  const head = `det H = ${f2(d)}, tr H = ${f2(t)}; собственные значения ${f2(l1)} и ${f2(l2)}.`;
  switch (card.kind) {
    case "min":
      return `${head} Оба положительны: H ≻ 0, во всех направлениях функция растёт — минимум.`;
    case "max":
      return `${head} Оба отрицательны: H ≺ 0, во всех направлениях функция убывает — максимум.`;
    case "saddle":
      return `${head} Знаки разные: вдоль одного собственного вектора функция растёт, вдоль другого убывает — седло.`;
    case "degenerate":
      return `${head} Одно собственное значение — ноль: вдоль этого направления решают члены выше второго порядка.`;
  }
}

const done = (s: State) => s.answers.length === s.level.cards.length && s.last === null;

export const minMaxSaddle: GameSpec<State, Action, Level> & { feedback(state: State): string; current(state: State): Card | undefined } = {
  id: "calc.min-max-saddle",
  version: 1,
  concepts: ["calc.stationary-point", "la.psd"],

  init: (level) => ({ level, index: 0, answers: [], last: null, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return minMaxSaddle.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (done(state)) return state;
    const card = state.level.cards[state.index]!;
    if (action.type === "answer") {
      if (state.last) return state; // ответ на эту карточку уже дан
      const correct = action.kind === card.kind;
      return { ...state, answers: [...state.answers, correct], last: { chosen: action.kind, correct } };
    }
    // next
    if (!state.last) return state;
    return { ...state, index: Math.min(state.index + 1, state.level.cards.length - 1), last: null };
  },

  status: (state) => (done(state) ? "solved" : "playing"),

  /** Доля карточек, распознанных с первого раза. */
  score: (state) => (state.answers.length ? state.answers.filter(Boolean).length / state.level.cards.length : 0),

  describe(state) {
    const card = minMaxSaddle.current(state);
    if (!card) return `Уровень пройден: верно ${state.answers.filter(Boolean).length} из ${state.level.cards.length}.`;
    return `Карточка ${state.index + 1} из ${state.level.cards.length}: ${hText(card.H)}${card.picture ? ", на рисунке — линии уровня ½ hᵀHh" : ""}. Что это за критическая точка?`;
  },

  hint(state) {
    const card = minMaxSaddle.current(state);
    if (!card) return "Уровень пройден.";
    if (state.hints <= 1) return card.picture ? "Эллипсы вокруг точки — экстремум, гиперболы — седло. Растёт или убывает функция от центра — видно по подписям уровней." : "Посмотрите на det H: если он отрицателен, собственные значения разных знаков.";
    return explain(card);
  },

  generate: (rng, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, rng),

  current: (state) => (done(state) ? undefined : state.level.cards[state.index]),

  feedback(state) {
    if (done(state)) {
      const right = state.answers.filter(Boolean).length;
      return `Уровень пройден: верно с первого раза ${right} из ${state.level.cards.length}.`;
    }
    const card = state.level.cards[state.index]!;
    if (!state.last) return `Карточка ${state.index + 1} из ${state.level.cards.length}. ${card.picture ? "Посмотрите на линии уровня." : "Решите по числам."}`;
    return `${state.last.correct ? "Верно" : `Неверно: это ${KIND_NAMES[card.kind]}`}. ${explain(card)}`;
  },
};

/** Бот для тестов: ответить по классификации, перейти к следующей карточке. */
export function solve(state: State): Action[] {
  return state.level.cards.flatMap((c) => [{ type: "answer", kind: classify(c.H) }, { type: "next" }] as Action[]);
}
