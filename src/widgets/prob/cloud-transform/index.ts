// Виджет «Линейное преобразование облака»: meta для каталога интерактивов и тип пропсов.
export { default as CloudTransform, type CloudTransformProps } from "./CloudTransform";

export const meta = {
  id: "cloud-transform",
  title: "Линейное преобразование облака",
  concepts: ["prob.random-vectors"],
  lessons: ["foundations/probability/random-vectors"],
} as const;
