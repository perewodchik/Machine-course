// Виджет «Ax = b: нет решений, одно, бесконечно много»: meta для каталога интерактивов и тип пропсов.
export { default as SystemLines, type SystemLinesProps } from "./SystemLines";

export const meta = {
  id: "system-lines",
  title: "Ax = b: нет решений, одно, бесконечно много",
  concepts: ["la.rank"],
  lessons: ["foundations/linear-algebra/systems-rank"],
} as const;
