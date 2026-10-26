// Игра «Приор против монеты»: модель (GameSpec) и представление для страницы /games/prior-vs-coin.
export { PriorVsCoin } from "./PriorVsCoin";
export { priorVsCoin } from "./model";

export const meta = {
  id: "stat.prior-vs-coin",
  title: "Приор против монеты",
  lesson: "foundations/statistics/bayes-map",
  concepts: ["stat.bayes-map"],
  minutes: [3, 5],
} as const;
