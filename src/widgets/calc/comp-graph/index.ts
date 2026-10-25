// Виджет «Вычислительный граф»: meta для каталога интерактивов и тип пропсов.
export { default as CompGraph, type CompGraphProps } from "./CompGraph";

export const meta = {
  id: "comp-graph",
  title: "Вычислительный граф",
  concepts: ["calc.chain-rule"],
  lessons: ["foundations/calculus/chain-rule-jacobian"],
} as const;
