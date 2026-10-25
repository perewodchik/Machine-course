// Виджет «Хорда над графиком»: meta для каталога интерактивов и тип пропсов.
export { default as Chord, type ChordProps } from "./Chord";

export const meta = {
  id: "chord",
  title: "Хорда над графиком",
  concepts: ["calc.convexity"],
  lessons: ["foundations/calculus/convexity"],
} as const;
