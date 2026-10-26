// Игра «Скульптор Σ» (урок III.11): подогнать эллипс N(μ, Σ) под облако из 150 точек. Бегунки — σ₁, σ₂, ρ,
// на поздних уровнях и μ; «Проверить» считает KL(облако ‖ догадка) — расхождение между гауссианой с выборочными
// μ̂, Σ̂ и гауссианой игрока. Уровень пройден при KL ≤ 0.05. Модель чистая: облака из rng(seed).
import { fit2, kl2, sample2, sigmaOf, type Sym2, type Vec2 } from "../../lib/math/gauss2";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "axes" | "tilt" | "strong" | "shift" | "free";
export type Param = "m1" | "m2" | "s1" | "s2" | "rho";

export interface Level {
  kind: LevelKind;
  points: Vec2[];
  /** Выборочные оценки — цель подгонки. */
  mu: Vec2;
  S: Sym2;
  /** Какие бегунки доступны; остальные зафиксированы на начальных значениях. */
  params: Param[];
}

export type Guess = Record<Param, number>;

export interface State {
  level: Level;
  guess: Guess;
  checks: number[];
  solved: boolean;
  hints: number;
}

export type Action = { type: "set"; param: Param; value: number } | { type: "check" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["axes", "tilt", "strong", "shift", "free"];
export const LEVELS = LEVEL_KINDS.length;
export const N = 150;
export const TOL = 0.05;

export const RANGES: Record<Param, { min: number; max: number; step: number }> = {
  m1: { min: -3, max: 3, step: 0.1 },
  m2: { min: -3, max: 3, step: 0.1 },
  s1: { min: 0.3, max: 3, step: 0.05 },
  s2: { min: 0.3, max: 3, step: 0.05 },
  rho: { min: -0.95, max: 0.95, step: 0.01 },
};

export const LEVEL_NAMES: Record<LevelKind, string> = {
  axes: "оси вдоль координат",
  tilt: "наклон",
  strong: "сильная связь",
  shift: "сдвинутый центр",
  free: "решите сами",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  axes: {
    question: "Что задают σ₁ и σ₂, когда ρ = 0?",
    answer: "Полуоси эллипса уровня 1 вдоль осей координат: эллипс проходит через μ ± σ₁ по горизонтали и μ ± σ₂ по вертикали. Около 39 % точек двумерного нормального лежат внутри него, внутри эллипса уровня 2 — около 86 %.",
  },
  tilt: {
    question: "Почему ρ наклоняет эллипс, а не меняет его размер по осям?",
    answer: "σ₁ и σ₂ по-прежнему задают проекции разброса на оси, а ρ — вклад Σ₁₂ = ρσ₁σ₂. Оси эллипса — собственные векторы Σ, и при ρ ≠ 0 они поворачиваются от осей координат.",
  },
  strong: {
    question: "Что происходит с эллипсом при |ρ| → 1?",
    answer: "Он сплющивается к прямой: λ₂ → 0, det Σ = σ₁²σ₂²(1 − ρ²) → 0. В пределе Σ вырождена, и плотности нет — все точки на прямой.",
  },
  shift: {
    question: "Какую оценку μ даёт максимум правдоподобия?",
    answer: "Выборочное среднее: центр эллипса — центр масс облака. Ковариация — среднее (x⁽ⁱ⁾ − μ̂)(x⁽ⁱ⁾ − μ̂)ᵀ. Именно так GDA в CS229 оценивает μ и Σ каждого класса.",
  },
  free: {
    question: "Как подгонять эллипс быстрее всего?",
    answer: "Центр — в центр облака, потом σ₁ и σ₂ — по разбросу проекций на оси, последним ρ — по наклону. Параметры почти независимы, поэтому их можно подбирать по одному.",
  },
};

const PLAN: Record<LevelKind, { params: Param[]; mu: boolean }> = {
  axes: { params: ["s1", "s2"], mu: false },
  tilt: { params: ["s1", "s2", "rho"], mu: false },
  strong: { params: ["s1", "s2", "rho"], mu: false },
  shift: { params: ["m1", "m2", "s1", "s2", "rho"], mu: true },
  free: { params: ["m1", "m2", "s1", "s2", "rho"], mu: true },
};

const START: Guess = { m1: 0, m2: 0, s1: 1, s2: 1, rho: 0 };

export function makeLevel(kind: LevelKind, r: Rng): Level {
  // облако, которое начальная догадка уже описывает, перегенерируем: подгонять должно быть что
  for (;;) {
    const level = drawLevel(kind, r);
    if (divergence(level, START) > 0.3) return level;
  }
}

function drawLevel(kind: LevelKind, r: Rng): Level {
  const plan = PLAN[kind];
  const s1 = r.pick([0.6, 1, 1.5, 2]);
  const s2 = r.pick([0.5, 0.8, 1.2, 1.8]);
  const rho = kind === "axes" ? 0 : kind === "strong" ? r.pick([-0.9, -0.85, 0.85, 0.9]) : r.pick([-0.6, -0.4, 0.4, 0.6]);
  const mu: Vec2 = plan.mu ? [r.pick([-1.5, -1, 1, 1.5]), r.pick([-1.5, -1, 1, 1.5])] : [0, 0];
  const points = sample2(r, mu, sigmaOf(s1, s2, rho), N);
  const fit = fit2(points);
  // на уровне «оси» ρ зафиксирован нулём: цель — гауссиана с выборочными дисперсиями и нулевой ковариацией
  const S: Sym2 = kind === "axes" ? [fit.S[0], 0, fit.S[2]] : fit.S;
  const target: Vec2 = plan.mu ? fit.mu : [0, 0];
  return { kind, points: plan.mu ? points : points.map(([x, y]) => [x - fit.mu[0], y - fit.mu[1]] as const), mu: target, S, params: plan.params };
}


const snap = (p: Param, v: number) => {
  const { min, max, step } = RANGES[p];
  return Math.min(max, Math.max(min, Math.round(v / step) * step));
};

export const guessSigma = (g: Guess): Sym2 => sigmaOf(g.s1, g.s2, g.rho);
export const divergence = (level: Level, g: Guess) => kl2(level.mu, level.S, [g.m1, g.m2], guessSigma(g));

const f2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2).replace("-", "−");

/** Что сильнее всего портит подгонку: подсказка игроку. */
function worst(level: Level, g: Guess): string {
  const t = { s1: Math.sqrt(level.S[0]), s2: Math.sqrt(level.S[2]), rho: level.S[1] / Math.sqrt(level.S[0] * level.S[2]) };
  const errs: [string, number][] = [
    ["центр", level.params.includes("m1") ? Math.hypot(g.m1 - level.mu[0], g.m2 - level.mu[1]) / Math.sqrt(level.S[0] + level.S[2]) : 0],
    [g.s1 > t.s1 ? "разброс по x₁ великоват" : "разброс по x₁ маловат", Math.abs(Math.log(g.s1 / t.s1))],
    [g.s2 > t.s2 ? "разброс по x₂ великоват" : "разброс по x₂ маловат", Math.abs(Math.log(g.s2 / t.s2))],
    [g.rho > t.rho ? "наклон слишком положительный" : "наклон слишком отрицательный", level.params.includes("rho") ? Math.abs(g.rho - t.rho) : 0],
  ];
  return errs.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

export const sigmaSculptor: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "prob.sigma-sculptor",
  version: 1,
  concepts: ["prob.multivariate-normal"],

  init: (level) => ({ level, guess: { ...START }, checks: [], solved: false, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return sigmaSculptor.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.solved) return state;
    if (action.type === "set") {
      if (!state.level.params.includes(action.param)) return state;
      return { ...state, guess: { ...state.guess, [action.param]: snap(action.param, action.value) } };
    }
    const kl = divergence(state.level, state.guess);
    return { ...state, checks: [...state.checks, kl], solved: kl <= TOL };
  },

  status: (state) => (state.solved ? "solved" : "playing"),
  /** Чем ближе подгонка, тем выше: 1 − KL/TOL·½ при сдаче, с поправкой на число проверок. */
  score: (state) => (state.solved ? Math.max(0, 1 - state.checks[state.checks.length - 1]! / (2 * TOL)) / Math.max(1, state.checks.length / 3) : 0),

  describe(state) {
    const g = state.guess;
    return `Облако из ${N} точек. Догадка: μ = (${f2(g.m1)}, ${f2(g.m2)}), σ₁ = ${f2(g.s1)}, σ₂ = ${f2(g.s2)}, ρ = ${f2(g.rho)}.${state.checks.length ? ` Последняя проверка: KL = ${f2(state.checks[state.checks.length - 1]!)}.` : ""}`;
  },

  hint(state) {
    if (state.hints <= 1) return "Эллипс уровня 1 проходит через μ ± σ₁ по горизонтали и μ ± σ₂ по вертикали, если ρ = 0; внутри него — примерно 39 % точек, внутри внешнего — 86 %.";
    return `Сильнее всего мешает: ${worst(state.level, state.guess)}.`;
  },

  generate: (rng, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, rng),

  feedback(state) {
    const last = state.checks[state.checks.length - 1];
    if (last === undefined) return "Подгоните эллипс под облако бегунками и нажмите «Проверить».";
    if (state.solved) return `KL = ${f2(last)} ≤ ${TOL}: эллипс совпал с облаком.`;
    return `KL = ${f2(last)} — больше ${TOL}. ${worst(state.level, state.guess)[0]!.toUpperCase()}${worst(state.level, state.guess).slice(1)}.`;
  },
};

/** Бот для тестов: выставить выборочные оценки (с округлением бегунков) и проверить. */
export function solve(state: State): Action[] {
  const { mu, S, params } = state.level;
  const want: Guess = { m1: mu[0], m2: mu[1], s1: Math.sqrt(S[0]), s2: Math.sqrt(S[2]), rho: S[1] / Math.sqrt(S[0] * S[2]) };
  return [...params.map((p) => ({ type: "set", param: p, value: want[p] }) as Action), { type: "check" }];
}
