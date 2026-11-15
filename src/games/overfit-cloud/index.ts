// Игра «Переобучи, если сможешь: облако»: модель (GameSpec) и представление для страницы /games/overfit-cloud.
export { OverfitCloud } from "./OverfitCloud";
export { overfitCloud } from "./model";

export const meta = {
  id: "ml.overfit-cloud",
  title: "Переобучи, если сможешь: облако",
  lesson: "ml-basics/evaluation/bias-variance",
  concepts: ["ml.bias-variance"],
  minutes: [3, 5],
} as const;
