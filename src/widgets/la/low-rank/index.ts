// Виджет «Сжать картинку SVD»: meta для каталога интерактивов и тип пропсов.
export { default as LowRank, type LowRankProps } from "./LowRank";

export const meta = {
  id: "low-rank",
  title: "Сжать картинку SVD",
  concepts: ["la.svd"],
  lessons: ["foundations/linear-algebra/svd-pseudoinverse"],
} as const;
