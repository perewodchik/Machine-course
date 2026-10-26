// Игра «Цена ошибки»: модель (GameSpec) и представление для страницы /games/error-cost.
export { ErrorCost } from "./ErrorCost";
export { errorCost } from "./model";

export const meta = {
  id: "ml.error-cost",
  title: "Цена ошибки",
  lesson: "ml-basics/evaluation/classification-metrics",
  concepts: ["ml.loss"],
  minutes: [4, 6],
} as const;
