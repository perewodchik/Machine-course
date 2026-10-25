// Виджет «Окружность → эллипс по шагам»: meta для каталога интерактивов и тип пропсов.
export { default as SvdSteps, type SvdStepsProps } from "./SvdSteps";

export const meta = {
  id: "svd-steps",
  title: "Окружность → эллипс по шагам",
  concepts: ["la.svd"],
  lessons: ["foundations/linear-algebra/svd-pseudoinverse"],
} as const;
