// Игра «Угадай корреляцию»: модель (GameSpec) и представление для страницы /games/guess-correlation.
export { GuessCorrelation } from "./GuessCorrelation";
export { guessCorrelation } from "./model";

export const meta = {
  id: "prob.guess-correlation",
  title: "Угадай корреляцию",
  lesson: "foundations/probability/joint-distributions",
  concepts: ["prob.joint-distributions"],
  minutes: [3, 5],
} as const;
