// Виджет «Деформация сетки» (урок I.4): матрица 2 × 2 переводит клетку плоскости в сетку параллелограммов.
// Линейное отображение переводит прямые в прямые, поэтому образ линии сетки — отрезок между образами её концов.
// Чистая логика без DOM: представление — GridMap.tsx.

export type Vec2 = readonly [number, number];
export type Mat2 = readonly [Vec2, Vec2];

export const IDENTITY: Mat2 = [[1, 0], [0, 1]];

/** Готовые матрицы для кнопок виджета: семейства, которые урок разбирает по очереди. */
export const PRESETS: readonly { id: string; name: string; matrix: Mat2 }[] = [
  { id: "identity", name: "Единичная", matrix: [[1, 0], [0, 1]] },
  { id: "stretch", name: "Растяжение", matrix: [[2, 0], [0, 0.5]] },
  { id: "shear", name: "Сдвиг", matrix: [[1, 1], [0, 1]] },
  { id: "rotation", name: "Поворот на 90°", matrix: [[0, -1], [1, 0]] },
  { id: "reflection", name: "Отражение", matrix: [[1, 0], [0, -1]] },
  { id: "singular", name: "Вырожденная", matrix: [[1, 2], [0.5, 1]] },
];

export const apply = (A: Mat2, [x, y]: Vec2): Vec2 => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
export const det = (A: Mat2) => A[0][0] * A[1][1] - A[0][1] * A[1][0];
export const column = (A: Mat2, j: 0 | 1): Vec2 => [A[0][j], A[1][j]];

/** Произведение AB: отображение «сначала B, потом A». */
export function compose(A: Mat2, B: Mat2): Mat2 {
  const c = (i: 0 | 1, j: 0 | 1) => A[i][0] * B[0][j] + A[i][1] * B[1][j];
  return [[c(0, 0), c(0, 1)], [c(1, 0), c(1, 1)]];
}

export interface Segment {
  from: Vec2;
  to: Vec2;
  /** Ось координат (x = 0 или y = 0): рисуется заметнее остальных линий. */
  axis: boolean;
}

/** Образы линий сетки x = k и y = k, k = −n…n, в квадрате [−n, n]². */
export function gridImage(A: Mat2, n: number): Segment[] {
  const out: Segment[] = [];
  for (let k = -n; k <= n; k++) {
    out.push({ from: apply(A, [k, -n]), to: apply(A, [k, n]), axis: k === 0 });
    out.push({ from: apply(A, [-n, k]), to: apply(A, [n, k]), axis: k === 0 });
  }
  return out;
}

/** Образ единичного квадрата: параллелограмм на столбцах A, площадь — |det A|. */
export const unitSquare = (A: Mat2): Vec2[] => [[0, 0], column(A, 0), apply(A, [1, 1]), column(A, 1)];

/** Число с минусом «−» и без хвостов: 0.75, −1. */
export const fmtNum = (v: number) => String(Math.round(v * 100) / 100 + 0).replace("-", "−");
const fmtVec = ([x, y]: Vec2) => `(${fmtNum(x)}, ${fmtNum(y)})`;

/** Что случилось с плоскостью: для подписи и для скринридера. */
export function orientation(A: Mat2): "kept" | "flipped" | "collapsed" {
  const d = det(A);
  if (Math.abs(d) < 1e-9) return "collapsed";
  return d > 0 ? "kept" : "flipped";
}

export function describe(A: Mat2): string {
  const d = det(A);
  const what = {
    kept: `площадь умножается на ${fmtNum(Math.abs(d))}, ориентация сохраняется`,
    flipped: `площадь умножается на ${fmtNum(Math.abs(d))}, ориентация меняется: плоскость отражена`,
    collapsed: "det A = 0: плоскость сплющена в прямую или точку",
  }[orientation(A)];
  return `A: первая строка ${fmtNum(A[0][0])}, ${fmtNum(A[0][1])}; вторая строка ${fmtNum(A[1][0])}, ${fmtNum(A[1][1])}. e₁ переходит в ${fmtVec(column(A, 0))}, e₂ — в ${fmtVec(column(A, 1))}; ${what}.`;
}
