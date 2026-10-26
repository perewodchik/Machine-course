// Игра «Спуск в тумане» (урок II.6): поверхность скрыта, видны только значение функции и стрелка градиента в
// текущей точке. Игрок шагает на 0.5 в одном из восьми направлений и должен дойти до минимума (на уровне
// «подъём» — до максимума) за наименьшее число шагов; у дна помогает короткий шаг 0.2. На уровне «шумный градиент» стрелка — оценка по одному
// объекту, как в SGD. Модель чистая: уровни и шум из rng(seed), без Math.random.
import { rng } from "../../lib/math/rng";
import type { GameSpec, Rng } from "../_engine/types";

export type Sym2 = readonly [number, number, number];
export type Pt = readonly [number, number];
export type LevelKind = "round" | "elongated" | "ascent" | "noisy" | "mixed";

export interface Level {
  kind: LevelKind;
  /** f(x) = s · ½ (x − m)ᵀA(x − m), s = +1 (спуск) или −1 (подъём). */
  A: Sym2;
  m: Pt;
  sign: 1 | -1;
  start: Pt;
  /** Стандартное отклонение шума стрелки (0 — точный градиент). */
  noise: number;
  noiseSeed: number;
}

export interface State {
  level: Level;
  path: Pt[];
  hints: number;
}

export type Action = { type: "move"; dir: number; short?: boolean } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["round", "elongated", "ascent", "noisy", "mixed"];
export const LEVELS = LEVEL_KINDS.length;
export const STEP = 0.5;
/** Короткий шаг — у дна, где длинный перескакивает минимум. */
export const SHORT = 0.2;
export const RADIUS = 0.45;
export const MAX_MOVES = 30;
export const BOX = 4;

/** Восемь направлений против часовой стрелки от «вправо». */
export const DIRS: readonly { d: Pt; name: string; arrow: string }[] = [
  { d: [1, 0], name: "вправо", arrow: "→" },
  { d: [Math.SQRT1_2, Math.SQRT1_2], name: "вправо и вверх", arrow: "↗" },
  { d: [0, 1], name: "вверх", arrow: "↑" },
  { d: [-Math.SQRT1_2, Math.SQRT1_2], name: "влево и вверх", arrow: "↖" },
  { d: [-1, 0], name: "влево", arrow: "←" },
  { d: [-Math.SQRT1_2, -Math.SQRT1_2], name: "влево и вниз", arrow: "↙" },
  { d: [0, -1], name: "вниз", arrow: "↓" },
  { d: [Math.SQRT1_2, -Math.SQRT1_2], name: "вправо и вниз", arrow: "↘" },
];

export const LEVEL_NAMES: Record<LevelKind, string> = {
  round: "круглая чаша",
  elongated: "вытянутая чаша",
  ascent: "подъём к вершине",
  noisy: "шумный градиент",
  mixed: "решите сами",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  round: {
    question: "Куда указывает стрелка градиента и куда нужно идти?",
    answer: "Градиент показывает направление быстрейшего роста. Чтобы спуститься, нужно идти против него: θ := θ − η∇J.",
  },
  elongated: {
    question: "Почему у вытянутой чаши стрелка смотрит не на минимум?",
    answer: "Градиент перпендикулярен линии уровня, а у вытянутых эллипсов нормаль почти никогда не проходит через центр. Спуск идёт зигзагом, и шагов нужно больше, чем по прямой.",
  },
  ascent: {
    question: "Чем подъём отличается от спуска?",
    answer: "Знаком шага: θ := θ + η∇f. Так в CS229 максимизируют логарифм правдоподобия логистической регрессии. Перепутать знаки — значит уйти от ответа.",
  },
  noisy: {
    question: "Можно ли судить о стохастическом спуске по одному шагу?",
    answer: "Нет: стрелка по одному объекту иногда смотрит в сторону, и значение функции может вырасти. В среднем оценка равна настоящему градиенту, поэтому за много шагов спуск всё равно приходит к минимуму.",
  },
  mixed: {
    question: "Что общего у всех уровней?",
    answer: "Шаг против градиента — для спуска, по градиенту — для подъёма. Форма чаши и шум меняют путь, но не правило.",
  },
};

export const value = (l: Level, [x, y]: Pt) => {
  const [a, b, c] = l.A;
  const [u, v] = [x - l.m[0], y - l.m[1]];
  return (l.sign * (a * u * u + 2 * b * u * v + c * v * v)) / 2;
};

export const gradient = (l: Level, [x, y]: Pt): Pt => {
  const [a, b, c] = l.A;
  const [u, v] = [x - l.m[0], y - l.m[1]];
  return [l.sign * (a * u + b * v), l.sign * (b * u + c * v)];
};

/** Стрелка на k-м шаге: градиент плюс шум с seed (уровень, k) — одна и та же при повторе партии. */
export function shownGradient(l: Level, p: Pt, k: number): Pt {
  const g = gradient(l, p);
  if (!l.noise) return g;
  const r = rng(l.noiseSeed * 101 + k);
  // нормальный шум по Боксу — Мюллеру
  const u1 = Math.max(r.next(), 1e-12);
  const u2 = r.next();
  const rad = Math.sqrt(-2 * Math.log(u1)) * l.noise * Math.max(1, Math.hypot(g[0], g[1]));
  return [g[0] + rad * Math.cos(2 * Math.PI * u2), g[1] + rad * Math.sin(2 * Math.PI * u2)];
}

const dist = (p: Pt, q: Pt) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const here = (s: State) => s.path[s.path.length - 1]!;

/** Наименьшее число шагов по восьми направлениям до круга радиуса RADIUS — оценка снизу через расстояние. */
export const ideal = (l: Level) => Math.max(1, Math.ceil((dist(l.start, l.m) - RADIUS) / STEP));

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const k = kind === "mixed" ? r.pick(["elongated", "ascent", "noisy"] as const) : kind;
  const elong = k === "elongated" || kind === "mixed";
  let A: Sym2;
  if (elong) {
    const [l1, l2, t] = [r.pick([3, 4]), 0.4, r.pick([0.4, 0.7, 2.3, 2.7])];
    const [cs, sn] = [Math.cos(t), Math.sin(t)];
    A = [l1 * cs * cs + l2 * sn * sn, (l1 - l2) * cs * sn, l1 * sn * sn + l2 * cs * cs];
  } else A = [1, 0, 1];
  const m: Pt = [r.pick([-1.5, -1, 1, 1.5]), r.pick([-1.5, -1, 1, 1.5])];
  // старт в противоположном углу поля, не ближе 3 к оптимуму
  const start: Pt = [-Math.sign(m[0]) * 3, -Math.sign(m[1]) * r.pick([2, 3])];
  return { kind, A, m, sign: k === "ascent" ? -1 : 1, start, noise: k === "noisy" ? 0.8 : 0, noiseSeed: r.int(1, 1_000_000) };
}

export const reached = (s: State) => dist(here(s), s.level.m) <= RADIUS;
const f2 = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");
const goal = (l: Level) => (l.sign > 0 ? "минимум" : "максимум");

export const foggyDescent: GameSpec<State, Action, Level> & { feedback(state: State): string; arrow(state: State): Pt; moves(state: State): number } = {
  id: "calc.foggy-descent",
  version: 1,
  concepts: ["calc.gradient-descent", "calc.gradient"],

  init: (level) => ({ level, path: [level.start], hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return foggyDescent.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (reached(state) || foggyDescent.moves(state) >= MAX_MOVES) return state;
    const d = DIRS[action.dir]?.d;
    if (!d) return state;
    const [x, y] = here(state);
    const len = action.short ? SHORT : STEP;
    const clamp = (v: number) => Math.min(BOX, Math.max(-BOX, v));
    return { ...state, path: [...state.path, [clamp(x + len * d[0]), clamp(y + len * d[1])]] };
  },

  status: (state) => (reached(state) ? "solved" : "playing"),

  /** Отношение наименьшего возможного числа шагов к сделанному. */
  score: (state) => (reached(state) ? Math.min(1, ideal(state.level) / foggyDescent.moves(state)) : 0),

  describe(state) {
    const p = here(state);
    const g = foggyDescent.arrow(state);
    return `Точка (${f2(p[0])}, ${f2(p[1])}), f = ${f2(value(state.level, p))}, стрелка ${state.level.noise ? "оценки " : ""}градиента (${f2(g[0])}, ${f2(g[1])}). Цель — ${goal(state.level)}. Сделано шагов: ${foggyDescent.moves(state)}.`;
  },

  hint(state) {
    const g = foggyDescent.arrow(state);
    const s = state.level.sign;
    const best = DIRS.map((d, i) => ({ i, v: -s * (d.d[0] * g[0] + d.d[1] * g[1]) })).sort((a, b) => b.v - a.v)[0]!.i;
    if (state.hints <= 1) return s > 0 ? "Стрелка — направление быстрейшего роста. Чтобы спуститься, идите против неё." : "Нужен максимум: идите туда, куда указывает стрелка градиента.";
    return `Ближе всего к ${s > 0 ? "−∇f" : "∇f"} направление «${DIRS[best]!.name}» ${DIRS[best]!.arrow}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  arrow: (state) => shownGradient(state.level, here(state), state.path.length - 1),
  moves: (state) => state.path.length - 1,

  feedback(state) {
    const n = foggyDescent.moves(state);
    if (reached(state)) return `${goal(state.level)[0]!.toUpperCase()}${goal(state.level).slice(1)} найден за ${n} шагов; быстрее не бывает, чем за ${ideal(state.level)}.`;
    if (n >= MAX_MOVES) return `Шаги кончились (${MAX_MOVES}). Начните уровень заново и идите ${state.level.sign > 0 ? "против стрелки" : "по стрелке"}.`;
    if (n === 0) return `Найдите ${goal(state.level)}: выберите направление шага.`;
    const prev = value(state.level, state.path[n - 1]!);
    const now = value(state.level, here(state));
    const better = state.level.sign > 0 ? now < prev : now > prev;
    return `Шаг ${n}: f = ${f2(now)}, ${better ? (state.level.sign > 0 ? "ниже" : "выше") : state.level.sign > 0 ? "выше" : "ниже"}, чем было (${f2(prev)}).`;
  },
};

/** Бот для тестов: шаг в направлении, ближайшем к −s·(показанная стрелка); у дна, где стрелка короткая, — короткий. */
export function greedyMove(state: State): Action {
  const g = foggyDescent.arrow(state);
  const s = state.level.sign;
  const best = DIRS.map((d, i) => ({ i, v: -s * (d.d[0] * g[0] + d.d[1] * g[1]) })).sort((a, b) => b.v - a.v)[0]!.i;
  return { type: "move", dir: best, short: Math.hypot(g[0], g[1]) < 1.5 };
}

/** Бот-оракул: шаг, сильнее всего сокращающий расстояние до оптимума (знает ответ) — доказывает решаемость. */
export function oracleMove(state: State): Action {
  const p = here(state);
  const best = DIRS.map((d, i) => ({ i, v: dist([p[0] + STEP * d.d[0], p[1] + STEP * d.d[1]], state.level.m) })).sort((a, b) => a.v - b.v)[0]!.i;
  return { type: "move", dir: best };
}
