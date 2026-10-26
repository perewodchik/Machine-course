// Игра «Спуск в тумане»: модель (GameSpec) и представление для страницы /games/foggy-descent.
export { FoggyDescent } from "./FoggyDescent";
export { foggyDescent } from "./model";

export const meta = {
  id: "calc.foggy-descent",
  title: "Спуск в тумане",
  lesson: "foundations/calculus/gradient-descent",
  concepts: ["calc.gradient-descent", "calc.gradient"],
  minutes: [4, 6],
} as const;
