// Игра «Охота на собственные векторы»: модель (GameSpec) и представление для страницы /games/eigen-hunt.
export { EigenHunt } from "./EigenHunt";
export { eigenHunt } from "./model";

export const meta = {
  id: "la.eigen-hunt",
  title: "Охота на собственные векторы",
  lesson: "foundations/linear-algebra/eigen",
  concepts: ["la.eigen"],
  minutes: [3, 5],
} as const;
