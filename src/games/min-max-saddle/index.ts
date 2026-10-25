// Игра «Минимум, максимум или седло»: модель (GameSpec) и представление для страницы /games/min-max-saddle.
export { MinMaxSaddle } from "./MinMaxSaddle";
export { minMaxSaddle } from "./model";

export const meta = {
  id: "calc.min-max-saddle",
  title: "Минимум, максимум или седло",
  lesson: "foundations/calculus/hessian-taylor",
  concepts: ["calc.stationary-point", "la.psd"],
  minutes: [3, 5],
} as const;
