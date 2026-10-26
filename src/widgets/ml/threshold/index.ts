// Виджет «Порог классификатора»: meta для каталога интерактивов и тип пропсов.
export { default as Threshold, type ThresholdProps } from "./Threshold";

export const meta = {
  id: "threshold",
  title: "Порог классификатора",
  concepts: ["ml.loss"],
  lessons: ["ml-basics/evaluation/classification-metrics"],
} as const;
