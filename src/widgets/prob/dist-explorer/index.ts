// Виджет «Обозреватель распределений»: meta для каталога интерактивов и тип пропсов.
export { default as DistExplorer, type DistExplorerProps } from "./DistExplorer";

export const meta = {
  id: "dist-explorer",
  title: "Обозреватель распределений",
  concepts: ["prob.discrete-distributions"],
  lessons: ["foundations/probability/discrete-distributions"],
} as const;
