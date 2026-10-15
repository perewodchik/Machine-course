// Игра «Underflow»: модель (GameSpec) и представление для страницы /games/underflow.
export { Underflow } from "./Underflow";
export { underflow } from "./model";

export const meta = {
  id: "prob.underflow",
  title: "Underflow",
  lesson: "foundations/start/exp-log-sigmoid",
  concepts: ["calc.log-exp"],
  minutes: [3, 5],
} as const;
