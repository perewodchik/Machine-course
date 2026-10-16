// Игра «Тетрис размерностей»: модель (GameSpec) и представление для страницы /games/dim-tetris.
export { DimTetris } from "./DimTetris";
export { dimTetris } from "./model";

export const meta = {
  id: "la.dim-tetris",
  title: "Тетрис размерностей",
  lesson: "foundations/linear-algebra/matrix-multiplication",
  concepts: ["la.matmul", "la.transpose"],
  minutes: [3, 5],
} as const;
