// Игра «Покрой истину»: модель (GameSpec) и представление для страницы /games/cover-truth.
export { CoverTruth } from "./CoverTruth";
export { coverTruth } from "./model";

export const meta = {
  id: "stat.cover-truth",
  title: "Покрой истину",
  lesson: "foundations/statistics/intervals-tests",
  concepts: ["stat.intervals-tests"],
  minutes: [4, 6],
} as const;
