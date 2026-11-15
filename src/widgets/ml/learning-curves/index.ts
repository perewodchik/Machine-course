// Виджет «Кривые обучения»: meta для каталога интерактивов.
export { default as LearningCurves } from "./LearningCurves";

export const meta = {
  id: "learning-curves",
  title: "Кривые обучения",
  concepts: ["ml.ml-practice", "ml.bias-variance"],
  lessons: ["ml-basics/evaluation/ml-practice"],
} as const;
