// Игра «Попади в точку» (уроки I.1 и I.6): подобрать коэффициенты c₁, c₂ так, чтобы c₁a + c₂b попала в цель,
// или заявить «невозможно», если цель вне линейной оболочки векторов a и b.
// Ход — изменить один коэффициент на шаг. Граничный случай — параллельные a и b: их оболочка — прямая,
// и цель либо на ней (решений бесконечно много), либо нет (ответ — «невозможно»).
// Модель чистая: уровни из rng(seed), без Math.random и Date (контракт — src/games/_engine/types.ts).
import type { GameSpec, Rng } from "../_engine/types";

export type Vec2 = readonly [number, number];
export type Kind = "axes" | "general" | "halves" | "line-in" | "line-out" | "mixed";

export interface Level {
  kind: Kind;
  a: Vec2;
  b: Vec2;
  target: Vec2;
  /** Шаг коэффициента: 1, на уровне «половинки» — 0.5. */
  step: number;
}

export interface State {
  level: Level;
  c: readonly [number, number];
  moves: number;
  hints: number;
  /** Сколько раз ученик заявил «невозможно» там, где попасть можно. */
  wrongClaims: number;
  /** Заявил «невозможно» на уровне, где цель и правда вне оболочки. */
  claimed: boolean;
}

export type Action = { type: "nudge"; k: 0 | 1; dir: 1 | -1 } | { type: "impossible" } | { type: "reset" } | { type: "hint" };

export const KINDS: readonly Kind[] = ["axes", "general", "halves", "line-in", "line-out", "mixed"];
export const LEVELS = KINDS.length;
/** Коэффициенты не выходят за [−LIMIT, LIMIT]. */
export const LIMIT = 4;

export const KIND_NAMES: Record<Kind, string> = {
  axes: "векторы вдоль осей",
  general: "косые векторы",
  halves: "половинки",
  "line-in": "параллельные векторы",
  "line-out": "цель вне прямой",
  mixed: "решите сами",
};

export const DEBRIEF: Record<Kind, { question: string; answer: string }> = {
  axes: {
    question: "Почему коэффициенты здесь видны сразу по координатам цели?",
    answer: "a лежит на оси x, b — на оси y: c₁ отвечает только за первую координату, c₂ — только за вторую.",
  },
  general: {
    question: "Можно ли попасть в любую точку плоскости такими a и b?",
    answer: "Да: a и b не параллельны, их оболочка — вся плоскость. Коэффициенты находятся из системы двух уравнений c₁a + c₂b = t.",
  },
  halves: {
    question: "Почему понадобились дробные коэффициенты?",
    answer: "Целые комбинации a и b дают только узлы косой решётки. Точки между узлами — тоже в оболочке, но с дробными c₁, c₂.",
  },
  "line-in": {
    question: "Сколько здесь решений?",
    answer: "Бесконечно много: b = k·a, поэтому c₁a + c₂b = (c₁ + k c₂)a. Подходит любая пара с нужной суммой c₁ + k c₂.",
  },
  "line-out": {
    question: "Почему попасть нельзя, сколько ни двигай коэффициенты?",
    answer: "a и b параллельны: любая комбинация — это вектор, кратный a. Оболочка — прямая, а цель на ней не лежит.",
  },
  mixed: {
    question: "Как понять заранее, достижима ли цель?",
    answer: "Если a и b не параллельны (det [a b] ≠ 0), достижима любая точка. Если параллельны — только точки прямой, на которой они лежат.",
  },
};

const EPS = 1e-9;
const snap = (v: number, step: number) => Math.round(v / step) * step + 0; // + 0: без −0
export const combo = (a: Vec2, b: Vec2, [c1, c2]: readonly [number, number]): Vec2 => [c1 * a[0] + c2 * b[0] + 0, c1 * a[1] + c2 * b[1] + 0];
export const det2 = (a: Vec2, b: Vec2) => a[0] * b[1] - a[1] * b[0] + 0;
export const near = (p: Vec2, q: Vec2) => Math.abs(p[0] - q[0]) < EPS && Math.abs(p[1] - q[1]) < EPS;

/** Достижима ли цель: a, b не параллельны — всегда; параллельны — если цель на их прямой (и коэффициенты на сетке). */
export function solutions(level: Level): (readonly [number, number])[] {
  const out: (readonly [number, number])[] = [];
  const n = Math.round(LIMIT / level.step);
  for (let i = -n; i <= n; i++)
    for (let j = -n; j <= n; j++) {
      const c = [i * level.step + 0, j * level.step + 0] as const;
      if (near(combo(level.a, level.b, c), level.target)) out.push(c);
    }
  return out;
}

export const reachable = (level: Level) => solutions(level).length > 0;

/** Наименьшее число ходов от (0, 0) до какого-нибудь решения. */
export function optimalMoves(level: Level): number {
  const all = solutions(level);
  if (!all.length) return 0;
  return Math.min(...all.map(([c1, c2]) => Math.round((Math.abs(c1) + Math.abs(c2)) / level.step)));
}

export const hit = (s: State) => near(combo(s.level.a, s.level.b, s.c), s.level.target);

/** Число без хвостов и с минусом «−»: 2, −0.5. */
export const fmtNum = (v: number) => String(Math.round(v * 100) / 100 + 0).replace("-", "−");
export const fmtVec = ([x, y]: Vec2) => `(${fmtNum(x)}, ${fmtNum(y)})`;

const nonzero = (r: Rng, lo: number, hi: number, step = 1) => r.nonzero(lo / step, hi / step) * step;

function independent(r: Rng): [Vec2, Vec2] {
  for (;;) {
    const a: Vec2 = [r.int(-2, 2), r.int(-2, 2)];
    const b: Vec2 = [r.int(-2, 2), r.int(-2, 2)];
    // не параллельны и не вдоль одной оси: иначе уровень совпадёт с первым
    if (det2(a, b) !== 0 && (a[0] * a[1] !== 0 || b[0] * b[1] !== 0)) return [a, b];
  }
}

function parallel(r: Rng): [Vec2, Vec2] {
  const a = r.pick<Vec2>([[1, 1], [1, -1], [2, 1], [1, 2], [1, 0], [0, 1]]);
  const k = r.pick([-1, 2, -2]);
  return r.next() < 0.5 ? [a, [a[0] * k + 0, a[1] * k + 0]] : [[a[0] * k + 0, a[1] * k + 0], a];
}

export function makeLevel(kind: Kind, r: Rng): Level {
  switch (kind) {
    case "axes": {
      const a: Vec2 = [r.pick([1, 2]), 0];
      const b: Vec2 = [0, r.pick([1, 2])];
      const c = [nonzero(r, -2, 2), nonzero(r, -2, 2)] as const;
      return { kind, a, b, target: combo(a, b, c), step: 1 };
    }
    case "general": {
      const [a, b] = independent(r);
      for (;;) {
        const c = [r.int(-2, 2), r.int(-2, 2)] as const;
        const level: Level = { kind, a, b, target: combo(a, b, c), step: 1 };
        if (optimalMoves(level) >= 3) return level;
      }
    }
    case "halves": {
      const [a, b] = independent(r);
      const c = [r.pick([-1.5, -0.5, 0.5, 1.5]), r.pick([-1.5, -0.5, 0.5, 1.5, 1, -1])] as const;
      return { kind, a, b, target: combo(a, b, c), step: 0.5 };
    }
    case "line-in": {
      const [a, b] = parallel(r);
      const s = r.pick([-3, -2, 2, 3]);
      const base = Math.abs(a[0]) + Math.abs(a[1]) <= Math.abs(b[0]) + Math.abs(b[1]) ? a : b;
      return { kind, a, b, target: [base[0] * s + 0, base[1] * s + 0], step: 1 };
    }
    case "line-out": {
      const [a, b] = parallel(r);
      // цель — вне прямой a: сдвиг перпендикулярно
      const s = r.pick([-2, -1, 1, 2]);
      const off = r.pick([1, 2, -1]);
      const target: Vec2 = [a[0] * s - a[1] * off + 0, a[1] * s + a[0] * off + 0];
      return { kind, a, b, target, step: 1 };
    }
    case "mixed":
      return r.next() < 0.5 ? { ...makeLevel("general", r), kind } : { ...makeLevel("line-out", r), kind };
  }
}

/** Область поля: видны начало координат, a, b и цель; клетка квадратная. */
export function viewport(level: Level): { x: [number, number]; y: [number, number]; step: number } {
  const pts = [[0, 0] as Vec2, level.a, level.b, level.target];
  const lo = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))];
  const hi = [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const size = Math.max(6, Math.ceil(Math.max(hi[0]! - lo[0]!, hi[1]! - lo[1]!)) + 2);
  const range = (a: number, b: number): [number, number] => {
    const from = Math.floor((a + b) / 2 - size / 2);
    return [from, from + size];
  };
  return { x: range(lo[0]!, hi[0]!), y: range(lo[1]!, hi[1]!), step: size > 12 ? 2 : 1 };
}

const ok = (s: State) => (reachable(s.level) ? hit(s) : s.claimed);

export const spanHit: GameSpec<State, Action, Level> & {
  feedback(state: State): string;
  optimal(state: State): number;
} = {
  id: "la.span-hit",
  version: 1,
  concepts: ["la.span"],

  init: (level) => ({ level, c: [0, 0], moves: 0, hints: 0, wrongClaims: 0, claimed: false }),

  step(state, action) {
    if (action.type === "reset") return spanHit.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (ok(state)) return state; // уровень решён: поле застыло до перехода
    if (action.type === "impossible") {
      return reachable(state.level) ? { ...state, wrongClaims: state.wrongClaims + 1 } : { ...state, claimed: true };
    }
    const { k, dir } = action;
    const value = Math.max(-LIMIT, Math.min(LIMIT, snap(state.c[k] + dir * state.level.step, state.level.step)));
    if (value === state.c[k]) return state;
    const c: [number, number] = [state.c[0], state.c[1]];
    c[k] = value;
    return { ...state, c, moves: state.moves + 1 };
  },

  status: (state) => (ok(state) ? "solved" : "playing"),

  /** Попадание: доля минимума ходов; «невозможно» — 1. Каждое неверное «невозможно» делит счёт. */
  score(state) {
    if (!ok(state)) return 0;
    const base = reachable(state.level) ? (state.moves === 0 ? 1 : Math.min(1, optimalMoves(state.level) / state.moves)) : 1;
    return base / (1 + state.wrongClaims);
  },

  describe(state) {
    const { level, c } = state;
    const p = combo(level.a, level.b, c);
    return (
      `a = ${fmtVec(level.a)}, b = ${fmtVec(level.b)}, цель ${fmtVec(level.target)}. ` +
      `c₁ = ${fmtNum(c[0])}, c₂ = ${fmtNum(c[1])}: c₁a + c₂b = ${fmtVec(p)}. Ходов: ${state.moves}.`
    );
  },

  hint(state) {
    const { level } = state;
    const par = det2(level.a, level.b) === 0;
    if (state.hints <= 1) return par ? "Сравните a и b: один из них — другой, умноженный на число. Что тогда за множество все их комбинации?" : "Цель = c₁a + c₂b — это два уравнения, по одному на координату.";
    if (state.hints === 2) {
      if (!par) return `Распишите: c₁·${fmtVec(level.a)} + c₂·${fmtVec(level.b)} = ${fmtVec(level.target)}.`;
      return reachable(level) ? "Все комбинации лежат на одной прямой — и цель на ней. Хватит одного из векторов." : "Все комбинации лежат на прямой через a, а цель — нет.";
    }
    const all = solutions(level);
    if (!all.length) return "Ответ: «невозможно».";
    const best = all.reduce((x, y) => (Math.abs(y[0]) + Math.abs(y[1]) < Math.abs(x[0]) + Math.abs(x[1]) ? y : x));
    return `Ответ: c₁ = ${fmtNum(best[0])}, c₂ = ${fmtNum(best[1])}.`;
  },

  generate(rng: Rng, difficulty: number): Level {
    const kind = KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!;
    return makeLevel(kind, rng);
  },

  feedback(state) {
    const { level } = state;
    if (ok(state)) {
      if (!reachable(level)) return "Верно: цель вне оболочки a и b — попасть нельзя.";
      const best = optimalMoves(level);
      return state.moves <= best ? `Попали за ${state.moves} — это минимум.` : `Попали за ${state.moves}; минимум — ${best}.`;
    }
    if (state.wrongClaims > 0 && state.moves === 0) {
      return det2(level.a, level.b) !== 0 ? "Попасть можно: a и b не параллельны, их оболочка — вся плоскость." : "Попасть можно: цель лежит на той же прямой, что a и b.";
    }
    const p = combo(level.a, level.b, state.c);
    return `Сейчас c₁a + c₂b = ${fmtVec(p)}, цель — ${fmtVec(level.target)}.${state.wrongClaims > 0 ? " Цель достижима — ищите коэффициенты." : ""}`;
  },

  optimal: (state) => optimalMoves(state.level),
};

/** Бот для тестов: идёт к ближайшему решению или заявляет «невозможно». */
export function solve(state: State): Action[] {
  const all = solutions(state.level);
  if (!all.length) return [{ type: "impossible" }];
  const best = all.reduce((x, y) => (Math.abs(y[0]) + Math.abs(y[1]) < Math.abs(x[0]) + Math.abs(x[1]) ? y : x));
  const actions: Action[] = [];
  for (const k of [0, 1] as const) {
    const delta = Math.round((best[k] - state.c[k]) / state.level.step);
    for (let i = 0; i < Math.abs(delta); i++) actions.push({ type: "nudge", k, dir: delta > 0 ? 1 : -1 });
  }
  return actions;
}
