// Игра «Порог расходимости» (урок II.6; уровни 6–7 — «Квартиры» урока 1.2 «Основ ML»): градиентный спуск на f(x) = ½ xᵀAx. Шаг x := x − ηAx умножает
// координату вдоль собственного вектора на 1 − ηλ, поэтому спуск сходится ровно при 0 < η < 2/λ_max.
// Игрок подбирает η бегунком, запускает 30 шагов и сдаёт наибольший шаг, при котором спуск ещё сходится;
// очки — доля η от порога 2/λ_max. Модель чистая: уровни из rng(seed).
import type { GameSpec, Rng } from "../_engine/types";

export type Sym2 = readonly [number, number, number]; // A = [[a, b], [b, c]]
export type LevelKind = "one-d" | "diagonal" | "rotated" | "ill-conditioned" | "mixed" | "apartments" | "apartments-std";

export interface Level {
  kind: LevelKind;
  A: Sym2;
  x0: readonly [number, number];
  /** Верхняя граница бегунка η. */
  etaMax: number;
  /** Шаг бегунка η; по умолчанию ETA_STEP. */
  etaStep?: number;
}

export interface Run {
  eta: number;
  converged: boolean;
  path: [number, number][];
}

export interface State {
  level: Level;
  eta: number;
  runs: Run[];
  submitted: number | null;
  hints: number;
}

export type Action = { type: "set"; eta: number } | { type: "run" } | { type: "submit" } | { type: "reset" } | { type: "hint" };

export const LEVEL_KINDS: readonly LevelKind[] = ["one-d", "diagonal", "rotated", "ill-conditioned", "mixed", "apartments", "apartments-std"];
export const LEVELS = LEVEL_KINDS.length;
export const STEPS = 30;
/** Шаг бегунка η. */
export const ETA_STEP = 0.01;

export const LEVEL_NAMES: Record<LevelKind, string> = {
  "one-d": "одна переменная",
  diagonal: "диагональная A",
  rotated: "повёрнутые оси",
  "ill-conditioned": "вытянутая чаша",
  mixed: "решите сами",
  apartments: "квартиры: площадь как есть",
  "apartments-std": "квартиры после стандартизации",
};

/**
 * Матрицы H = ZᵀZ/n «Квартир» (урок 1.2 «Основ ML», mlf.datasets.apartments_full, 2000 объектов; закреплены
 * code/tests/test_lms.py): признаки 1 и площадь в десятках м² — и стандартизованные площадь и комнаты, где H —
 * корреляционная матрица (блок свободного члена с λ = 1 порога не задаёт).
 */
export const APARTMENTS_H: Sym2 = [1, 7.27, 60.29];
export const APARTMENTS_STD_H: Sym2 = [1, 0.85, 1];

export const DEBRIEF: Record<LevelKind, { question: string; answer: string }> = {
  "one-d": {
    question: "Почему при η чуть больше 2/a спуск расходится?",
    answer: "Шаг x := x − ηax умножает x на 1 − ηa. При η > 2/a этот множитель меньше −1: точка перескакивает минимум и с каждым шагом оказывается дальше от него.",
  },
  diagonal: {
    question: "Какое из двух чисел на диагонали задаёт порог?",
    answer: "Большее: каждая координата умножается на свой множитель 1 − ηλᵢ, и первым из отрезка (−1, 1) выходит множитель с наибольшим λ. Порог — 2/λ_max.",
  },
  rotated: {
    question: "Как найти порог, если A не диагональна?",
    answer: "Через собственные значения: в базисе собственных векторов A диагональна, и порог снова 2/λ_max. Элементы матрицы по отдельности порога не дают.",
  },
  "ill-conditioned": {
    question: "Почему у вытянутой чаши спуск медленный даже при лучшем шаге?",
    answer: "Шаг ограничен большим λ, а вдоль направления с малым λ множитель 1 − ηλ почти равен 1. Чем больше число обусловленности λ_max/λ_min, тем больше шагов нужно.",
  },
  mixed: {
    question: "Что общего у всех уровней?",
    answer: "Градиентный спуск на квадратичной функции сходится при 0 < η < 2/λ_max. Скорость решает самый медленный множитель max |1 − ηλᵢ|.",
  },
  apartments: {
    question: "Откуда в задаче о квартирах такой маленький порог?",
    answer: "H = ZᵀZ/n: средний квадрат площади в десятках м² — около 60, поэтому λ_max ≈ 61 и порог 2/λ_max ≈ 0.033. Свободный член и площадь в разных масштабах: эллипсы вытянуты, κ ≈ 500, и за 30 шагов спуск почти не продвигается вдоль долины.",
  },
  "apartments-std": {
    question: "Во сколько раз выросла граница шага после стандартизации и почему?",
    answer: "Примерно в 33 раза: после стандартизации H — корреляционная матрица, λ_max = 1 + r ≈ 1.85 вместо 61, порог ≈ 1.08 вместо 0.033. Для площади в м² λ_max ≈ 6000 и рост был бы в тысячи раз. Оставшаяся вытянутость — от корреляции площади и комнат, r ≈ 0.85.",
  },
};

/** Собственные значения λ₁ ≥ λ₂. */
export function eigs([a, b, c]: Sym2): readonly [number, number] {
  const m = (a + c) / 2;
  const r = Math.hypot((a - c) / 2, b);
  return [m + r, m - r];
}

/** Порог сходимости 2/λ_max. */
export const threshold = (A: Sym2) => 2 / eigs(A)[0];

/** Наибольший множитель max |1 − ηλᵢ|: меньше 1 — спуск сходится. */
export const rate = (A: Sym2, eta: number) => Math.max(...eigs(A).map((l) => Math.abs(1 - eta * l)));

/** Траектория градиентного спуска x := x − ηAx из x0, STEPS шагов. */
export function descend(level: Level, eta: number, steps = STEPS): [number, number][] {
  const [a, b, c] = level.A;
  const path: [number, number][] = [[level.x0[0], level.x0[1]]];
  for (let k = 0; k < steps; k++) {
    const [x, y] = path[path.length - 1]!;
    path.push([x - eta * (a * x + b * y), y - eta * (b * x + c * y)]);
  }
  return path;
}

export function makeLevel(kind: LevelKind, r: Rng): Level {
  let A: Sym2;
  switch (kind) {
    case "one-d": {
      // f = ½ a x²: вторая координата старта равна нулю, поэтому A = aI ведёт себя как одно число a
      const a = r.pick([1, 2, 4, 5]);
      A = [a, 0, a];
      break;
    }
    case "diagonal": {
      const [p, q] = r.shuffle([r.pick([2, 4, 5]), r.pick([0.5, 1])]);
      A = [p!, 0, q!];
      break;
    }
    case "rotated":
    case "mixed": {
      // A = λ₁uuᵀ + λ₂vvᵀ с целыми элементами: перебираем, пока оба собственных значения положительны
      for (;;) {
        A = [r.int(1, 5), r.nonzero(-2, 2), r.int(1, 5)];
        const [l1, l2] = eigs(A);
        if (l2 > 0.3 && l1 < 7) break;
      }
      break;
    }
    case "ill-conditioned":
      A = [r.pick([8, 10]), 0, r.pick([0.5, 0.25])];
      break;
    case "apartments":
      A = APARTMENTS_H;
      break;
    case "apartments-std":
      A = APARTMENTS_STD_H;
      break;
  }
  const one = kind === "one-d";
  const x0: [number, number] = one ? [r.pick([-2.5, 2.5]), 0] : [r.pick([-2.5, 2.5]), r.pick([-2, 2])];
  const t = threshold(A);
  // бегунок до полутора порогов, с запасом на шаг; у малого порога — шаг бегунка мельче
  const etaStep = t < 0.2 ? 0.001 : ETA_STEP;
  return { kind, A, x0, etaMax: Math.ceil((1.5 * t) / etaStep) * etaStep, ...(etaStep !== ETA_STEP && { etaStep }) };
}

const f2 = (x: number, digits = 2) => String(Math.round(x * 10 ** digits) / 10 ** digits).replace("-", "−");
/** Шаг бегунка уровня и число знаков η. */
export const etaStepOf = (level: Level) => level.etaStep ?? ETA_STEP;
export const etaDigits = (level: Level) => (etaStepOf(level) < ETA_STEP ? 3 : 2);
const fe = (level: Level, eta: number) => f2(eta, etaDigits(level));
export const aText = ([a, b, c]: Sym2, one = false) => (one ? `a = ${f2(a)}` : `A = (${f2(a)} ${f2(b)}; ${f2(b)} ${f2(c)})`);

const clampEta = (level: Level, eta: number) => {
  const st = etaStepOf(level);
  return Math.min(level.etaMax, Math.max(st, Math.round(eta / st) * st));
};
const last = (s: State) => s.runs[s.runs.length - 1];

export const divergence: GameSpec<State, Action, Level> & { feedback(state: State): string; canSubmit(state: State): boolean } = {
  id: "calc.divergence",
  version: 1,
  concepts: ["calc.gradient-descent", "la.eigen"],

  init: (level) => ({ level, eta: clampEta(level, threshold(level.A) / 4), runs: [], submitted: null, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return divergence.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (state.submitted !== null) return state;
    switch (action.type) {
      case "set":
        return { ...state, eta: clampEta(state.level, action.eta) };
      case "run": {
        const converged = rate(state.level.A, state.eta) < 1;
        return { ...state, runs: [...state.runs, { eta: state.eta, converged, path: descend(state.level, state.eta) }] };
      }
      case "submit":
        return divergence.canSubmit(state) ? { ...state, submitted: state.eta } : state;
    }
  },

  /** Сдать можно только проверенный запуском сходящийся шаг. */
  canSubmit: (s) => s.submitted === null && last(s)?.eta === s.eta && last(s)!.converged,

  status: (state) => (state.submitted !== null ? "solved" : "playing"),

  /** Доля сданного шага от порога 2/λ_max (меньше 1, раз шаг сходится). */
  score: (state) => (state.submitted === null ? 0 : state.submitted / threshold(state.level.A)),

  describe(state) {
    const one = state.level.kind === "one-d";
    const run = last(state);
    const runText = run ? ` Последний запуск: η = ${fe(state.level, run.eta)}, ${run.converged ? "сходится" : "расходится"}.` : "";
    return `Градиентный спуск на f = ½ ${one ? "a x²" : "xᵀAx"}, ${aText(state.level.A, one)}, ${STEPS} шагов. Шаг η = ${fe(state.level, state.eta)}.${runText}`;
  },

  hint(state) {
    const [l1, l2] = eigs(state.level.A);
    if (state.hints <= 1) return state.level.kind === "one-d" ? "Один шаг умножает x на 1 − ηa. При каком η этот множитель равен −1?" : "Вдоль собственного вектора шаг умножает координату на 1 − ηλ. Порог задаёт наибольшее λ.";
    return `Собственные значения A: ${f2(l1)} и ${f2(l2)}. Порог 2/λ_max = ${fe(state.level, 2 / l1)}.`;
  },

  generate: (rng, difficulty) => makeLevel(LEVEL_KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!, rng),

  feedback(state) {
    const t = threshold(state.level.A);
    const e = (x: number) => fe(state.level, x);
    if (state.submitted !== null) return `Сдан шаг η = ${e(state.submitted)}: ${Math.round((100 * state.submitted) / t)} % от порога 2/λ_max = ${e(t)}.`;
    const run = last(state);
    if (!run) return "Выберите шаг η и запустите спуск.";
    if (run.eta !== state.eta) return `Шаг изменён на η = ${e(state.eta)} — запустите спуск, чтобы проверить его.`;
    const q = rate(state.level.A, run.eta);
    return run.converged
      ? `η = ${e(run.eta)}: сходится, расстояние до минимума за шаг умножается на ${f2(q, q > 0.99 ? 3 : 2)}. Можно сдать или попробовать шаг больше.`
      : `η = ${e(run.eta)}: расходится, множитель ${f2(q)} больше 1. Уменьшите шаг.`;
  },
};

/** Бот для тестов: наибольший шаг сетки ниже порога, запуск, сдача. */
export function solve(state: State): Action[] {
  const t = threshold(state.level.A);
  const st = etaStepOf(state.level);
  const eta = Math.ceil(t / st - 1 - 1e-9) * st;
  return [{ type: "set", eta }, { type: "run" }, { type: "submit" }];
}
