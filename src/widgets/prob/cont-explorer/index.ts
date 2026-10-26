// Виджет «Обозреватель непрерывных распределений»: meta для каталога интерактивов и тип пропсов.
export { default as ContExplorer, type ContExplorerProps } from "./ContExplorer";

export const meta = {
  id: "cont-explorer",
  title: "Обозреватель непрерывных распределений",
  concepts: ["prob.continuous-distributions"],
  lessons: ["foundations/probability/continuous-distributions"],
} as const;
