// Игра «Охота на собственные векторы» (урок I.9): поворачивать единичный вектор v и поймать направление, где Av
// параллелен v; затем назвать собственное значение λ (Av = λv). На уровне с поворотом вещественных собственных
// векторов нет — правильный ход «Таких направлений нет». Модель чистая: уровни из rng(seed), без Math.random и Date.
import type { GameSpec, Rng } from "../_engine/types";

export type Mat2 = readonly [readonly [number, number], readonly [number, number]];
export type Kind = "diagonal" | "symmetric" | "negative" | "skew" | "mixed" | "rotation";

export interface Eigen {
  /** Направление в градусах, [0, 180): v и −v — одно направление. */
  angle: number;
  lambda: number;
}

export interface Level {
  kind: Kind;
  A: Mat2;
  /** Вещественные собственные направления; пусто — у поворота. */
  eigen: Eigen[];
}

export interface Found {
  angle: number;
  lambda: number;
}

export interface State {
  level: Level;
  /** Угол v в градусах, [0, 180]. */
  angle: number;
  found: Found[];
  /** Пойманное направление, для которого ещё не названо λ. */
  pending: number | null;
  claimedNone: boolean;
  moves: number;
  misses: number;
  hints: number;
}

export type Action =
  | { type: "set"; angle: number }
  | { type: "catch" }
  | { type: "lambda"; value: number }
  | { type: "none" }
  | { type: "reset" }
  | { type: "hint" };

export const KINDS: readonly Kind[] = ["diagonal", "symmetric", "negative", "skew", "mixed", "rotation"];
export const LEVELS = KINDS.length;
/** Допуск по направлению: v не дальше 1.5° от собственного направления (угол v — целые градусы). */
export const TOL = 1.5;

export const KIND_NAMES: Record<Kind, string> = {
  diagonal: "диагональная матрица",
  symmetric: "симметричная матрица",
  negative: "отрицательное λ",
  skew: "не перпендикулярные направления",
  mixed: "решите сами",
  rotation: "поворот",
};

export const DEBRIEF: Record<Kind, { question: string; answer: string }> = {
  diagonal: {
    question: "Почему у диагональной матрицы собственные векторы — оси?",
    answer: "Она растягивает каждую ось по отдельности: e₁ переходит в a₁₁e₁, e₂ — в a₂₂e₂. Собственные значения — диагональ.",
  },
  symmetric: {
    question: "Что общего у двух найденных направлений?",
    answer: "Они перпендикулярны. Так у любой симметричной матрицы: собственные векторы для разных λ ортогональны (спектральная теорема).",
  },
  negative: {
    question: "Как выглядит собственный вектор с λ < 0?",
    answer: "Av смотрит в противоположную сторону от v: вектор переворачивается, оставаясь на своей прямой.",
  },
  skew: {
    question: "Обязаны ли собственные направления быть перпендикулярными?",
    answer: "Нет — только у симметричной матрицы. Здесь A несимметрична, и угол между направлениями не прямой.",
  },
  mixed: {
    question: "Как найти собственные значения без поиска на рисунке?",
    answer: "Из характеристического уравнения det(A − λI) = 0: для 2 × 2 это λ² − (tr A)λ + det A = 0.",
  },
  rotation: {
    question: "Почему здесь не нашлось ни одного направления?",
    answer: "Поворот на 90° уводит каждый вектор с его прямой. Уравнение λ² + 1 = 0 не имеет вещественных корней.",
  },
};

const rad = (deg: number) => (deg * Math.PI) / 180;
export const unit = (deg: number): readonly [number, number] => [Math.cos(rad(deg)) + 0, Math.sin(rad(deg)) + 0];
export const apply = (A: Mat2, [x, y]: readonly [number, number]): readonly [number, number] => [A[0][0] * x + A[0][1] * y + 0, A[1][0] * x + A[1][1] * y + 0];

/** Угол между v и Av по модулю 180°: 0 — параллельны (в ту же сторону или в противоположную). */
export function lineAngle(A: Mat2, deg: number): number {
  const v = unit(deg);
  const w = apply(A, v);
  const n = Math.hypot(...w);
  if (n < 1e-12) return 0; // Av = 0: v в ядре, λ = 0
  const cross = v[0] * w[1] - v[1] * w[0];
  const dot = v[0] * w[0] + v[1] * w[1];
  const a = Math.abs((Math.atan2(cross, dot) * 180) / Math.PI);
  return Math.min(a, 180 - a);
}

/** λ для единичного v: проекция Av на v со знаком. */
export const rayleigh = (A: Mat2, deg: number) => {
  const v = unit(deg);
  const w = apply(A, v);
  return v[0] * w[0] + v[1] * w[1] + 0;
};

const norm180 = (a: number) => ((a % 180) + 180) % 180;
const dirDiff = (a: number, b: number) => {
  const d = Math.abs(norm180(a) - norm180(b));
  return Math.min(d, 180 - d);
};

/** Матрица с заданными собственными векторами (углами) и значениями: A = VΛV⁻¹. */
export function fromEigen(e: readonly Eigen[]): Mat2 {
  const [p, q] = e as [Eigen, Eigen];
  const [v1, v2] = [unit(p.angle), unit(q.angle)];
  const det = v1[0] * v2[1] - v2[0] * v1[1];
  const inv = [[v2[1] / det, -v2[0] / det], [-v1[1] / det, v1[0] / det]];
  const r = (x: number) => Math.round(x * 1e9) / 1e9 + 0;
  const VL = [[v1[0] * p.lambda, v2[0] * q.lambda], [v1[1] * p.lambda, v2[1] * q.lambda]];
  const m = (i: number, j: number) => r(VL[i]![0]! * inv[0]![j]! + VL[i]![1]! * inv[1]![j]!);
  return [[m(0, 0), m(0, 1)], [m(1, 0), m(1, 1)]];
}

/** Направления с «ручными» матрицами: оси, диагонали, 2:1. */
const DIRS = [0, 90, 45, 135, Math.atan2(1, 2) * (180 / Math.PI), Math.atan2(2, 1) * (180 / Math.PI), 180 - Math.atan2(1, 2) * (180 / Math.PI)];

export function makeLevel(kind: Kind, r: Rng): Level {
  switch (kind) {
    case "diagonal": {
      const [a, b] = r.shuffle([2, 0.5, 3, -1]).slice(0, 2) as [number, number];
      return { kind, A: [[a, 0], [0, b]], eigen: [{ angle: 0, lambda: a }, { angle: 90, lambda: b }] };
    }
    case "symmetric": {
      const [s, t] = r.pick([[2, 1], [3, 1], [2, -1], [3, 2]] as const);
      // [[s, t], [t, s]]: (1, 1) — λ = s + t, (1, −1) — λ = s − t
      return { kind, A: [[s, t], [t, s]], eigen: [{ angle: 45, lambda: s + t }, { angle: 135, lambda: s - t }] };
    }
    case "negative": {
      const k = r.pick([1, 2]);
      return { kind, A: [[0, k], [k, 0]], eigen: [{ angle: 45, lambda: k }, { angle: 135, lambda: -k }] };
    }
    case "skew": {
      const e: Eigen[] = [{ angle: 0, lambda: r.pick([2, 3]) }, { angle: 45, lambda: r.pick([-1, 0.5]) }];
      return { kind, A: fromEigen(e), eigen: e };
    }
    case "mixed": {
      for (;;) {
        const [a1, a2] = r.shuffle(DIRS).slice(0, 2) as [number, number];
        if (dirDiff(a1, a2) < 30) continue;
        const [l1, l2] = r.shuffle([3, 2, -1, 0.5, -2]).slice(0, 2) as [number, number];
        const e: Eigen[] = [{ angle: norm180(a1), lambda: l1 }, { angle: norm180(a2), lambda: l2 }];
        return { kind, A: fromEigen(e), eigen: e };
      }
    }
    case "rotation": {
      const s = r.pick([1, 2]);
      return { kind, A: [[0, -s], [s, 0]], eigen: [] };
    }
  }
}

/** Варианты λ для пойманного направления: верное, со сменой знака и соседнее. */
export function lambdaOptions(state: State): number[] {
  if (state.pending === null) return [];
  const e = nearest(state.level, state.pending)!;
  const set = new Set([e.lambda, -e.lambda, e.lambda + 1]);
  if (e.lambda === 0) set.add(1);
  return [...set].sort((a, b) => a - b);
}

/** Собственное направление уровня рядом с углом (в пределах допуска по направлению Av ∥ v). */
export function nearest(level: Level, deg: number): Eigen | undefined {
  return level.eigen.find((e) => dirDiff(e.angle, deg) < 5);
}

const done = (s: State) => (s.level.eigen.length === 0 ? s.claimedNone : s.found.length === s.level.eigen.length);

export const eigenHunt: GameSpec<State, Action, Level> & {
  feedback(state: State): string;
  optimal(state: State): number;
} = {
  id: "la.eigen-hunt",
  version: 1,
  concepts: ["la.eigen"],

  init: (level) => ({ level, angle: 20, found: [], pending: null, claimedNone: false, moves: 0, misses: 0, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return eigenHunt.init(state.level, undefined as unknown as Rng);
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (done(state)) return state;
    switch (action.type) {
      case "set": {
        const angle = Math.max(0, Math.min(180, Math.round(action.angle)));
        return angle === state.angle ? state : { ...state, angle, moves: state.moves + 1, pending: null };
      }
      case "catch": {
        const e = state.level.eigen.find((x) => dirDiff(x.angle, state.angle) <= TOL);
        if (!e) return { ...state, misses: state.misses + 1 };
        if (state.found.some((f) => dirDiff(f.angle, e.angle) < 1)) return state;
        return { ...state, pending: e.angle };
      }
      case "lambda": {
        if (state.pending === null) return state;
        const e = nearest(state.level, state.pending)!;
        if (Math.abs(action.value - e.lambda) > 1e-9) return { ...state, misses: state.misses + 1 };
        return { ...state, found: [...state.found, { angle: e.angle, lambda: e.lambda }], pending: null };
      }
      case "none":
        return state.level.eigen.length === 0 ? { ...state, claimedNone: true } : { ...state, misses: state.misses + 1 };
    }
  },

  status: (state) => (done(state) ? "solved" : "playing"),

  /** Каждый промах — ложная поимка, неверное λ или неверное «нет» — уменьшает счёт. */
  score: (state) => (done(state) ? 1 / (1 + state.misses) : 0),

  describe(state) {
    const v = unit(state.angle);
    const w = apply(state.level.A, v);
    const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");
    return (
      `Угол v — ${state.angle}°, v = (${f(v[0])}, ${f(v[1])}), Av = (${f(w[0])}, ${f(w[1])}); угол между прямыми v и Av — ${f(lineAngle(state.level.A, state.angle))}°. ` +
      `Найдено направлений: ${state.found.length}${state.level.eigen.length ? ` из ${state.level.eigen.length}` : ""}.`
    );
  },

  hint(state) {
    const { level } = state;
    if (state.hints <= 1) return "Поворачивайте v и следите за углом между прямыми v и Av: он должен стать нулевым. Av может смотреть и в обратную сторону.";
    if (!level.eigen.length) return "Попробуйте все углы: обращается ли угол между v и Av в ноль хоть где-нибудь?";
    const tr = level.A[0][0] + level.A[1][1];
    const det = level.A[0][0] * level.A[1][1] - level.A[0][1] * level.A[1][0];
    const f = (x: number) => String(Math.round(x * 100) / 100).replace("-", "−");
    if (state.hints === 2) return `Характеристическое уравнение: λ² − ${f(tr)}λ + ${f(det)} = 0.`;
    const left = level.eigen.find((e) => !state.found.some((x) => dirDiff(x.angle, e.angle) < 1));
    return left ? `Направление около ${Math.round(left.angle)}°, λ = ${f(left.lambda)}.` : "Все направления найдены.";
  },

  generate(rng: Rng, difficulty: number): Level {
    const kind = KINDS[Math.min(Math.max(1, Math.floor(difficulty)), LEVELS) - 1]!;
    return makeLevel(kind, rng);
  },

  feedback(state) {
    const { level } = state;
    if (done(state)) return level.eigen.length ? `Найдены оба направления${state.misses ? `, промахов — ${state.misses}` : " без промахов"}.` : "Верно: вещественных собственных векторов у поворота нет.";
    if (state.pending !== null) return "Поймано! Av лежит на той же прямой, что v. Чему равно λ?";
    const a = lineAngle(level.A, state.angle);
    return `Угол между прямыми v и Av — ${Math.round(a)}°.${state.misses ? " Мимо: нужно, чтобы угол стал почти нулевым." : ""}`;
  },

  optimal: (state) => state.level.eigen.length || 1,
};

/** Бот для тестов: повернуть v на каждое собственное направление, поймать, назвать λ; у поворота — «нет». */
export function solve(state: State): Action[] {
  if (!state.level.eigen.length) return [{ type: "none" }];
  return state.level.eigen.flatMap((e) => [{ type: "set", angle: Math.round(e.angle) }, { type: "catch" }, { type: "lambda", value: e.lambda }] as Action[]);
}
