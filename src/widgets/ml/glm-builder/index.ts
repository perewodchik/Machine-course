// Виджет «Конструктор GLM»: meta для каталога интерактивов.
export { default as GlmBuilder } from "./GlmBuilder";

export const meta = {
  id: "glm-builder",
  title: "Конструктор GLM",
  concepts: ["ml.glm", "stat.exponential-family"],
  lessons: ["ml-basics/linear-models/glm"],
} as const;
