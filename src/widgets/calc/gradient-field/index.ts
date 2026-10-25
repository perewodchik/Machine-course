// Виджет «Поле градиентов над линиями уровня»: meta для каталога интерактивов и тип пропсов.
export { default as GradientField, type GradientFieldProps } from "./GradientField";

export const meta = {
  id: "gradient-field",
  title: "Поле градиентов над линиями уровня",
  concepts: ["calc.gradient"],
  lessons: ["foundations/calculus/gradient"],
} as const;
