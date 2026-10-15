// Игра «Underflow» (урок 0.5): правдоподобие — произведение вероятностей объектов, и во float64 оно становится нулём.
// Уровни 1–3: предсказать, на каком объекте n произведение обратится в ноль; уровень 4: предсказать сумму логарифмов;
// уровень 5 (граничный): сравнить две модели, у которых оба произведения — ноль, а суммы логарифмов различаются.
// Числа считаются честно, в числах JavaScript (это и есть float64): ноль находится перемножением, а не формулой.
import type { GameSpec, Rng } from "../_engine/types";

export type Kind = "half" | "mixed" | "confident" | "logsum" | "compare";

export interface Level {
  kind: Kind;
  /** Вероятности, которые модель дала правильным ответам объектов (у «сравнения» — модель A). */
  probs: number[];
  /** Вероятности модели B (только «сравнение»). */
  probsB?: number[];
  /** Диапазон, из которого взяты вероятности: для подписи. */
  range: readonly [number, number];
  /** Предел оси n и прогноза. */
  xMax: number;
  /** Шаг прогноза. */
  step: number;
}

export type Pick = "A" | "B" | "same";

export interface State {
  level: Level;
  /** Прогноз: номер объекта n (уровни 1–3) или сумма логарифмов S (уровень 4). */
  guess: number;
  revealed: boolean;
  /** Уровень «сравнение»: суммы логарифмов показаны. */
  logs: boolean;
  picks: Pick[];
  moves: number;
  hints: number;
}

export type Action = { type: "set"; value: number } | { type: "reveal" } | { type: "logs" } | { type: "pick"; pick: Pick } | { type: "hint" } | { type: "reset" };

export const KINDS: readonly Kind[] = ["half", "mixed", "confident", "logsum", "compare"];
export const LEVELS = KINDS.length;

export const KIND_NAMES: Record<Kind, string> = {
  half: "монетка",
  mixed: "обычная модель",
  confident: "уверенная модель",
  logsum: "сумма логарифмов",
  compare: "сравнение моделей",
};

/** Число объектов на уровнях «сумма логарифмов» и «сравнение». */
export const LOG_N = 2000;
export const COMPARE_N = 3000;

export const DEBRIEF: Record<Kind, { question: string; answer: string }> = {
  half: {
    question: "Почему ноль наступил около n = 1075?",
    answer: "0.5ⁿ = 2⁻ⁿ, а самое маленькое положительное число float64 — 2⁻¹⁰⁷⁴ ≈ 4.9 · 10⁻³²⁴. Дальше остаётся только ноль.",
  },
  mixed: {
    question: "Как оценить n, не перемножая?",
    answer: "Каждое умножение на pᵢ сдвигает десятичный порядок на log₁₀ pᵢ. Ноль наступит, когда сумма log₁₀ pᵢ опустится ниже −324: n ≈ 324 / |среднее log₁₀ pᵢ|.",
  },
  confident: {
    question: "Почему у уверенной модели ноль наступает позже, но всё равно наступает?",
    answer: "Вероятности ближе к единице, и порядок падает медленнее — в среднем на 0.17 за объект. Но объектов в данных тысячи, и любое произведение вероятностей меньше единицы рано или поздно уходит за пределы float.",
  },
  logsum: {
    question: "Зачем в CS229 максимизируют логарифм правдоподобия, а не само правдоподобие?",
    answer: "log ∏ pᵢ = Σ log pᵢ: произведение крошечных чисел превращается в сумму умеренных — без нуля во float. А логарифм возрастает, поэтому точка максимума не меняется (урок 0.3).",
  },
  compare: {
    question: "Что делать, если у обеих моделей правдоподобие — ноль?",
    answer: "Сравнивать логарифмы правдоподобия: у них нет нуля во float, и больше та модель, у которой сумма log pᵢ больше. Ноль — артефакт вычислений, а не свойство моделей.",
  },
};

/** Первый номер объекта, на котором произведение во float64 стало нулём; 0 — не стало до конца массива. */
export function underflowAt(probs: readonly number[]): number {
  let product = 1;
  for (let i = 0; i < probs.length; i++) {
    product *= probs[i]!;
    if (product === 0) return i + 1;
  }
  return 0;
}

export const logSum = (probs: readonly number[], n = probs.length) => probs.slice(0, n).reduce((s, p) => s + Math.log(p), 0);
export const log10Sum = (probs: readonly number[], n = probs.length) => probs.slice(0, n).reduce((s, p) => s + Math.log10(p), 0);

const uniform = (r: Rng, lo: number, hi: number, n: number) => Array.from({ length: n }, () => Math.round((lo + (hi - lo) * r.next()) * 1000) / 1000);

export function makeLevel(kind: Kind, r: Rng): Level {
  switch (kind) {
    case "half":
      return { kind, probs: Array(2000).fill(0.5), range: [0.5, 0.5], xMax: 2000, step: 5 };
    case "mixed":
      return { kind, probs: uniform(r, 0.05, 0.95, 2000), range: [0.05, 0.95], xMax: 2000, step: 5 };
    case "confident":
      // не только p > 0.5: произведение таких чисел застревает на 5 · 10⁻³²⁴ (округление), а нуль даёт множитель ≤ 0.5
      return { kind, probs: uniform(r, 0.4, 0.99, 4000), range: [0.4, 0.99], xMax: 4000, step: 10 };
    case "logsum":
      return { kind, probs: uniform(r, 0.3, 0.7, LOG_N), range: [0.3, 0.7], xMax: LOG_N, step: 10 };
    case "compare":
      return { kind, probs: uniform(r, 0.45, 0.85, COMPARE_N), probsB: uniform(r, 0.4, 0.8, COMPARE_N), range: [0.4, 0.85], xMax: COMPARE_N, step: 1 };
  }
}

/** Правильный ответ уровня: n, при котором произведение стало нулём, или сумма логарифмов. */
export function answer(level: Level): number {
  return level.kind === "logsum" ? logSum(level.probs) : underflowAt(level.probs);
}

/** Модель с большим правдоподобием на уровне «сравнение». */
export const better = (level: Level): Pick => (logSum(level.probs) > logSum(level.probsB ?? []) ? "A" : "B");

/** Точность прогноза: отношение меньшего к большему, 1 — точно. */
export function accuracy(level: Level, guess: number): number {
  const a = Math.abs(answer(level));
  const g = Math.abs(guess);
  if (!a || !g) return 0;
  return Math.min(a, g) / Math.max(a, g);
}

const START: Record<Kind, number> = { half: 100, mixed: 100, confident: 500, logsum: -100, compare: 0 };

export const fmt = (v: number, digits = 0) => (Math.round(v * 10 ** digits) / 10 ** digits).toString().replace("-", "−");
/** «в 1.34 раза» — во сколько раз прогноз отличается от ответа. */
const times = (acc: number) => fmt(1 / acc, 2);

export const underflow: GameSpec<State, Action, Level> & { feedback(state: State): string } = {
  id: "prob.underflow",
  version: 1,
  concepts: ["calc.log-exp"],

  init: (level) => ({ level, guess: START[level.kind], revealed: false, logs: false, picks: [], moves: 0, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return underflow.init(state.level, undefined as unknown as Rng);
    if (underflow.status(state) === "solved") return state;
    const { level } = state;
    switch (action.type) {
      case "hint":
        return { ...state, hints: state.hints + 1 };
      case "set": {
        if (level.kind === "compare" || state.revealed) return state;
        const [lo, hi] = level.kind === "logsum" ? [-3000, 0] : [level.step, level.xMax];
        const value = Math.min(hi, Math.max(lo, Math.round(action.value / level.step) * level.step));
        return value === state.guess ? state : { ...state, guess: value, moves: state.moves + 1 };
      }
      case "reveal":
        return level.kind === "compare" ? state : { ...state, revealed: true };
      case "logs":
        return level.kind === "compare" && !state.logs ? { ...state, logs: true, moves: state.moves + 1 } : state;
      case "pick":
        return level.kind === "compare" ? { ...state, picks: [...state.picks, action.pick] } : state;
    }
  },

  status(s) {
    if (s.level.kind === "compare") return s.picks.at(-1) === better(s.level) ? "solved" : "playing";
    return s.revealed ? "solved" : "playing";
  },

  /** Уровни 1–4 — точность прогноза; «сравнение» — 1 с первого выбора, ½ со второго… */
  score(s) {
    if (s.level.kind === "compare") return underflow.status(s) === "solved" ? 1 / s.picks.length : 0;
    return s.revealed ? accuracy(s.level, s.guess) : 0;
  },

  describe(s) {
    const { level } = s;
    const [lo, hi] = level.range;
    const source = lo === hi ? `все вероятности равны ${lo}` : `вероятности от ${lo} до ${hi}`;
    if (level.kind === "compare") {
      const logs = s.logs ? ` Суммы логарифмов: A — ${fmt(logSum(level.probs), 1)}, B — ${fmt(logSum(level.probsB!), 1)}.` : "";
      return `${COMPARE_N} объектов, у обеих моделей произведение вероятностей во float равно нулю.${logs}`;
    }
    if (level.kind === "logsum") return `${LOG_N} объектов, ${source}. Прогноз суммы натуральных логарифмов: ${fmt(s.guess)}.${s.revealed ? ` Ответ: ${fmt(answer(level), 1)}.` : ""}`;
    return `Перемножаем вероятности объектов, ${source}. Прогноз: произведение станет нулём на объекте ${s.guess}.${s.revealed ? ` На деле — на объекте ${answer(level)}.` : ""}`;
  },

  hint(s) {
    const kind = s.level.kind;
    if (kind === "compare") return s.hints <= 1 ? "Оба произведения — ноль, по ним модели не различить. Что не обнуляется?" : `Посчитайте суммы логарифмов: больше у модели ${better(s.level)}.`;
    if (kind === "logsum") {
      if (s.hints <= 1) return "Логарифм произведения — сумма логарифмов: S = Σ ln pᵢ. Оцените среднее ln pᵢ и умножьте на число объектов.";
      return `Среднее pᵢ около 0.5, ln 0.5 ≈ −0.69: S ≈ ${LOG_N} · (−0.7) ≈ ${fmt(-0.7 * LOG_N)}.`;
    }
    if (s.hints <= 1) return "Самое маленькое положительное число float64 — около 10⁻³²⁴. Ноль наступит, когда произведение станет меньше.";
    if (s.hints === 2) return "Каждое умножение сдвигает десятичный порядок на log₁₀ pᵢ: log₁₀ 0.5 ≈ −0.3, log₁₀ 0.9 ≈ −0.046. Делите 324 на средний сдвиг.";
    return `Ответ около ${Math.round(answer(s.level) / 50) * 50}.`;
  },

  generate(rng: Rng, difficulty: number): Level {
    const kind = KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!;
    return makeLevel(kind, rng);
  },

  feedback(s) {
    const { level } = s;
    if (level.kind === "compare") {
      const last = s.picks.at(-1);
      if (!last) return s.logs ? "Суммы логарифмов посчитаны. Какая модель лучше объясняет данные?" : "Произведения обеих моделей — ноль. Какая модель лучше объясняет данные?";
      if (last === better(level)) return `Верно: у модели ${last} сумма логарифмов больше — значит, больше и правдоподобие.`;
      if (last === "same") return "По произведениям — не различить: оба ноль. Но ноль здесь — из-за float, а не из-за моделей. Посчитайте суммы логарифмов.";
      return `Нет: сумма логарифмов у модели ${last} меньше${s.logs ? "" : " — посчитайте их"}.`;
    }
    if (!s.revealed) return level.kind === "logsum" ? "Выставьте прогноз суммы логарифмов и нажмите «Посчитать»." : "Выставьте прогноз и нажмите «Перемножить».";
    const a = answer(level);
    const acc = accuracy(level, s.guess);
    if (level.kind === "logsum") return `Сумма логарифмов — ${fmt(a, 1)}: обычное число, никакого нуля. ${acc >= 0.9 ? "Прогноз точный" : `Прогноз отличается в ${times(acc)} раза`}. А само произведение во float — ноль с объекта ${underflowAt(level.probs) || "—"}.`;
    return `Произведение стало нулём на объекте ${a}. ${acc >= 0.9 ? "Прогноз точный" : `Прогноз ${s.guess < a ? "меньше" : "больше"} в ${times(acc)} раза`}.`;
  },
};
