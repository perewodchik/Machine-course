// Игра «Переобучи, если сможешь»: модель (GameSpec) и представление для страницы /games/overfit.
export { Overfit } from "./Overfit";
export { overfit } from "./model";

export const meta = {
  id: "stat.overfit",
  title: "Переобучи, если сможешь",
  lesson: "foundations/statistics/risk-generalization",
  concepts: ["stat.risk-generalization"],
  minutes: [5, 8],
} as const;
