// Виджет «Как растягивается площадь при замене переменных»: meta для каталога интерактивов и тип пропсов.
export { default as AreaStretch, type AreaStretchProps } from "./AreaStretch";

export const meta = {
  id: "area-stretch",
  title: "Как растягивается площадь при замене переменных",
  concepts: ["calc.change-of-variables"],
  lessons: ["foundations/calculus/multiple-integrals"],
} as const;
