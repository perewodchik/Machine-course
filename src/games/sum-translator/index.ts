// Игра «Переводчик сумм»: модель (GameSpec) и представление для страницы /games/sum-translator.
export { SumTranslator } from "./SumTranslator";
export { sumTranslator } from "./model";

export const meta = {
  id: "nota.sum-translator",
  title: "Переводчик сумм",
  lesson: "foundations/start/sums-products-indicators",
  concepts: ["nota.sums"],
  minutes: [3, 5],
} as const;
