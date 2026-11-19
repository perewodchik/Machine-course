// Игра «Переобучи, если сможешь: λ» (урок 2.3 «Основ ML»): линейная регрессия по 20 признакам с L2- или L1-штрафом.
// Игрок выбирает тип штрафа и log₁₀ λ по ошибкам на обучающей и валидационной частях и сдаёт модель — открывается
// ошибка на скрытом тесте. Уровень пройден, если она не больше чем на 3 % выше тестовой ошибки модели, выбранной
// по минимуму валидационной ошибки на той же сетке (оба штрафа). Уровни подводят к разреженной истине (2 полезных
// признака из 20 — выигрывает L1) и к граничному λ → ∞: при чистом шуме лучшая модель — константа ȳ.
// Модель чистая: данные из rng(seed). Признаки — стандартные нормальные, свободный член не штрафуется (центрирование).
import { gauss } from "../../lib/math/correlation";
import type { GameSpec, Rng } from "../_engine/types";

export type Penalty = "l2" | "l1";
export type LevelKind = "dense" | "sparse" | "few" | "noise" | "free";

export const D = 20;
export const LOG_LAMBDA = { min: -1, max: 4, step: 0.5 };
/** Сетка log₁₀ λ: −1, −0.5, …, 4. */
export const GRID: readonly number[] = Array.from({ length: (LOG_LAMBDA.max - LOG_LAMBDA.min) / LOG_LAMBDA.step + 1 }, (_, i) => LOG_LAMBDA.min + i * LOG_LAMBDA.step);
const SLACK = 1.03;
const VAL = 40;
const TEST = 400;

export interface Level {
  kind: LevelKind;
  /** Строки обучающей, валидационной и тестовой частей: x (D признаков) и y. */
  train: { X: number[][]; y: number[] };
  val: { X: number[][]; y: number[] };
  test: { X: number[][]; y: number[] };
  truth: number[];
  sigma: number;
}

export interface Choice {
  penalty: Penalty;
  logLambda: number;
}

export interface State {
  level: Level;
  choice: Choice;
  submits: (Choice & { test: number })[];
  solved: boolean;
  hints: number;
}

export type Action = { type: "set"; penalty?: Penalty; logLambda?: number } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["dense", "sparse", "few", "noise", "free"];
export const LEVELS = LEVEL_KINDS.length;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  dense: "все признаки понемногу",
  sparse: "два полезных из двадцати",
  few: "мало данных",
  noise: "только шум",
  free: "решите сами",
};

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  dense: {
    question: "Почему здесь L2 не хуже L1?",
    answer: "Все 20 признаков немного полезны. L2 сжимает веса пропорционально и ни одного не обнуляет; L1 обнуляет слабые веса, а вместе с ними — и их полезный вклад.",
  },
  sparse: {
    question: "Почему при разреженной истине выигрывает L1?",
    answer: "Мягкий порог L1 обнуляет 18 бесполезных весов целиком: шум от них исчезает, а два сильных веса лишь немного сдвинуты к нулю. L2 оставляет все 20 весов ненулевыми, и каждый добавляет разброс.",
  },
  few: {
    question: "Что меняется, когда объектов почти столько же, сколько признаков?",
    answer: "Без штрафа разброс МНК растёт как σ²·d/(n − d − 1): при n близком к d веса почти случайны. Штраф нужен сильнее, и отбор признаков (L1) окупается больше всего.",
  },
  noise: {
    question: "Чем становится модель при λ → ∞?",
    answer: "Все веса уходят в ноль, остаётся свободный член ȳ — константа. Когда признаки не связаны с ответом, это и есть лучшая модель: любой ненулевой вес — подгонка под шум.",
  },
  free: {
    question: "Почему тип штрафа тоже выбирают по валидации?",
    answer: "Тип штрафа — такой же гиперпараметр, как λ: он выражает предположение о разреженности истины. Проверить предположение можно только на отложенных данных.",
  },
};

const SPEC: Record<Exclude<LevelKind, "free">, { n: number; sigma: number; truth: (r: Rng) => number[] }> = {
  // все веса одной величины со случайным знаком: обнулять нечего, выигрывает равномерное сжатие L2
  dense: { n: 60, sigma: 1, truth: (r) => Array.from({ length: D }, () => (r.next() < 0.5 ? -0.3 : 0.3)) },
  sparse: { n: 60, sigma: 1, truth: () => [2, -1.5, ...new Array<number>(D - 2).fill(0)] },
  few: { n: 28, sigma: 1, truth: () => [2, -1.5, ...new Array<number>(D - 2).fill(0)] },
  noise: { n: 40, sigma: 1, truth: () => new Array<number>(D).fill(0) },
};

export function makeLevel(kind: LevelKind, r: Rng): Level {
  const k = kind === "free" ? r.pick(["dense", "sparse", "few"] as const) : kind;
  const { n, sigma, truth } = SPEC[k];
  const theta = truth(r);
  const part = (m: number) => {
    const X = Array.from({ length: m }, () => Array.from({ length: D }, () => gauss(r)));
    return { X, y: X.map((x) => 1 + x.reduce((s, v, j) => s + v * theta[j]!, 0) + sigma * gauss(r)) };
  };
  return { kind, train: part(n), val: part(VAL), test: part(TEST), truth: theta, sigma };
}

/** Решение системы A x = b методом Гаусса с выбором главного элемента (A симметрична и положительно определена). */
function solve(A: number[][], b: number[]): number[] {
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

export interface Fit {
  intercept: number;
  theta: number[];
}

// Центрированные XᵀX и Xᵀy считаются один раз на уровень: перебор сетки — 22 подгонки.
const gramCache = new WeakMap<Level["train"], { mx: number[]; my: number; G: number[][]; c: number[] }>();
function gram(train: Level["train"]) {
  let g = gramCache.get(train);
  if (!g) {
    const n = train.y.length;
    const mx = Array.from({ length: D }, (_, j) => train.X.reduce((s, x) => s + x[j]!, 0) / n);
    const my = train.y.reduce((s, v) => s + v, 0) / n;
    const Z = train.X.map((x) => x.map((v, j) => v - mx[j]!));
    const G = Array.from({ length: D }, (_, i) => Array.from({ length: D }, (_, j) => Z.reduce((s, z) => s + z[i]! * z[j]!, 0)));
    const c = Array.from({ length: D }, (_, j) => Z.reduce((s, z, k) => s + z[j]! * (train.y[k]! - my), 0));
    g = { mx, my, G, c };
    gramCache.set(train, g);
  }
  return g;
}

/**
 * Подгонка по обучающей части. L2: (XᵀX + λI)θ = Xᵀy (урок 2.3, f.ridge-closed-form).
 * L1: ½‖y − Xθ‖² + λ‖θ‖₁ покоординатным спуском с мягким порогом (f.lasso-coordinate-step). X и y центрированы.
 */
export function fit(train: Level["train"], c: Choice): Fit {
  const { mx, my, G, c: xy } = gram(train);
  const lam = 10 ** c.logLambda;
  let theta: number[];
  if (c.penalty === "l2") {
    theta = solve(G.map((row, i) => row.map((v, j) => v + (i === j ? lam : 0))), xy);
  } else {
    theta = new Array<number>(D).fill(0);
    for (let sweep = 0; sweep < 500; sweep++) {
      let change = 0;
      for (let j = 0; j < D; j++) {
        // ρⱼ = xⱼᵀ(y − X₋ⱼθ₋ⱼ) через Грамову матрицу
        let rho = xy[j]!;
        for (let k = 0; k < D; k++) if (k !== j) rho -= G[j]![k]! * theta[k]!;
        const next = Math.sign(rho) * Math.max(0, Math.abs(rho) - lam) / G[j]![j]!;
        change = Math.max(change, Math.abs(next - theta[j]!));
        theta[j] = next;
      }
      if (change < 1e-10) break;
    }
  }
  return { intercept: my - theta.reduce((s, t, j) => s + t * mx[j]!, 0), theta };
}

export const predict = (f: Fit, x: readonly number[]) => f.intercept + x.reduce((s, v, j) => s + v * f.theta[j]!, 0);
export const mse = (f: Fit, part: { X: number[][]; y: number[] }) => part.y.reduce((s, y, i) => s + (predict(f, part.X[i]!) - y) ** 2, 0) / part.y.length;
export const nonzero = (f: Fit) => f.theta.filter((t) => Math.abs(t) > 1e-9).length;

export function errors(l: Level, c: Choice) {
  const f = fit(l.train, c);
  return { fit: f, train: mse(f, l.train), val: mse(f, l.val), test: mse(f, l.test) };
}

const CHOICES: readonly Choice[] = (["l2", "l1"] as const).flatMap((penalty) => GRID.map((logLambda) => ({ penalty, logLambda })));

/** Модель с наименьшей валидационной ошибкой на сетке (оба штрафа). */
const bestCache = new WeakMap<Level, Choice>();
export function valBest(l: Level): Choice {
  let best = bestCache.get(l);
  if (!best) {
    let v = Infinity;
    for (const c of CHOICES) {
      const e = mse(fit(l.train, c), l.val);
      if (e < v) [best, v] = [c, e];
    }
    bestCache.set(l, best!);
  }
  return best!;
}

/** Лучшая на сетке тестовая ошибка — ориентир для очков (игроку не показывается). */
export const testBest = (l: Level) => Math.min(...CHOICES.map((c) => mse(fit(l.train, c), l.test)));

const target = (l: Level) => SLACK * errors(l, valBest(l)).test;
const SUP: Record<string, string> = { "-": "⁻", ".": "·", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
/** 1.5 → «10¹·⁵». */
export const pow10 = (g: number) => `10${[...String(g)].map((ch) => SUP[ch] ?? ch).join("")}`;
export const penaltyName = (p: Penalty) => (p === "l1" ? "L1" : "L2");
const f3 = (x: number) => x.toFixed(3);
const snapLog = (v: number) => Math.min(LOG_LAMBDA.max, Math.max(LOG_LAMBDA.min, Math.round(v / LOG_LAMBDA.step) * LOG_LAMBDA.step));

export const overfitLambda: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "ml.overfit-lambda",
  version: 1,
  concepts: ["ml.lasso"],

  init: (level) => ({ level, choice: { penalty: "l2", logLambda: LOG_LAMBDA.min }, submits: [], solved: false, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return overfitLambda.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.solved) return state;
    if (action.type === "set")
      return {
        ...state,
        choice: {
          penalty: action.penalty ?? state.choice.penalty,
          logLambda: action.logLambda === undefined ? state.choice.logLambda : snapLog(action.logLambda),
        },
      };
    const test = errors(state.level, state.choice).test;
    return { ...state, submits: [...state.submits, { ...state.choice, test }], solved: test <= target(state.level) };
  },

  status: (s) => (s.solved ? "solved" : "playing"),
  /** Лучшая на сетке тестовая ошибка к тестовой ошибке игрока, минус 0.25 за каждый подсмотренный тест. */
  score: (s) => {
    const last = s.submits[s.submits.length - 1];
    if (!s.solved || !last) return 0;
    return Math.max(0, Math.min(1, testBest(s.level) / last.test) - 0.25 * (s.submits.length - 1));
  },

  describe(s) {
    const e = errors(s.level, s.choice);
    return `${penaltyName(s.choice.penalty)}, λ = ${pow10(s.choice.logLambda)}: ненулевых весов ${nonzero(e.fit)} из ${D}; ошибка на обучении ${f3(e.train)}, на валидации ${f3(e.val)}.${s.submits.length ? ` Сдано моделей: ${s.submits.length}.` : ""}`;
  },

  hint(s) {
    if (s.hints <= 1) return "Для каждого штрафа найдите λ с наименьшей ошибкой на валидации и сравните два минимума. Ошибка на обучении с ростом λ только растёт — по ней не выбирают.";
    const b = valBest(s.level);
    return `Наименьшая ошибка на валидации — у ${penaltyName(b.penalty)} при λ = ${pow10(b.logLambda)}.`;
  },

  generate: (r, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, r),

  feedback(s) {
    const last = s.submits[s.submits.length - 1];
    const e = errors(s.level, s.choice);
    if (s.solved && last)
      return `Тест: ${f3(last.test)} — не хуже выбора по валидации (${f3(errors(s.level, valBest(s.level)).test)}). Неустранимый шум σ² = ${f3(s.level.sigma ** 2)}. Полезных признаков в истине: ${s.level.truth.filter((t) => t !== 0).length} из ${D}.`;
    if (last && last.penalty === s.choice.penalty && last.logLambda === s.choice.logLambda)
      return `Тест: ${f3(last.test)} — хуже, чем у модели, выбранной по валидации. Тест подсмотрен: следующая сдача засчитывается с вычетом. Сравните штрафы на валидации.`;
    return `Обучение ${f3(e.train)}, валидация ${f3(e.val)}, ненулевых весов ${nonzero(e.fit)}. Выберите штраф и λ и сдайте модель.`;
  },
};

/** Бот для тестов: выбрать по валидации и сдать. */
export function solveLevel(state: State): Action[] {
  const b = valBest(state.level);
  return [{ type: "set", penalty: b.penalty, logLambda: b.logLambda }, { type: "submit" }];
}
