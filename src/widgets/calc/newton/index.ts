// Виджет «Касательные Ньютона»: meta для каталога интерактивов и тип пропсов.
export { default as Newton, type NewtonProps } from "./Newton";

export const meta = {
  id: "newton",
  title: "Касательные Ньютона",
  concepts: ["calc.newton"],
  lessons: ["foundations/calculus/newton"],
} as const;
