// Виджет «Спуск по линиям уровня»: meta для каталога интерактивов и тип пропсов.
export { default as LmsPath, type LmsPathProps } from "./LmsPath";

export const meta = {
  id: "lms-path",
  title: "Спуск по линиям уровня",
  concepts: ["ml.lms", "calc.gradient-descent"],
  lessons: ["ml-basics/linear-models/linear-regression-lms"],
} as const;
