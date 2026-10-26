// Игра «Переобучи, если сможешь» (урок IV.7): полиномиальная регрессия с гребневым штрафом на 1D данных.
// Игрок выбирает степень d и log₁₀ λ, видит подгонку и ошибки на обучающей и валидационной частях, затем сдаёт
// модель — и узнаёт ошибку на скрытой тестовой части. Уровень пройден, если тестовая ошибка не хуже, чем у модели,
// выбранной по минимуму валидационной ошибки (с допуском 2 %). Модель чистая: данные из rng(seed).
import { gauss } from "../../lib/math/correlation";
import type { GameSpec, Rng } from "../_engine/types";

export type LevelKind = "sine" | "parabola" | "noisy-line" | "few" | "free";
export type Pt = readonly [number, number];

export interface Level {
  kind: LevelKind;
  train: Pt[];
  val: Pt[];
  test: Pt[];
  sigma: number;
}

export interface Choice {
  degree: number;
  logLambda: number;
}

export interface State {
  level: Level;
  choice: Choice;
  /** Сданные модели и их тестовая ошибка. */
  submits: (Choice & { test: number })[];
  solved: boolean;
  hints: number;
}

export type Action = { type: "set"; degree?: number; logLambda?: number } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["sine", "parabola", "noisy-line", "few", "free"];
export const LEVELS = LEVEL_KINDS.length;
export const DEGREES = { min: 0, max: 10 };
export const LOG_LAMBDA = { min: -6, max: 2 };
const SLACK = 1.02;
export const VAL = 30;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  sine: "синусоида",
  parabola: "парабола",
  "noisy-line": "шумная прямая",
  few: "восемь точек",
  free: "решите сами",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  sine: {
    question: "Почему ошибка на обучении падает с ростом степени, а на валидации — нет?",
    answer: "Эмпирический риск на обучающих точках можно сделать почти нулевым: полином степени 10 проходит почти через все 12 точек. Но он подгоняет и шум, и на новых точках ошибается сильнее. Валидация оценивает риск на данных, которых модель не видела.",
  },
  parabola: {
    question: "Какая степень лучшая для параболы с шумом?",
    answer: "Около двух: меньшая степень смещена (прямая не изогнётся), большая добавляет разброс. Минимум ошибки на новых данных — компромисс смещения и разброса.",
  },
  "noisy-line": {
    question: "Что делает λ, если степень великовата?",
    answer: "Гребневой штраф сжимает коэффициенты (урок IV.6): лишние степени получают малые веса, и полином ведёт себя почти как прямая. Большая λ уменьшает разброс ценой смещения.",
  },
  few: {
    question: "Почему при восьми точках выбор особенно важен?",
    answer: "Разброс модели растёт, когда данных мало: каждая точка сильно влияет на подгонку. Простая модель или сильная регуляризация здесь выигрывают.",
  },
  free: {
    question: "Почему нельзя выбирать модель по тестовой ошибке?",
    answer: "Тогда тест перестаёт быть честной оценкой: модель подогнана и под него. Выбирают по валидации или кросс-валидации, а тест открывают один раз в конце.",
  },
};

const TRUTH: Record<Exclude<LevelKind, "free">, { f: (x: number) => number; sigma: number; n: number }> = {
  sine: { f: (x) => Math.sin(Math.PI * x), sigma: 0.25, n: 12 },
  parabola: { f: (x) => 1.5 * x * x - 0.5, sigma: 0.2, n: 12 },
  "noisy-line": { f: (x) => 0.8 * x, sigma: 0.5, n: 12 },
  few: { f: (x) => Math.sin(Math.PI * x), sigma: 0.25, n: 8 },
};

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const k = kind === "free" ? r.pick(["sine", "parabola", "noisy-line", "few"] as const) : kind;
  const { f, sigma, n } = TRUTH[k];
  const at = (x: number) => [x, f(x) + sigma * gauss(r)] as const;
  // обучающие x — почти равномерная сетка со сдвигом: без пустых краёв полином не «улетает» за последнюю точку
  const train = Array.from({ length: n }, (_, i) => at(-1 + (2 * (i + 0.2 + 0.6 * r.next())) / n));
  const draw = (m: number) => Array.from({ length: m }, () => at(-1 + 2 * r.next()));
  return { kind, train, val: draw(VAL), test: draw(200), sigma };
}

/** Решение линейной системы методом Гаусса с выбором главного элемента. */
function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let i = c + 1; i < n; i++) if (Math.abs(M[i]![c]!) > Math.abs(M[p]![c]!)) p = i;
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let i = c + 1; i < n; i++) {
      const k = M[i]![c]! / M[c]![c]!;
      for (let j = c; j <= n; j++) M[i]![j]! -= k * M[c]![j]!;
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i]![n]!;
    for (let j = i + 1; j < n; j++) s -= M[i]![j]! * x[j]!;
    x[i] = s / M[i]![i]!;
  }
  return x;
}

// Моменты Σ xᵏ и Σ xᵏ y обучающей части считаются один раз: перебор сетки в valBest — 99 подгонок.
const momentsCache = new WeakMap<readonly Pt[], { sx: number[]; sxy: number[] }>();
function moments(train: readonly Pt[]) {
  let m = momentsCache.get(train);
  if (!m) {
    const sx = new Array<number>(2 * DEGREES.max + 1).fill(0);
    const sxy = new Array<number>(DEGREES.max + 1).fill(0);
    for (const [x, y] of train) {
      let p = 1;
      for (let k = 0; k < sx.length; k++, p *= x) {
        sx[k]! += p;
        if (k < sxy.length) sxy[k]! += p * y;
      }
    }
    m = { sx, sxy };
    momentsCache.set(train, m);
  }
  return m;
}

/** Гребневая полиномиальная регрессия: θ = (ΦᵀΦ + λ I)⁻¹ Φᵀ y; свободный член тоже штрафуется — так проще и честно для игры. */
export function fit(train: readonly Pt[], c: Choice): number[] {
  const d = c.degree;
  const lam = 10 ** c.logLambda;
  const { sx, sxy } = moments(train);
  const A = Array.from({ length: d + 1 }, (_, i) => Array.from({ length: d + 1 }, (_, j) => sx[i + j]! + (i === j ? lam : 0)));
  return solveLinear(A, sxy.slice(0, d + 1));
}

/** Схема Горнера. */
export const predict = (theta: readonly number[], x: number) => theta.reduceRight((s, t) => s * x + t, 0);
export const mse = (theta: readonly number[], pts: readonly Pt[]) => pts.reduce((s, [x, y]) => s + (predict(theta, x) - y) ** 2, 0) / pts.length;

export function errors(l: Level, c: Choice) {
  const theta = fit(l.train, c);
  return { theta, train: mse(theta, l.train), val: mse(theta, l.val), test: mse(theta, l.test) };
}

/** Модель с наименьшей валидационной ошибкой на сетке степеней и λ (запоминается для уровня). */
const bestCache = new WeakMap<Level, Choice>();
export function valBest(l: Level): Choice {
  const cached = bestCache.get(l);
  if (cached) return cached;
  let best: Choice = { degree: 0, logLambda: LOG_LAMBDA.max };
  let bestVal = Infinity;
  for (let d = DEGREES.min; d <= DEGREES.max; d++)
    for (let g = LOG_LAMBDA.min; g <= LOG_LAMBDA.max; g++) {
      const v = mse(fit(l.train, { degree: d, logLambda: g }), l.val);
      if (v < bestVal) [best, bestVal] = [{ degree: d, logLambda: g }, v];
    }
  bestCache.set(l, best);
  return best;
}

const target = (l: Level) => SLACK * errors(l, valBest(l)).test;
const SUP: Record<string, string> = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
/** −3 → «10⁻³»: степень λ надстрочными знаками. */
export const pow10 = (g: number) => `10${[...String(g)].map((c) => SUP[c] ?? c).join("")}`;
const f3 = (x: number) => (Math.round(x * 1000) / 1000).toFixed(3);
const clampInt = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v)));

export const overfit: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "stat.overfit",
  version: 1,
  concepts: ["stat.risk-generalization"],

  init: (level) => ({ level, choice: { degree: 1, logLambda: LOG_LAMBDA.min }, submits: [], solved: false, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return overfit.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.solved) return state;
    if (action.type === "set")
      return {
        ...state,
        choice: {
          degree: action.degree === undefined ? state.choice.degree : clampInt(action.degree, DEGREES.min, DEGREES.max),
          logLambda: action.logLambda === undefined ? state.choice.logLambda : clampInt(action.logLambda, LOG_LAMBDA.min, LOG_LAMBDA.max),
        },
      };
    const test = errors(state.level, state.choice).test;
    return { ...state, submits: [...state.submits, { ...state.choice, test }], solved: test <= target(state.level) };
  },

  status: (s) => (s.solved ? "solved" : "playing"),
  /** Отношение тестовой ошибки выбора по валидации к тестовой ошибке игрока, с вычетом 0.25 за каждый подсмотренный тест. */
  score: (s) => {
    const last = s.submits[s.submits.length - 1];
    if (!s.solved || !last) return 0;
    return Math.max(0, Math.min(1, errors(s.level, valBest(s.level)).test / last.test) - 0.25 * (s.submits.length - 1));
  },

  describe(s) {
    const e = errors(s.level, s.choice);
    return `Степень ${s.choice.degree}, λ = ${pow10(s.choice.logLambda)}: ошибка на обучении ${f3(e.train)}, на валидации ${f3(e.val)}.${s.submits.length ? ` Сдано моделей: ${s.submits.length}.` : ""}`;
  },

  hint(s) {
    if (s.hints <= 1) return "Смотрите на ошибку на валидации, а не на обучении: обучающую можно сделать почти нулевой, но это не значит, что модель хороша.";
    const b = valBest(s.level);
    return `Перебирайте степень при маленьком λ, потом поднимайте λ для больших степеней. Наименьшая ошибка на валидации — при степени ${b.degree} и λ = ${pow10(b.logLambda)}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const last = s.submits[s.submits.length - 1];
    const e = errors(s.level, s.choice);
    if (s.solved && last) return `Тест: ${f3(last.test)} — не хуже выбора по валидации (${f3(errors(s.level, valBest(s.level)).test)}). Неустранимый шум σ² = ${f3(s.level.sigma ** 2)}: меньше него ошибка на новых данных в среднем не бывает.`;
    if (last && last.degree === s.choice.degree && last.logLambda === s.choice.logLambda)
      return `Тест: ${f3(last.test)} — хуже, чем у модели, выбранной по валидации. Тест теперь подсмотрен: следующая сдача засчитывается с вычетом. Ориентируйтесь на валидацию.`;
    return `Обучение ${f3(e.train)}, валидация ${f3(e.val)}. Подберите степень и λ и сдайте модель.`;
  },
};

/** Бот для тестов: выбрать модель по валидации и сдать. */
export function solve(state: State): Action[] {
  const b = valBest(state.level);
  return [{ type: "set", degree: b.degree, logLambda: b.logLambda }, { type: "submit" }];
}
