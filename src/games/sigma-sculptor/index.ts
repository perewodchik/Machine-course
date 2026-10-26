// Игра «Скульптор Σ»: модель (GameSpec) и представление для страницы /games/sigma-sculptor.
export { SigmaSculptor } from "./SigmaSculptor";
export { sigmaSculptor } from "./model";

export const meta = {
  id: "prob.sigma-sculptor",
  title: "Скульптор Σ",
  lesson: "foundations/probability/multivariate-normal",
  concepts: ["prob.multivariate-normal"],
  minutes: [4, 6],
} as const;
