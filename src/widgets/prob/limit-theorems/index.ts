// Виджеты «Бегущее среднее» и «Гистограмма суммы»: meta для каталога интерактивов и типы пропсов.
export { default as RunningMean, type RunningMeanProps } from "./RunningMean";
export { default as SumHistogram, type SumHistogramProps } from "./SumHistogram";

export const meta = {
  id: "limit-theorems",
  title: "Бегущее среднее и гистограмма суммы",
  concepts: ["prob.limit-theorems"],
  lessons: ["foundations/probability/limit-theorems"],
} as const;
