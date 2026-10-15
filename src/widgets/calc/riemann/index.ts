// Виджет «Сумма прямоугольников → площадь»: meta для каталога интерактивов и тип пропсов.
export { default as Riemann, type RiemannProps } from "./Riemann";

export const meta = {
  id: "riemann",
  title: "Сумма прямоугольников → площадь",
  concepts: ["calc.integral"],
  lessons: ["foundations/start/integral"],
} as const;
