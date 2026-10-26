// Игра «Машина правдоподобия»: модель (GameSpec) и представление для страницы /games/likelihood-machine.
export { LikelihoodMachine } from "./LikelihoodMachine";
export { likelihoodMachine } from "./model";

export const meta = {
  id: "stat.likelihood-machine",
  title: "Машина правдоподобия",
  lesson: "foundations/statistics/mle",
  concepts: ["stat.mle"],
  minutes: [3, 5],
} as const;
