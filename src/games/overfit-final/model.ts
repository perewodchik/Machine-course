// Игра «Переобучи, если сможешь: финал» (урок 2.4 «Основ ML»): полиномиальная гребневая регрессия, как в базовой
// игре IV.7, но отдельной валидационной части нет — есть n объектов. Игрок оценивает модели отложенной частью (25 %)
// или 5-кратной кросс-валидацией, выбирает степень и log₁₀ λ и сдаёт модель, обученную на всех n объектах.
// Скрытый тест открывается ОДИН раз и завершает уровень. Уровень пройден, если тестовая ошибка не больше чем на 5 %
// выше, чем у модели с наименьшей ошибкой 5-кратной кросс-валидации; очки — лучшая на сетке тестовая ошибка к ошибке игрока. Уровни: много данных (хватает отложенной части) → 40 объектов (нужна кросс-валидация) →
// граничный: истина — константа с сильным шумом, и лучшая модель — самая простая. Модель чистая: данные из rng(seed).
import { gauss } from "../../lib/math/correlation";
import type { GameSpec, Rng } from "../_engine/types";
import { DEGREES, fit, LOG_LAMBDA, mse, pow10, type Pt } from "../overfit/model";

export { DEGREES, LOG_LAMBDA, pow10 };
export type Method = "holdout" | "cv";
export type LevelKind = "many" | "forty" | "constant" | "free";

export const K = 5;
const HOLDOUT = 0.25;
const SLACK = 1.05;

export interface Level {
  kind: LevelKind;
  data: Pt[];
  test: Pt[];
  sigma: number;
}

export interface Choice {
  degree: number;
  logLambda: number;
}

export interface State {
  level: Level;
  method: Method;
  choice: Choice;
  /** Открытая тестовая ошибка: после сдачи уровень окончен. */
  test: number | null;
  hints: number;
}

export type Action = { type: "set"; degree?: number; logLambda?: number } | { type: "method"; method: Method } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["many", "forty", "constant", "free"];
export const LEVELS = LEVEL_KINDS.length;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  many: "много данных",
  forty: "40 объектов",
  constant: "константа и шум",
  free: "решите сами",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  many: {
    question: "Почему при 200 объектах хватает одной отложенной части?",
    answer: "В отложенной части 50 объектов: её оценка ошибки устойчива, а модель, обученная на 150 объектах, почти не хуже обученной на всех. Кросс-валидация даёт то же, но в пять раз дороже.",
  },
  forty: {
    question: "Что не так с отложенной частью при 40 объектах?",
    answer: "В ней всего 10 объектов: оценка ошибки сильно зависит от того, какие точки туда попали, и выбор степени становится лотереей. Кросс-валидация усредняет пять оценок по всем 40 объектам — разброс оценки меньше.",
  },
  constant: {
    question: "Почему здесь лучшая модель — самая простая?",
    answer: "Истина — константа, всё остальное — шум. Любая кривая подгоняет шум и добавляет разброс; правило одной SE подсказывает то же: среди моделей в пределах одной стандартной ошибки от лучшей берите самую простую.",
  },
  free: {
    question: "Почему тест открывают ровно один раз?",
    answer: "Тест — оценка модели, которую уже выбрали. Если по нему выбирать или переделывать модель, он становится ещё одной валидацией, и честной оценки не остаётся.",
  },
};

const TRUTH: Record<Exclude<LevelKind, "free">, { f: (x: number) => number; sigma: number; n: number }> = {
  many: { f: (x) => Math.sin(Math.PI * x), sigma: 0.3, n: 200 },
  forty: { f: (x) => Math.sin(Math.PI * x), sigma: 0.5, n: 40 },
  constant: { f: () => 0.3, sigma: 1, n: 40 },
};

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const k = kind === "free" ? r.pick(["many", "forty", "constant"] as const) : kind;
  const { f, sigma, n } = TRUTH[k];
  const at = (x: number) => [x, f(x) + sigma * gauss(r)] as const;
  // x данных — почти равномерная сетка со сдвигом (как в базовой игре): без пустых краёв полином не «улетает»;
  // порядок перемешан — отложенная часть и фолды получаются случайными
  const data = r.shuffle(Array.from({ length: n }, (_, i) => at(-1 + (2 * (i + 0.2 + 0.6 * r.next())) / n)));
  const test = Array.from({ length: 300 }, () => at(-1 + 2 * r.next()));
  return { kind, data, test, sigma };
}

// Разбиения уровня запоминаются: подгонка кэширует моменты по массиву обучающих точек.
interface Splits {
  holdout: { train: Pt[]; val: Pt[] };
  folds: { train: Pt[]; val: Pt[] }[];
}
const splitCache = new WeakMap<Level, Splits>();
function splits(l: Level): Splits {
  let s = splitCache.get(l);
  if (!s) {
    const n = l.data.length;
    const cut = Math.round((1 - HOLDOUT) * n); // данные уже в случайном порядке
    const fold = (j: number) => ({ train: l.data.filter((_, i) => i % K !== j), val: l.data.filter((_, i) => i % K === j) });
    s = { holdout: { train: l.data.slice(0, cut), val: l.data.slice(cut) }, folds: Array.from({ length: K }, (_, j) => fold(j)) };
    splitCache.set(l, s);
  }
  return s;
}

/** Оценка модели выбранным способом: ошибка на отложенной части или среднее по фолдам ± стандартная ошибка. */
export function estimate(l: Level, method: Method, c: Choice): { mean: number; se: number | null } {
  const s = splits(l);
  if (method === "holdout") return { mean: mse(fit(s.holdout.train, c), s.holdout.val), se: null };
  const e = s.folds.map((f) => mse(fit(f.train, c), f.val));
  const mean = e.reduce((a, b) => a + b, 0) / K;
  const sd = Math.sqrt(e.reduce((a, b) => a + (b - mean) ** 2, 0) / (K - 1));
  return { mean, se: sd / Math.sqrt(K) };
}

/** Ошибка на тесте модели, обученной на всех данных уровня. */
export const testError = (l: Level, c: Choice) => mse(fit(l.data, c), l.test);
export const trainError = (l: Level, c: Choice) => mse(fit(l.data, c), l.data);

const GRID: readonly Choice[] = Array.from({ length: DEGREES.max - DEGREES.min + 1 }, (_, i) => i + DEGREES.min).flatMap((degree) =>
  Array.from({ length: LOG_LAMBDA.max - LOG_LAMBDA.min + 1 }, (_, j) => ({ degree, logLambda: LOG_LAMBDA.min + j })),
);

/** Лучшая модель на сетке по выбранному способу оценки. */
const bestCache = new WeakMap<Level, Partial<Record<Method, Choice>>>();
export function bestBy(l: Level, method: Method): Choice {
  const cached = bestCache.get(l) ?? {};
  if (cached[method]) return cached[method];
  let best = GRID[0]!;
  let v = Infinity;
  for (const c of GRID) {
    const e = estimate(l, method, c).mean;
    if (e < v) [best, v] = [c, e];
  }
  bestCache.set(l, { ...cached, [method]: best });
  return best;
}

const oracleCache = new WeakMap<Level, number>();
/** Лучшая на сетке тестовая ошибка — ориентир очков, игроку до сдачи не показывается. */
export function oracle(l: Level): number {
  let o = oracleCache.get(l);
  if (o === undefined) {
    o = Math.min(...GRID.map((c) => testError(l, c)));
    oracleCache.set(l, o);
  }
  return o;
}

const f3 = (x: number) => x.toFixed(3);
const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));
const METHOD_NAMES: Record<Method, string> = { holdout: "отложенная часть", cv: "кросс-валидация" };
export const methodName = (m: Method) => METHOD_NAMES[m];

export const overfitFinal: GameSpec<State, Action, Level> & { feedback(state: State): string; done(state: State): boolean } = {
  id: "ml.overfit-final",
  version: 1,
  concepts: ["ml.model-selection"],

  init: (level) => ({ level, method: "holdout", choice: { degree: 1, logLambda: LOG_LAMBDA.min }, test: null, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return { ...overfitFinal.init(state.level, undefined as unknown as Rng), hints: state.hints };
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.test !== null) return state; // тест открыт: уровень окончен
    if (action.type === "method") return { ...state, method: action.method };
    if (action.type === "set")
      return {
        ...state,
        choice: {
          degree: action.degree === undefined ? state.choice.degree : clampInt(action.degree, DEGREES.min, DEGREES.max),
          logLambda: action.logLambda === undefined ? state.choice.logLambda : clampInt(action.logLambda, LOG_LAMBDA.min, LOG_LAMBDA.max),
        },
      };
    return { ...state, test: testError(state.level, state.choice) };
  },

  done: (s) => s.test !== null,
  status: (s) => (s.test === null ? "playing" : s.test <= SLACK * testError(s.level, bestBy(s.level, "cv")) ? "solved" : "failed"),
  /** Лучшая на сетке тестовая ошибка к тестовой ошибке игрока. */
  score: (s) => (s.test === null ? 0 : Math.min(1, oracle(s.level) / s.test)),

  describe(s) {
    const e = estimate(s.level, s.method, s.choice);
    return `Степень ${s.choice.degree}, λ = ${pow10(s.choice.logLambda)}; ${methodName(s.method)}: ошибка ${f3(e.mean)}${e.se === null ? "" : ` ± ${f3(e.se)}`}.${s.test === null ? "" : ` Тест открыт: ${f3(s.test)}.`}`;
  },

  hint(s) {
    if (s.hints <= 1)
      return s.level.data.length >= 100
        ? "Данных много: отложенной части хватает. Найдите степень и λ с наименьшей ошибкой на ней."
        : "Данных мало: оценка по одной отложенной части шумная. Переключитесь на кросс-валидацию и сравните модели по среднему ± SE.";
    const b = bestBy(s.level, "cv");
    return `Наименьшая ошибка кросс-валидации — при степени ${b.degree} и λ = ${pow10(b.logLambda)}. Если модель попроще в пределах одной SE, она надёжнее.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const e = estimate(s.level, s.method, s.choice);
    if (s.test !== null) {
      const ok = overfitFinal.status(s) === "solved";
      return `Тест: ${f3(s.test)}; у выбора по кросс-валидации — ${f3(testError(s.level, bestBy(s.level, "cv")))}, лучшая модель на сетке — ${f3(oracle(s.level))}. ${ok ? "Выбор не хуже кросс-валидации." : "Модель хуже выбора по кросс-валидации: оценка, по которой вы выбирали, была шумной или вы смотрели на обучение."} Неустранимый шум σ² = ${f3(s.level.sigma ** 2)}. Тест открыт — уровень окончен.`;
    }
    return `${methodName(s.method)[0]!.toUpperCase()}${methodName(s.method).slice(1)}: ${f3(e.mean)}${e.se === null ? "" : ` ± ${f3(e.se)}`}; на обучении ${f3(trainError(s.level, s.choice))}. Тест откроется один раз.`;
  },
};

/** Бот для тестов: выбрать по кросс-валидации и сдать. */
export function solveLevel(state: State): Action[] {
  const b = bestBy(state.level, "cv");
  return [{ type: "method", method: "cv" }, { type: "set", degree: b.degree, logLambda: b.logLambda }, { type: "submit" }];
}
