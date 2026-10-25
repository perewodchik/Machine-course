// Игра «Порог расходимости»: модель (GameSpec) и представление для страницы /games/divergence.
export { Divergence } from "./Divergence";
export { divergence } from "./model";

export const meta = {
  id: "calc.divergence",
  title: "Порог расходимости",
  lesson: "foundations/calculus/gradient-descent",
  concepts: ["calc.gradient-descent", "la.eigen"],
  minutes: [4, 6],
} as const;
