// Игра «Зоопарк распределений»: модель (GameSpec) и представление для страницы /games/dist-zoo.
export { DistZoo } from "./DistZoo";
export { distZoo } from "./model";

export const meta = {
  id: "prob.dist-zoo",
  title: "Зоопарк распределений",
  lesson: "foundations/probability/discrete-distributions",
  concepts: ["prob.discrete-distributions"],
  minutes: [3, 5],
} as const;
