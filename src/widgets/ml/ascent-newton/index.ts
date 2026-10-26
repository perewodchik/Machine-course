// Виджет «Подъём против Ньютона»: meta для каталога интерактивов.
export { default as AscentNewton } from "./AscentNewton";

export const meta = {
  id: "ascent-newton",
  title: "Подъём против Ньютона",
  concepts: ["ml.logistic-regression", "calc.newton"],
  lessons: ["ml-basics/linear-models/logistic-regression"],
} as const;
