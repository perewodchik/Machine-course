// Виджет «Касание линии уровня и ограничения»: meta для каталога интерактивов и тип пропсов.
export { default as Lagrange, type LagrangeProps } from "./Lagrange";

export const meta = {
  id: "lagrange",
  title: "Касание линии уровня и ограничения",
  concepts: ["calc.lagrange"],
  lessons: ["foundations/calculus/lagrange"],
} as const;
