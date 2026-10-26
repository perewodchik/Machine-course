// Виджет «Редактор μ и Σ»: meta для каталога интерактивов и тип пропсов.
export { default as GaussEditor, type GaussEditorProps } from "./GaussEditor";

export const meta = {
  id: "gauss-editor",
  title: "Редактор μ и Σ",
  concepts: ["prob.multivariate-normal"],
  lessons: ["foundations/probability/multivariate-normal"],
} as const;
