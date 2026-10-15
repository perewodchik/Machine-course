// Виджет «Сетка из 1000 человек»: meta для каталога интерактивов и тип пропсов.
export { default as BayesGrid, type BayesGridProps } from "./BayesGrid";

export const meta = {
  id: "bayes-grid",
  title: "Сетка из 1000 человек",
  concepts: ["prob.total-probability", "prob.bayes"],
  lessons: ["foundations/probability/bayes"],
} as const;
