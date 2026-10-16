// Виджет «Четыре взгляда на AB»: meta для каталога интерактивов и тип пропсов.
export { default as MatmulViews, type MatmulViewsProps } from "./MatmulViews";

export const meta = {
  id: "matmul-views",
  title: "Четыре взгляда на AB",
  concepts: ["la.matmul"],
  lessons: ["foundations/linear-algebra/matrix-multiplication"],
} as const;
