// Виджет «Перцептрон»: meta для каталога интерактивов.
export { default as Perceptron } from "./Perceptron";

export const meta = {
  id: "perceptron",
  title: "Перцептрон",
  concepts: ["ml.perceptron"],
  lessons: ["ml-basics/linear-models/perceptron-softmax"],
} as const;
