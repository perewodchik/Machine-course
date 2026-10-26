// Виджет «Перетащи выброс»: meta для каталога интерактивов и тип пропсов.
export { default as Outlier, type OutlierProps } from "./Outlier";

export const meta = {
  id: "outlier",
  title: "Перетащи выброс",
  concepts: ["stat.descriptive"],
  lessons: ["foundations/statistics/descriptive"],
} as const;
