// Игра «Байес-детектив»: модель (GameSpec) и представление для страницы /games/bayes-detective.
export { BayesDetective } from "./BayesDetective";
export { detective } from "./model";

export const meta = {
  id: "prob.bayes-detective",
  title: "Байес-детектив",
  lesson: "foundations/probability/bayes",
  concepts: ["prob.bayes", "prob.total-probability"],
  minutes: [3, 5],
} as const;
