// Виджет «Плотность и CDF при перетаскивании порога»: meta для каталога интерактивов и тип пропсов.
export { default as DensityCdf, type DensityCdfProps } from "./DensityCdf";

export const meta = {
  id: "density-cdf",
  title: "Плотность и CDF при перетаскивании порога",
  concepts: ["prob.random-variable"],
  lessons: ["foundations/probability/random-variables"],
} as const;
