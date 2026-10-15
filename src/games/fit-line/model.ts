// Игра «Подгони прямую» (уроки 0.1 и V.1): прямая «цена = θ₀ + θ₁ · площадь» через «Квартиры» на глаз.
// Ученик двигает θ₀ и θ₁ и сдаёт ответ; сравнение — по функции потерь J = ½ Σ (yᵢ − ŷᵢ)² с её минимумом.
// Уровни: только наклон (прямая через ноль), наклон и сдвиг (цена с ремонтом: +3 млн), выброс (одна дорогая квартира).
// Числа МНК — модель виджета «Подгонка прямой» (src/widgets/la/fit-line/model.ts); данные — code/mlf/datasets.py.
import type { GameSpec, Rng } from "../_engine/types";
import { leastSquares, loss, type Theta } from "../../widgets/la/fit-line/model";
import data from "./data.json";

export type Kind = "slope" | "both" | "outlier";

export interface Level {
  kind: Kind;
  x: number[];
  y: number[];
  /** Минимум J при правилах уровня (на уровне «наклон» θ₀ = 0). */
  best: Theta;
}

export interface State {
  level: Level;
  theta: Theta;
  /** Сколько раз ученик сдавал ответ и сколько раз двигал бегунки. */
  submits: number;
  moves: number;
  hints: number;
  /** Сданный ответ достаточно близок к минимуму. */
  done: boolean;
}

export type Action = { type: "set"; which: keyof Theta; value: number } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVELS = 3;
/** Шаги бегунков: с ними минимум достижим с точностью лучше 0.5 % (проверяет model.test.ts). */
export const STEP: Theta = { t0: 0.1, t1: 0.002 };
export const RANGE = { t0: [-2, 8], t1: [0, 0.3] } as const;
/** Принимается ответ, у которого J не больше минимума на 5 %. */
export const TOLERANCE = 1.05;
const START: Theta = { t0: 0, t1: 0.05 };

export const KIND_NAMES: Record<Kind, string> = {
  slope: "наклон",
  both: "наклон и сдвиг",
  outlier: "выброс",
};

export const DEBRIEF: Record<Kind, { question: string; answer: string }> = {
  slope: {
    question: "Почему нельзя просто сложить ошибки со знаком и сделать сумму нулём?",
    answer: "Плюсы и минусы гасят друг друга: у очень плохой прямой сумма ошибок тоже может быть нулём. Квадраты не гасятся, поэтому J измеряет, насколько прямая плоха.",
  },
  both: {
    question: "Что делает θ₀ и почему без него прямая не подошла?",
    answer: "θ₀ — сдвиг: цена при нулевой площади. Ремонт добавил к каждой цене одно и то же, и прямая через ноль уже не может пройти рядом со всеми точками.",
  },
  outlier: {
    question: "Почему одна дорогая квартира так сильно тянет прямую?",
    answer: "Ошибка входит в J в квадрате: остаток 10 млн весит как сто остатков по 1 млн. Минимум J готов немного ухудшить все точки ради одной.",
  },
};

const round = (v: number, step: number) => Math.round(v / step) * step;
const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

/** Наклон прямой через ноль: θ₁ = Σxy / Σx². */
function slopeThroughZero(x: readonly number[], y: readonly number[]): Theta {
  const sxy = x.reduce((s, v, i) => s + v * y[i]!, 0);
  const sxx = x.reduce((s, v) => s + v * v, 0);
  return { t0: 0, t1: sxy / sxx };
}

export function makeLevel(kind: Kind, pick: readonly number[] = data.area.map((_, i) => i)): Level {
  const x = pick.map((i) => data.area[i]!);
  let y = pick.map((i) => data.price[i]!);
  if (kind === "both") y = y.map((v) => Math.round((v + 3) * 10) / 10);
  if (kind === "outlier") {
    x.push(60);
    y.push(20);
  }
  return { kind, x, y, best: kind === "slope" ? slopeThroughZero(x, y) : leastSquares(x, y) };
}

export const fmt = (v: number, digits = 2) => (Math.round(v * 10 ** digits) / 10 ** digits).toString().replace("-", "−");

export const fitLine: GameSpec<State, Action, Level> & {
  loss(state: State): number;
  minLoss(state: State): number;
  feedback(state: State): string;
} = {
  id: "ml.fit-line",
  version: 1,
  concepts: ["ml.least-squares"],

  init: (level) => ({ level, theta: { ...START }, submits: 0, moves: 0, hints: 0, done: false }),

  step(state, action) {
    if (action.type === "reset") return fitLine.init(state.level, undefined as unknown as Rng);
    if (state.done) return state;
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (action.type === "set") {
      if (action.which === "t0" && state.level.kind === "slope") return state; // на уровне «наклон» сдвиг закреплён
      const value = clamp(round(action.value, STEP[action.which]), RANGE[action.which]);
      if (value === state.theta[action.which]) return state;
      return { ...state, theta: { ...state.theta, [action.which]: value }, moves: state.moves + 1 };
    }
    const done = fitLine.loss(state) <= TOLERANCE * fitLine.minLoss(state);
    return { ...state, submits: state.submits + 1, done };
  },

  status: (s) => (s.done ? "solved" : "playing"),

  /** Насколько ответ близок к минимуму: J_min / J, 1 — минимум. */
  score: (s) => fitLine.minLoss(s) / Math.max(fitLine.loss(s), 1e-12),

  loss: (s) => loss(s.theta, s.level.x, s.level.y),
  minLoss: (s) => loss(s.level.best, s.level.x, s.level.y),

  describe(s) {
    const ratio = fitLine.loss(s) / fitLine.minLoss(s);
    return `Прямая: цена = ${fmt(s.theta.t0)} + ${fmt(s.theta.t1, 3)} · площадь. Функция потерь J = ${fmt(fitLine.loss(s), 1)}, это в ${fmt(ratio)} раза больше минимума. Точек: ${s.level.x.length}.`;
  },

  hint(s) {
    if (s.hints <= 1) return "Смотрите на вертикальные отрезки от точек до прямой: J — половина суммы их квадратов. Сокращайте самые длинные.";
    if (s.hints === 2) return s.level.kind === "slope" ? "Если почти все точки выше прямой, наклон мал; если ниже — велик." : "Сначала наклон — чтобы точки слева и справа лежали по обе стороны прямой, потом сдвиг — чтобы выше и ниже было поровну.";
    return `Минимум рядом с θ₀ ≈ ${fmt(round(s.level.best.t0, STEP.t0))}, θ₁ ≈ ${fmt(round(s.level.best.t1, STEP.t1), 3)}.`;
  },

  generate(rng: Rng, difficulty: number): Level {
    const kind: Kind = (["slope", "both", "outlier"] as const)[Math.min(Math.max(1, Math.floor(difficulty)), 3) - 1]!;
    // 12 квартир из 16: у каждого seed — своя выборка
    const pick = rng.shuffle(data.area.map((_, i) => i)).slice(0, 12).sort((a, b) => a - b);
    return makeLevel(kind, pick);
  },

  feedback(s) {
    const J = fitLine.loss(s);
    const ratio = J / fitLine.minLoss(s);
    if (s.done) return `Принято: J = ${fmt(J, 1)} — всего в ${fmt(ratio)} раза больше минимума ${fmt(fitLine.minLoss(s), 1)}.`;
    if (s.submits > 0) return `Ещё не минимум: J = ${fmt(J, 1)}, это в ${fmt(ratio)} раза больше наименьшего возможного. Двигайте бегунки дальше.`;
    return `J = ${fmt(J, 1)}. Подвиньте прямую так, чтобы J стало как можно меньше, и нажмите «Сдать прямую».`;
  },
};
