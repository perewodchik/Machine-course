// Виджет «Проекция с подвижным углом»: meta для каталога интерактивов и тип пропсов.
export { default as Projection, type ProjectionProps } from "./Projection";

export const meta = {
  id: "projection",
  title: "Проекция с подвижным углом",
  concepts: ["la.dot-product", "la.projection"],
  lessons: ["foundations/linear-algebra/dot-product-norms"],
} as const;
