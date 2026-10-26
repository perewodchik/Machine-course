// Виджет «Облако моделей»: meta для каталога интерактивов.
export { default as ModelCloud } from "./ModelCloud";

export const meta = {
  id: "model-cloud",
  title: "Облако моделей",
  concepts: ["ml.bias-variance"],
  lessons: ["ml-basics/evaluation/bias-variance"],
} as const;
