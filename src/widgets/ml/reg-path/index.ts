// Виджет «Путь регуляризации»: meta для каталога интерактивов.
export { default as RegPath } from "./RegPath";

export const meta = {
  id: "reg-path",
  title: "Путь регуляризации",
  concepts: ["ml.ridge", "ml.lasso"],
  lessons: ["ml-basics/evaluation/regularization"],
} as const;
