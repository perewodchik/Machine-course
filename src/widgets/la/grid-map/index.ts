// Виджет «Деформация сетки»: meta для каталога интерактивов и тип пропсов.
export { default as GridMap, type GridMapProps } from "./GridMap";

export const meta = {
  id: "grid-map",
  title: "Деформация сетки",
  concepts: ["la.linear-map", "la.matmul"],
  lessons: ["foundations/linear-algebra/matrix-as-map"],
} as const;
