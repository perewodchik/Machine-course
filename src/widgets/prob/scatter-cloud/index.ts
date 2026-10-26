// Виджет «Облако точек»: meta для каталога интерактивов и тип пропсов.
export { default as ScatterCloud, type ScatterCloudProps } from "./ScatterCloud";
export type { CloudShape } from "./model";

export const meta = {
  id: "scatter-cloud",
  title: "Облако точек",
  concepts: ["prob.joint-distributions"],
  lessons: ["foundations/probability/joint-distributions"],
} as const;
