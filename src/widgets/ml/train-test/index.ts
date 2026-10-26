// Виджет «Обучение и тест»: meta для каталога интерактивов и тип пропсов.
export { default as TrainTest, type TrainTestProps } from "./TrainTest";

export const meta = {
  id: "train-test",
  title: "Обучение и тест",
  concepts: ["stat.risk-generalization", "ml.loss"],
  lessons: ["ml-basics/linear-models/learning-problem"],
} as const;
