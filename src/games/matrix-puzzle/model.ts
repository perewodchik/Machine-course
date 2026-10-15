// Игра «Матрица-пазл» (урок I.4): подобрать матрицу A 2 × 2, которая переводит букву F в пунктирный контур.
// Ход — изменить один элемент A на шаг. Столбцы A — образы базисных векторов: Ae₁ и Ae₂ видны стрелками,
// поэтому стратегия «поставить столбцы на место» решает уровень за минимум ходов.
// Модель чистая: уровни из rng(seed), без Math.random и Date (контракт — src/games/_engine/types.ts).
import type { GameSpec, Rng } from "../_engine/types";

export type Vec2 = readonly [number, number];
export type Mat2 = readonly [Vec2, Vec2];
export type Family = "stretch" | "shear" | "rotation" | "reflection" | "singular" | "general";

export interface Level {
  family: Family;
  target: Mat2;
  /** Шаг изменения элемента: 1, а в «сжатии в линию» — 0.5. */
  step: number;
}

export interface State {
  level: Level;
  A: Mat2;
  moves: number;
  hints: number;
}

export type Action = { type: "nudge"; i: 0 | 1; j: 0 | 1; dir: 1 | -1 } | { type: "reset" } | { type: "hint" };

/** Буква F: несимметрична, поэтому видны и поворот, и отражение. */
export const SHAPE: readonly Vec2[] = [
  [0, 0], [0.8, 0], [0.8, 1.2], [1.6, 1.2], [1.6, 1.8], [0.8, 1.8], [0.8, 2.4], [2, 2.4], [2, 3], [0, 3],
];
/** Опорные вершины F для текстового описания: (0.8, 0) = 0.8·e₁ и (0, 3) = 3·e₂. */
export const LANDMARKS: readonly Vec2[] = [[0.8, 0], [0, 3]];
export const IDENTITY: Mat2 = [[1, 0], [0, 1]];
/** Элементы A не выходят за [−LIMIT, LIMIT]: фигура остаётся на поле. */
export const LIMIT = 4;
/** Уровней в партии: семейства по порядку, дальше — любая матрица. */
export const LEVELS = 5;

export const FAMILY_NAMES: Record<Family, string> = {
  stretch: "растяжение",
  shear: "сдвиг",
  rotation: "поворот",
  reflection: "отражение",
  singular: "сжатие в линию",
  general: "любая матрица",
};

/** Разбор после уровня: вопрос переводит стратегию в формулу. */
export const DEBRIEF: Record<Family, { question: string; answer: string }> = {
  stretch: {
    question: "Во сколько раз изменилась площадь буквы F? Сравните с det A.",
    answer: "Площадь умножилась на произведение растяжений по осям — это и есть det A для диагональной матрицы.",
  },
  shear: {
    question: "Сдвиг перекосил F, но площадь не изменилась. Чему равен det A?",
    answer: "det A = 1: сдвиг переставляет площадь, но не меняет её. Определитель — коэффициент изменения площади.",
  },
  rotation: {
    question: "Площадь F после поворота та же, и буква не отразилась. Какой det A?",
    answer: "det A = 1. Столбцы повёрнутой матрицы — повёрнутые e₁ и e₂: единичной длины и перпендикулярны.",
  },
  reflection: {
    question: "Буква F стала зеркальной. Какой знак у det A?",
    answer: "det A = −1: площадь та же, а знак минус означает, что ориентация сменилась — F читается в зеркале.",
  },
  singular: {
    question: "F сплющилась в отрезок. Можно ли подобрать матрицу, которая вернёт её обратно?",
    answer: "Нет: столбцы A пропорциональны, det A = 0, и точки F склеились. У вырожденной матрицы нет обратной.",
  },
  general: {
    question: "Как собрать любую матрицу за минимум ходов?",
    answer: "Первый столбец — точка, куда уходит e₁, второй — куда уходит e₂. Ставьте столбцы по одному.",
  },
};

const EPS = 1e-9;
const snap = (v: number, step: number) => Math.round(v / step) * step + 0; // + 0: без −0
export const apply = (A: Mat2, [x, y]: Vec2): Vec2 => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
export const det = (A: Mat2) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
export const column = (A: Mat2, j: 0 | 1): Vec2 => [A[0][j], A[1][j]];
export const columnDone = (A: Mat2, T: Mat2, j: 0 | 1) => Math.abs(A[0][j] - T[0][j]) < EPS && Math.abs(A[1][j] - T[1][j]) < EPS;
export const same = (A: Mat2, T: Mat2) => columnDone(A, T, 0) && columnDone(A, T, 1);

/** Наименьшее число ходов от from до to: каждый ход меняет один элемент на шаг. */
export function optimalMoves(from: Mat2, to: Mat2, step: number): number {
  let n = 0;
  for (const i of [0, 1] as const) for (const j of [0, 1] as const) n += Math.round(Math.abs(to[i][j] - from[i][j]) / step);
  return n;
}

/** Область поля под уровень: видны начало координат, исходная F и цель; клетка квадратная, поле не меняется за уровень. */
export function viewport(level: Level): { x: [number, number]; y: [number, number]; step: number } {
  const pts = [[0, 0] as const, ...SHAPE, ...SHAPE.map((p) => apply(level.target, p))];
  const lo = [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1]))];
  const hi = [Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
  const size = Math.ceil(Math.max(hi[0]! - lo[0]!, hi[1]! - lo[1]!)) + 2; // по клетке запаса с краёв
  const range = (a: number, b: number): [number, number] => {
    const from = Math.floor((a + b) / 2 - size / 2);
    return [from, from + size];
  };
  return { x: range(lo[0]!, hi[0]!), y: range(lo[1]!, hi[1]!), step: size > 10 ? 2 : 1 };
}

/** Число без хвостов и с минусом «−»: 2, −0.5. */
export const fmtNum = (v: number) => String(Math.round(v * 100) / 100 + 0).replace("-", "−");
const fmtVec = ([x, y]: Vec2) => `(${fmtNum(x)}, ${fmtNum(y)})`;

function generateLevel(rng: Rng, difficulty: number): Level {
  const d = Math.max(1, Math.floor(difficulty));
  if (d === 1) {
    const a = rng.pick([2, 3]);
    const b = rng.pick([1, 2]);
    const target: Mat2 = rng.next() < 0.5 ? [[a, 0], [0, b]] : [[b, 0], [0, a]];
    return { family: "stretch", target, step: 1 };
  }
  if (d === 2) {
    const k = rng.pick([-2, -1, 1, 2]);
    const target: Mat2 = rng.next() < 0.5 ? [[1, k], [0, 1]] : [[1, 0], [k, 1]];
    return { family: "shear", target, step: 1 };
  }
  if (d === 3) {
    const target = rng.pick<Mat2>([[[0, -1], [1, 0]], [[-1, 0], [0, -1]], [[0, 1], [-1, 0]]]);
    return { family: "rotation", target, step: 1 };
  }
  if (d === 4) {
    const target = rng.pick<Mat2>([[[-1, 0], [0, 1]], [[1, 0], [0, -1]], [[0, 1], [1, 0]], [[0, -1], [-1, 0]]]);
    return { family: "reflection", target, step: 1 };
  }
  if (d === 5) {
    // вырожденная: второй столбец — первый, умноженный на k (k = 0 тоже: F сплющивается в отрезок)
    const u = rng.pick<Vec2>([[1, 0], [0, 1], [1, 1], [1, -1], [2, 1]]);
    const k = rng.pick([0, 0.5, -1, 2]);
    const v: Vec2 = [u[0] * k + 0, u[1] * k + 0];
    const target: Mat2 = rng.next() < 0.5 ? [[u[0], v[0]], [u[1], v[1]]] : [[v[0], u[0]], [v[1], u[1]]];
    return { family: "singular", target, step: 0.5 };
  }
  // любая невырожденная целая матрица с элементами из [−2, 2], хотя бы три хода от единичной
  for (;;) {
    const target: Mat2 = [[rng.int(-2, 2), rng.int(-2, 2)], [rng.int(-2, 2), rng.int(-2, 2)]];
    if (det(target) !== 0 && optimalMoves(IDENTITY, target, 1) >= 3) return { family: "general", target, step: 1 };
  }
}

export const matrixPuzzle: GameSpec<State, Action, Level> & {
  feedback(state: State): string;
  optimal(state: State): number;
} = {
  id: "la.matrix-puzzle",
  version: 1,
  concepts: ["la.matmul"],

  init: (level) => ({ level, A: IDENTITY, moves: 0, hints: 0 }),

  step(state, action) {
    if (action.type === "reset") return { ...state, A: IDENTITY, moves: 0 };
    if (action.type === "hint") return { ...state, hints: state.hints + 1 };
    if (same(state.A, state.level.target)) return state; // уровень решён: поле застыло до перехода
    const { i, j, dir } = action;
    const value = Math.max(-LIMIT, Math.min(LIMIT, snap(state.A[i][j] + dir * state.level.step, state.level.step)));
    if (value === state.A[i][j]) return state; // упёрлись в край: ход не считается
    const rows = state.A.map((r) => [...r]) as [number, number][];
    rows[i]![j] = value;
    return { ...state, A: [rows[0]!, rows[1]!] as unknown as Mat2, moves: state.moves + 1 };
  },

  status: (state) => (same(state.A, state.level.target) ? "solved" : "playing"),

  /** Доля оптимума: 1 — решено за минимум ходов, 0.5 — вдвое больше; пока не решено — 0. */
  score(state) {
    if (!same(state.A, state.level.target)) return 0;
    const best = optimalMoves(IDENTITY, state.level.target, state.level.step);
    return state.moves === 0 ? 1 : Math.min(1, best / state.moves);
  },

  describe(state) {
    const { A, level } = state;
    const [p, q] = LANDMARKS.map((v) => fmtVec(apply(A, v)));
    const [tp, tq] = LANDMARKS.map((v) => fmtVec(apply(level.target, v)));
    const cols = ([0, 1] as const).map((j) => `Ae${j === 0 ? "₁" : "₂"} = ${fmtVec(column(A, j))}${columnDone(A, level.target, j) ? ", на месте" : ""}`);
    return (
      `A: первая строка ${fmtNum(A[0][0])}, ${fmtNum(A[0][1])}; вторая строка ${fmtNum(A[1][0])}, ${fmtNum(A[1][1])}. det A = ${fmtNum(det(A))}. ` +
      `${cols.join("; ")}. Угол F (0.8, 0) сейчас в ${p}, нужен в ${tp}; вершина (0, 3) сейчас в ${q}, нужна в ${tq}. Ходов: ${state.moves}.`
    );
  },

  hint(state) {
    const { A, level } = state;
    const j: 0 | 1 = columnDone(A, level.target, 0) ? 1 : 0;
    const e = j === 0 ? "e₁" : "e₂";
    const corner = j === 0 ? "угол F (0.8, 0) — это 0.8·e₁" : "вершина F (0, 3) — это 3·e₂";
    if (state.hints <= 1) return `${j === 0 ? "Первый" : "Второй"} столбец A — это A${e}, образ ${e}. Куда ${e} должен попасть, чтобы F легла на контур?`;
    if (state.hints === 2) return `${corner[0]!.toUpperCase()}${corner.slice(1)}: найдите эту точку на контуре и поделите её координаты на ${j === 0 ? "0.8" : "3"}.`;
    return `Цель отправляет ${e} в ${fmtVec(column(level.target, j))}: поставьте этот столбец.`;
  },

  generate: generateLevel,

  feedback(state) {
    const { A, level } = state;
    if (same(A, level.target)) {
      const best = optimalMoves(IDENTITY, level.target, level.step);
      return state.moves <= best ? `Фигуры совпали за ${state.moves} — это минимум.` : `Фигуры совпали за ${state.moves}; минимум — ${best}.`;
    }
    const ok1 = columnDone(A, level.target, 0);
    const ok2 = columnDone(A, level.target, 1);
    if (ok1) return "Первый столбец на месте: e₁ попадает куда нужно. Осталось решить, куда отправить e₂.";
    if (ok2) return "Второй столбец на месте. Куда должен попасть e₁?";
    return "Пока ни один базисный вектор не попадает в нужную точку.";
  },

  optimal: (state) => optimalMoves(IDENTITY, state.level.target, state.level.step),
};

/** Бот для тестов и демо: двигает каждый элемент к цели — решает уровень за минимум ходов. */
export function solve(state: State): Action[] {
  const actions: Action[] = [];
  for (const i of [0, 1] as const) {
    for (const j of [0, 1] as const) {
      const delta = Math.round((state.level.target[i][j] - state.A[i][j]) / state.level.step);
      for (let k = 0; k < Math.abs(delta); k++) actions.push({ type: "nudge", i, j, dir: delta > 0 ? 1 : -1 });
    }
  }
  return actions;
}
