// Игра «Подгони прямую»: модель (GameSpec) и представление для страницы /games/fit-line.
export { FitLineGame } from "./FitLineGame";
export { fitLine } from "./model";

export const meta = {
  id: "ml.fit-line",
  title: "Подгони прямую",
  lesson: "foundations/start/regression-by-hand",
  concepts: ["ml.least-squares"],
  minutes: [3, 5],
} as const;
