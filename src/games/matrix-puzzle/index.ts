// Игра «Матрица-пазл»: модель (GameSpec) и представление для страницы /games/matrix-puzzle.
export { MatrixPuzzle } from "./MatrixPuzzle";
export { matrixPuzzle } from "./model";

export const meta = {
  id: "la.matrix-puzzle",
  title: "Матрица-пазл",
  lesson: "foundations/linear-algebra/matrix-as-map",
  concepts: ["la.matmul"],
  minutes: [3, 5],
} as const;
