// Виджет «Единичные шары норм»: meta для каталога интерактивов и тип пропсов.
export { default as NormBalls, type NormBallsProps } from "./NormBalls";

export const meta = {
  id: "norm-balls",
  title: "Единичные шары норм",
  concepts: ["la.norm"],
  lessons: ["foundations/linear-algebra/dot-product-norms"],
} as const;
