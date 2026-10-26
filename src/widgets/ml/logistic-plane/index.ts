// Виджет «Сигмоида над плоскостью»: meta для каталога интерактивов.
export { default as LogisticPlane } from "./LogisticPlane";

export const meta = {
  id: "logistic-plane",
  title: "Сигмоида над плоскостью",
  concepts: ["ml.logistic-regression"],
  lessons: ["ml-basics/linear-models/logistic-regression"],
} as const;
