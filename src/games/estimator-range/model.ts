// Игра «Тир оценок» (урок IV.2): оценка θ̂ = c·x̄ для среднего θ нормальной выборки размера n с разбросом σ.
// Залп — 200 независимых выборок и 200 оценок-«выстрелов» вокруг мишени θ. Игрок подбирает c бегунком, стреляет
// и сдаёт c. MSE(c) = (c − 1)²θ² + c²σ²/n — смещение² плюс дисперсия; минимум при c* = θ²/(θ² + σ²/n).
// Уровень пройден, если MSE сданного c не больше 1.05 · MSE(c*). Модель чистая: залпы из rng(seed уровня + номер).
import { gauss } from "../../lib/math/correlation";
import { rng } from "../../lib/math/rng";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "sharp" | "few" | "noisy" | "near-zero" | "free";

export interface Level {
  kind: LevelKind;
  theta: number;
  sigma: number;
  n: number;
  seed: number;
}

export interface Volley {
  c: number;
  hits: number[];
  bias2: number;
  variance: number;
  mse: number;
}

export interface State {
  level: Level;
  c: number;
  volleys: Volley[];
  submitted: number | null;
  /** Сданные, но не принятые c: MSE выше лучшей больше чем на 5 %. */
  misses: number[];
  hints: number;
}

export type Action = { type: "set"; c: number } | { type: "shoot" } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["sharp", "few", "noisy", "near-zero", "free"];
export const LEVELS = LEVEL_KINDS.length;
export const SHOTS = 200;
export const C_STEP = 0.01;
export const C_MAX = 1.5;
export const TOL = 1.05;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  sharp: "много данных",
  few: "пять наблюдений",
  noisy: "шумная выборка",
  "near-zero": "мишень у нуля",
  free: "решите сами",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  sharp: {
    question: "Почему здесь лучший c почти равен 1?",
    answer: "Дисперсия x̄ — σ²/n — мала по сравнению с θ², и сжимать оценку незачем: любое смещение (c − 1)θ обходится дороже, чем выигрыш в разбросе. Несмещённая оценка x̄ почти оптимальна.",
  },
  few: {
    question: "Почему при пяти наблюдениях выгодно стрелять «с недолётом»?",
    answer: "Разброс x̄ велик: σ²/n больше θ². Умножение на c < 1 сжимает разброс в c² раз и добавляет смещение (1 − c)θ. Пока выигрыш в дисперсии больше, MSE падает: несмещённая оценка не лучшая.",
  },
  noisy: {
    question: "Как найти лучший c без перебора?",
    answer: "MSE(c) = (c − 1)²θ² + c²σ²/n — парабола по c. Производная равна нулю при c* = θ²/(θ² + σ²/n): чем больше шум относительно сигнала, тем сильнее сжатие.",
  },
  "near-zero": {
    question: "Что делает сжатие, когда истинное θ близко к нулю?",
    answer: "Тянет оценку к нулю — туда, где и так мишень, поэтому смещение почти ничего не стоит, а разброс падает. Так работает регуляризация в CS229: она сжимает веса к нулю и выигрывает на дисперсии.",
  },
  free: {
    question: "Что общего у всех уровней?",
    answer: "Ошибка оценки — смещение² + дисперсия. Сжатие обменивает одно на другое; лучший обмен зависит от соотношения сигнала θ² и шума σ²/n.",
  },
};

/** Теоретическая MSE оценки c·x̄. */
export const mseOf = (l: Level, c: number) => (c - 1) ** 2 * l.theta ** 2 + (c * c * l.sigma ** 2) / l.n;

/** Лучший коэффициент сжатия c* = θ²/(θ² + σ²/n). */
export const bestC = (l: Level) => l.theta ** 2 / (l.theta ** 2 + l.sigma ** 2 / l.n);

const PLAN: Record<Exclude<LevelKind, "free">, (r: Rng) => Pick<Level, "theta" | "sigma" | "n">> = {
  sharp: (r) => ({ theta: r.pick([4, 5, 6]), sigma: r.pick([1.5, 2]), n: r.pick([25, 40]) }),
  few: (r) => ({ theta: r.pick([1, 1.5]), sigma: r.pick([3, 3.5]), n: 5 }),
  noisy: (r) => ({ theta: r.pick([2, 2.5]), sigma: r.pick([4, 5]), n: r.pick([10, 12]) }),
  "near-zero": (r) => ({ theta: r.pick([0.4, 0.5]), sigma: 2, n: r.pick([6, 8]) }),
};

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const k = kind === "free" ? r.pick(["sharp", "few", "noisy", "near-zero"] as const) : kind;
  return { kind, ...PLAN[k](r), seed: r.int(1, 1_000_000_000) };
}

/** Залп: SHOTS выборок по n наблюдений, оценка c·x̄ каждой; эмпирические смещение², дисперсия и MSE. */
export function shoot(l: Level, c: number, index: number): Volley {
  const r = rng(l.seed + 7919 * index);
  const hits = Array.from({ length: SHOTS }, () => {
    let s = 0;
    for (let i = 0; i < l.n; i++) s += l.theta + l.sigma * gauss(r);
    return (c * s) / l.n;
  });
  const m = hits.reduce((a, b) => a + b, 0) / SHOTS;
  const variance = hits.reduce((a, h) => a + (h - m) ** 2, 0) / SHOTS;
  const bias2 = (m - l.theta) ** 2;
  return { c, hits, bias2, variance, mse: bias2 + variance };
}

const clampC = (c: number) => Math.min(C_MAX, Math.max(0, Math.round(c / C_STEP) * C_STEP));
const last = (s: State) => s.volleys[s.volleys.length - 1];
const f2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2).replace("-", "−");

export const estimatorRange: GameSpec<State, Action, Level> & { feedback(state: State): string; canSubmit(state: State): boolean } = {
  id: "stat.estimator-range",
  version: 1,
  concepts: ["stat.estimators"],

  init: (level) => ({ level, c: 1, volleys: [], submitted: null, misses: [], hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return estimatorRange.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.submitted !== null) return state;
    switch (action.type) {
      case "set":
        return { ...state, c: clampC(action.c) };
      case "shoot":
        return { ...state, volleys: [...state.volleys, shoot(state.level, state.c, state.volleys.length)] };
      case "submit": {
        if (!estimatorRange.canSubmit(state)) return state;
        const good = mseOf(state.level, state.c) <= TOL * mseOf(state.level, bestC(state.level));
        return good ? { ...state, submitted: state.c } : { ...state, misses: [...state.misses, state.c] };
      }
    }
  },

  /** Сдать можно коэффициент, которым уже стреляли. */
  canSubmit: (s) => s.submitted === null && last(s)?.c === s.c && s.misses[s.misses.length - 1] !== s.c,

  status: (s) => (s.submitted !== null ? "solved" : "playing"),

  /** Доля лучшей MSE, MSE(c*) / MSE(c) ∈ (0, 1], за вычетом 0.1 за каждую непринятую сдачу. */
  score: (s) => (s.submitted === null ? 0 : Math.max(0, mseOf(s.level, bestC(s.level)) / mseOf(s.level, s.submitted) - 0.1 * s.misses.length)),

  describe(s) {
    const v = last(s);
    return `Мишень θ = ${f2(s.level.theta)}, выборки по ${s.level.n} наблюдений, σ = ${f2(s.level.sigma)}. Коэффициент c = ${f2(s.c)}.${v ? ` Последний залп при c = ${f2(v.c)}: смещение² ${f2(v.bias2)}, дисперсия ${f2(v.variance)}, MSE ${f2(v.mse)}.` : ""}`;
  },

  hint(s) {
    if (s.hints <= 1) return "MSE = смещение² + дисперсия. Уменьшая c, вы сжимаете разброс в c² раз, но промахиваетесь мимо θ на (1 − c)θ. Сравните оба слагаемых после залпа.";
    return `Подсказка точнее: MSE(c) = (c − 1)²θ² + c²σ²/n — парабола по c; здесь θ² = ${f2(s.level.theta ** 2)}, σ²/n = ${f2(s.level.sigma ** 2 / s.level.n)}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const best = mseOf(s.level, bestC(s.level));
    if (s.submitted !== null) return `Сдан c = ${f2(s.submitted)}: MSE ${f2(mseOf(s.level, s.submitted))}, лучшая возможная ${f2(best)} при c* = ${f2(bestC(s.level))}. Попадание!`;
    const miss = s.misses[s.misses.length - 1];
    if (miss === s.c) return `c = ${f2(miss)} не принят: его MSE ${f2(mseOf(s.level, miss))} больше лучшей возможной более чем на 5 %. Сравните смещение² и дисперсию последнего залпа и сдвиньте c.`;
    const v = last(s);
    if (!v) return "Выберите c и сделайте залп из 200 выстрелов.";
    if (v.c !== s.c) return `Коэффициент изменён на c = ${f2(s.c)} — сделайте залп, чтобы проверить его.`;
    return `c = ${f2(v.c)}: смещение² ${f2(v.bias2)} + дисперсия ${f2(v.variance)} = MSE ${f2(v.mse)}. Можно сдать или попробовать другой c.`;
  },
};

/** Бот для тестов: c* на сетке бегунка, залп, сдача. */
export function solve(state: State): Action[] {
  return [{ type: "set", c: bestC(state.level) }, { type: "shoot" }, { type: "submit" }];
}
