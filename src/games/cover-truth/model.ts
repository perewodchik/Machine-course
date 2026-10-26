// Игра «Покрой истину» (урок IV.8★): доверительный интервал x̄ ± z·se для среднего μ. Залп — 100 выборок и 100
// интервалов; видно, сколько из них накрыли μ. Игрок подбирает множитель z и сдаёт его. Настоящее покрытие z
// считается по 4000 скрытым выборкам; уровень пройден, если оно отличается от заданного уровня доверия не больше
// чем на 1.5 процентного пункта. Непринятая сдача не закрывает уровень. Модель чистая: залпы из rng(seed + номер).
import { gauss } from "../../lib/math/correlation";
import { rng } from "../../lib/math/rng";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "known" | "ninety" | "five" | "skewed" | "free";

export interface Level {
  kind: LevelKind;
  mu: number;
  sigma: number;
  n: number;
  /** Уровень доверия: 0.95 или 0.9. */
  conf: number;
  /** σ известна (se = σ/√n) или оценивается по выборке (se = s/√n). */
  known: boolean;
  dist: "normal" | "exponential";
  seed: number;
}

export interface Interval {
  lo: number;
  hi: number;
  covers: boolean;
}

export interface Volley {
  z: number;
  intervals: Interval[];
  covered: number;
}

export interface State {
  level: Level;
  z: number;
  volleys: Volley[];
  submitted: number | null;
  misses: number[];
  hints: number;
}

export type Action = { type: "set"; z: number } | { type: "draw" } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["known", "ninety", "five", "skewed", "free"];
export const LEVELS = LEVEL_KINDS.length;
export const PER_VOLLEY = 100;
export const HIDDEN = 4000;
export const Z = { min: 0.5, max: 4, step: 0.01 };
export const TOL = 0.015;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  known: "σ известна",
  ninety: "уровень 90 %",
  five: "пять наблюдений",
  skewed: "скошенные данные",
  free: "решите сами",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  known: {
    question: "Что означает «95-процентный интервал»?",
    answer: "Процедура: если повторять опыт много раз, 95 % построенных интервалов накроют μ. Про один построенный интервал нельзя сказать, что μ лежит в нём с вероятностью 95 %: μ — не случайная величина, случайны концы интервала.",
  },
  ninety: {
    question: "Почему для 90 % нужен меньший множитель?",
    answer: "По ЦПТ (x̄ − μ)/(σ/√n) ≈ N(0, 1), и P(|Z| ≤ z) = 0.9 при z ≈ 1.645. Чем меньше требуемое покрытие, тем уже интервал: точность и надёжность обмениваются друг на друга.",
  },
  five: {
    question: "Почему при пяти наблюдениях 1.96 мало?",
    answer: "σ неизвестна, и в se стоит выборочное s, которое само случайно и часто занижает разброс. Статистика (x̄ − μ)/(s/√n) имеет распределение Стьюдента с n − 1 степенями свободы — его хвосты тяжелее нормальных, для n = 5 нужен множитель около 2.78.",
  },
  skewed: {
    question: "Почему для скошенных данных множитель приходится увеличивать?",
    answer: "ЦПТ — приближение: при n = 8 распределение x̄ ещё скошено, а s коррелирует с x̄. Интервал «по нормальной таблице» накрывает реже обещанного. Помогают больше данных или бутстрэп.",
  },
  free: {
    question: "Как проверить, что процедура интервала честная?",
    answer: "Моделированием, как в этой игре: сгенерировать много выборок с известным μ и посчитать долю интервалов, накрывших μ. Это и есть определение уровня доверия.",
  },
};

const PLAN: Record<Exclude<LevelKind, "free">, (r: Rng) => Omit<Level, "kind" | "seed">> = {
  known: (r) => ({ mu: r.pick([3, 5, 8]), sigma: r.pick([2, 3]), n: r.pick([20, 25]), conf: 0.95, known: true, dist: "normal" }),
  ninety: (r) => ({ mu: r.pick([3, 5, 8]), sigma: r.pick([2, 3]), n: r.pick([20, 25]), conf: 0.9, known: true, dist: "normal" }),
  five: (r) => ({ mu: r.pick([3, 5, 8]), sigma: r.pick([2, 3]), n: 5, conf: 0.95, known: false, dist: "normal" }),
  skewed: (r) => {
    const mu = r.pick([2, 4]);
    return { mu, sigma: mu, n: 8, conf: 0.95, known: false, dist: "exponential" };
  },
};

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const k = kind === "free" ? r.pick(["known", "ninety", "five", "skewed"] as const) : kind;
  return { kind, ...PLAN[k](r), seed: r.int(1, 1_000_000_000) };
}

/** Одна выборка: x̄ и стандартная ошибка se. */
function sample(l: Level, r: Rng): { mean: number; se: number } {
  const xs = Array.from({ length: l.n }, () => (l.dist === "normal" ? l.mu + l.sigma * gauss(r) : -l.mu * Math.log(1 - r.next())));
  const mean = xs.reduce((a, b) => a + b, 0) / l.n;
  const s = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / (l.n - 1));
  return { mean, se: (l.known ? l.sigma : s) / Math.sqrt(l.n) };
}

/** Залп: PER_VOLLEY интервалов x̄ ± z·se. */
export function draw(l: Level, z: number, index: number): Volley {
  const r = rng(l.seed + 7919 * (index + 1));
  const intervals = Array.from({ length: PER_VOLLEY }, () => {
    const { mean, se } = sample(l, r);
    return { lo: mean - z * se, hi: mean + z * se, covers: Math.abs(mean - l.mu) <= z * se };
  });
  return { z, intervals, covered: intervals.filter((i) => i.covers).length };
}

// |x̄ − μ|/se по скрытым выборкам — один раз на уровень: покрытие z — доля значений не больше z
const hiddenCache = new WeakMap<Level, Float64Array>();
function hidden(l: Level): Float64Array {
  let t = hiddenCache.get(l);
  if (!t) {
    const r = rng(l.seed);
    t = Float64Array.from({ length: HIDDEN }, () => {
      const { mean, se } = sample(l, r);
      return Math.abs(mean - l.mu) / se;
    }).sort();
    hiddenCache.set(l, t);
  }
  return t;
}

/** Настоящее покрытие процедуры x̄ ± z·se (по скрытым выборкам). */
export function coverage(l: Level, z: number): number {
  const t = hidden(l);
  let lo = 0;
  let hi = t.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (t[m]! <= z) lo = m + 1;
    else hi = m;
  }
  return lo / t.length;
}

/** Множитель с покрытием ровно conf на сетке бегунка. */
export function bestZ(l: Level): number {
  const t = hidden(l);
  return clampZ(t[Math.ceil(l.conf * t.length) - 1]!);
}

const clampZ = (z: number) => Math.min(Z.max, Math.max(Z.min, Math.round(z / Z.step) * Z.step));
const last = (s: State) => s.volleys[s.volleys.length - 1];
const f2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
const pct = (x: number) => `${(Math.round(x * 1000) / 10).toFixed(1)} %`;
const good = (l: Level, z: number) => Math.abs(coverage(l, z) - l.conf) <= TOL;

export const coverTruth: GameSpec<State, Action, Level> & { feedback(state: State): string; canSubmit(state: State): boolean } = {
  id: "stat.cover-truth",
  version: 1,
  concepts: ["stat.intervals-tests"],

  init: (level) => ({ level, z: 1, volleys: [], submitted: null, misses: [], hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return coverTruth.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.submitted !== null) return state;
    switch (action.type) {
      case "set":
        return { ...state, z: clampZ(action.z) };
      case "draw":
        return { ...state, volleys: [...state.volleys, draw(state.level, state.z, state.volleys.length)] };
      case "submit": {
        if (!coverTruth.canSubmit(state)) return state;
        return good(state.level, state.z) ? { ...state, submitted: state.z } : { ...state, misses: [...state.misses, state.z] };
      }
    }
  },

  /** Сдать можно множитель, с которым уже строили интервалы. */
  canSubmit: (s) => s.submitted === null && last(s)?.z === s.z && s.misses[s.misses.length - 1] !== s.z,

  status: (s) => (s.submitted !== null ? "solved" : "playing"),

  /** 1 − |покрытие − уровень|/TOL, за вычетом 0.1 за каждую непринятую сдачу и 0.02 за каждый залп после пятого. */
  score: (s) => (s.submitted === null ? 0 : Math.max(0, 1 - Math.abs(coverage(s.level, s.submitted) - s.level.conf) / TOL - 0.1 * s.misses.length - 0.02 * Math.max(0, s.volleys.length - 5))),

  describe(s) {
    const v = last(s);
    return `Интервал x̄ ± z·${s.level.known ? "σ" : "s"}/√n, выборки по ${s.level.n} наблюдений, нужное покрытие ${pct(s.level.conf)}. Множитель z = ${f2(s.z)}.${v ? ` Последний залп при z = ${f2(v.z)}: накрыли μ ${v.covered} из ${PER_VOLLEY}.` : ""}`;
  },

  hint(s) {
    if (s.hints <= 1) return "Сто интервалов — шумная оценка покрытия: даже при честных 95 % накроют от 91 до 99. Сделайте несколько залпов и смотрите на общую долю.";
    if (s.level.known) return `σ известна, и (x̄ − μ)/(σ/√n) — почти N(0, 1): нужен z, при котором P(|Z| ≤ z) = ${s.level.conf}.`;
    return "σ оценивается по выборке: хвосты статистики тяжелее нормальных, и табличного значения N(0, 1) мало — увеличьте z и проверьте залпами.";
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const total = s.volleys.reduce((a, v) => a + (v.z === s.z ? v.covered : 0), 0);
    const count = s.volleys.filter((v) => v.z === s.z).length;
    if (s.submitted !== null) return `Сдан z = ${f2(s.submitted)}: настоящее покрытие ${pct(coverage(s.level, s.submitted))} при нужных ${pct(s.level.conf)}. Истина накрыта!`;
    const miss = s.misses[s.misses.length - 1];
    if (miss === s.z) return `z = ${f2(miss)} не принят: настоящее покрытие ${coverage(s.level, miss) < s.level.conf ? "ниже" : "выше"} нужного больше чем на 1.5 пункта. Сдвиньте z и сделайте ещё залпы.`;
    const v = last(s);
    if (!v) return "Выберите множитель z и постройте 100 интервалов.";
    if (v.z !== s.z) return `Множитель изменён на z = ${f2(s.z)} — постройте интервалы, чтобы проверить его.`;
    return `z = ${f2(v.z)}: накрыли μ ${v.covered} из ${PER_VOLLEY}${count > 1 ? `, за ${count} залпа с этим z — ${pct(total / (count * PER_VOLLEY))}` : ""}. Можно сдать или попробовать другой z.`;
  },
};

/** Бот для тестов: z с нужным покрытием, залп, сдача. */
export function solve(state: State): Action[] {
  return [{ type: "set", z: bestZ(state.level) }, { type: "draw" }, { type: "submit" }];
}
