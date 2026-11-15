// Игра «Найди утечку»: модель (GameSpec) и представление для страницы /games/find-leak.
export { FindLeak } from "./FindLeak";
export { findLeak } from "./model";

export const meta = {
  id: "ml.find-leak",
  title: "Найди утечку",
  lesson: "ml-basics/evaluation/ml-practice",
  concepts: ["ml.ml-practice"],
  minutes: [3, 5],
} as const;
