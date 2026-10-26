// Виджет «Активное и неактивное ограничение»: meta для каталога интерактивов и тип пропсов.
export { default as Kkt, type KktProps } from "./Kkt";

export const meta = {
  id: "kkt",
  title: "Активное и неактивное ограничение",
  concepts: ["calc.kkt"],
  lessons: ["foundations/calculus/duality-kkt"],
} as const;
