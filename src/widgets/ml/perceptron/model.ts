// Модель виджета «Перцептрон» (урок 1.5 «Основ ML»): две задачи на тех же 300 «Квартирах» (data.json — ячейка урока).
// «Эконом или бизнес» — классы разделимы прямой, перцептрон останавливается; «бизнес или нет» — неразделимы,
// ошибки в эпохе не кончаются. Поправка θ := θ + α(y − h)x только на ошибках, α = 1, старт θ = 0.
import raw from "./data.json";

export type Task = "separable" | "overlap";

export interface Problem {
  X: number[][];
  y: number[];
}

const all = raw.z1.map((a, i) => [1, a, raw.z2[i]!]);

export function problem(task: Task): Problem {
  if (task === "separable") {
    const idx = raw.y.map((c, i) => (c === 1 ? -1 : i)).filter((i) => i >= 0);
    return { X: idx.map((i) => all[i]!), y: idx.map((i) => (raw.y[i] === 2 ? 1 : 0)) };
  }
  return { X: all, y: raw.y.map((c) => (c === 2 ? 1 : 0)) };
}

export interface State {
  theta: number[];
  /** Позиция в текущей эпохе. */
  pos: number;
  epoch: number;
  /** Ошибок в каждой завершённой эпохе. */
  mistakes: number[];
  current: number;
  last: { i: number; before: number[]; after: number[] } | null;
}

export const initial = (): State => ({ theta: [0, 0, 0], pos: 0, epoch: 0, mistakes: [], current: 0, last: null });

const h = (theta: readonly number[], x: readonly number[]) => (theta[0]! * x[0]! + theta[1]! * x[1]! + theta[2]! * x[2]! >= 0 ? 1 : 0);

/** До следующей поправки: идём по объектам эпохи, верные пропускаем; конец эпохи записываем. С atEpochEnd —
 * останавливаемся и на конце эпохи. */
export function step(p: Problem, s: State, atEpochEnd = false): State {
  let { pos, epoch, mistakes, current } = s;
  for (let guard = 0; guard < 2 * p.X.length + 1; guard++) {
    if (pos === p.X.length) {
      mistakes = [...mistakes, current];
      if (current === 0) return { ...s, pos, epoch, mistakes, current, last: null };
      pos = 0;
      epoch++;
      current = 0;
      if (atEpochEnd) return { ...s, pos, epoch, mistakes, current, last: null };
    }
    const x = p.X[pos]!;
    const yi = p.y[pos]!;
    if (h(s.theta, x) !== yi) {
      const after = s.theta.map((v, c) => v + (yi - h(s.theta, x)) * x[c]!);
      return { theta: after, pos: pos + 1, epoch, mistakes, current: current + 1, last: { i: pos, before: s.theta, after } };
    }
    pos++;
  }
  return s;
}

/** Дойти до конца текущей эпохи. */
export function finishEpoch(p: Problem, s: State): State {
  let t = s;
  const done = t.mistakes.length;
  for (let guard = 0; guard < p.X.length + 1 && t.mistakes.length === done; guard++) {
    const n = step(p, t, true);
    if (n === t) break;
    t = n;
  }
  return t;
}

export const converged = (s: State) => s.mistakes.at(-1) === 0;
export const errors = (p: Problem, theta: readonly number[]) => p.X.filter((x, i) => h(theta, x) !== p.y[i]).length;
export { h as predict };
