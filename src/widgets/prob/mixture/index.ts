// Виджет «Смесь двух гауссиан и ответственности»: meta для каталога интерактивов и тип пропсов.
export { default as Mixture, type MixtureProps } from "./Mixture";

export const meta = {
  id: "mixture",
  title: "Смесь двух гауссиан и ответственности",
  concepts: ["prob.mixtures"],
  lessons: ["foundations/probability/mixtures-latent"],
} as const;
