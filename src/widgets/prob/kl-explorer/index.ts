// Виджет «KL между двумя распределениями»: meta для каталога интерактивов и тип пропсов.
export { default as KlExplorer, type KlExplorerProps } from "./KlExplorer";

export const meta = {
  id: "kl-explorer",
  title: "KL между двумя распределениями",
  concepts: ["prob.information"],
  lessons: ["foundations/probability/information"],
} as const;
