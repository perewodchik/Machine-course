// Виджет «Подгонка прямой»: meta для каталога интерактивов и тип пропсов.
export { default as FitLine, type FitLineProps } from "./FitLine";

export const meta = {
  id: "fit-line",
  title: "Подгонка прямой",
  concepts: ["la.projection", "calc.matrix-calculus", "ml.linear-regression-probabilistic"],
  lessons: ["foundations/bridge/linear-regression"],
} as const;
