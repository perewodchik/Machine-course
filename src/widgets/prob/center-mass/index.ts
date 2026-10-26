// Виджет «Матожидание как центр масс»: meta для каталога интерактивов и тип пропсов.
export { default as CenterMass, type CenterMassProps } from "./CenterMass";

export const meta = {
  id: "center-mass",
  title: "Матожидание как центр масс",
  concepts: ["prob.expectation"],
  lessons: ["foundations/probability/expectation-variance"],
} as const;
