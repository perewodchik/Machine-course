// Виджет «Гибкость модели»: meta для каталога интерактивов и тип пропсов.
export { default as Flexibility, type FlexibilityProps } from "./Flexibility";

export const meta = {
  id: "flexibility",
  title: "Гибкость модели",
  concepts: ["ml.feature-map", "ml.lwr"],
  lessons: ["ml-basics/linear-models/features-lwr"],
} as const;
