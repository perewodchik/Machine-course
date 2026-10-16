// Виджет «Линии уровня xᵀAx»: meta для каталога интерактивов и тип пропсов.
export { default as LevelSets, type LevelSetsProps } from "./LevelSets";

export const meta = {
  id: "level-sets",
  title: "Линии уровня xᵀAx",
  concepts: ["la.quadratic-form", "la.psd"],
  lessons: ["foundations/linear-algebra/quadratic-forms"],
} as const;
