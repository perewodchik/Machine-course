// Игра «Переобучи, если сможешь: λ»: модель (GameSpec) и представление для страницы /games/overfit-lambda.
export { OverfitLambda } from "./OverfitLambda";
export { overfitLambda } from "./model";

export const meta = {
  id: "ml.overfit-lambda",
  title: "Переобучи, если сможешь: λ",
  lesson: "ml-basics/evaluation/regularization",
  concepts: ["ml.lasso"],
  minutes: [4, 6],
} as const;
