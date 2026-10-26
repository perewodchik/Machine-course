// Игра «Честная вероятность»: модель (GameSpec) и представление для страницы /games/honest-probability.
export { HonestProbability } from "./HonestProbability";
export { honest } from "./model";

export const meta = {
  id: "ml.honest-probability",
  title: "Честная вероятность",
  lesson: "ml-basics/linear-models/logistic-regression",
  concepts: ["ml.logistic-regression", "stat.mle"],
  minutes: [2, 4],
} as const;
