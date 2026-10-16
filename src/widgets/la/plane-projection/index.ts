// Виджет «Проекция y на плоскость столбцов»: meta для каталога интерактивов и тип пропсов.
export { default as PlaneProjection, type PlaneProjectionProps } from "./PlaneProjection";

export const meta = {
  id: "plane-projection",
  title: "Проекция y на плоскость столбцов",
  concepts: ["la.projection"],
  lessons: ["foundations/linear-algebra/orthogonality-projections"],
} as const;
