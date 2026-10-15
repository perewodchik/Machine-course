// Виджет «Оболочка двух векторов»: meta для каталога интерактивов и тип пропсов.
export { default as Span, type SpanProps } from "./Span";

export const meta = {
  id: "span",
  title: "Оболочка двух векторов",
  concepts: ["la.span", "la.linear-independence"],
  lessons: ["foundations/linear-algebra/vectors-span"],
} as const;
