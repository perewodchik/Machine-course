// Виджет «События как области»: meta для каталога интерактивов и тип пропсов.
export { default as Events, type EventsProps } from "./Events";

export const meta = {
  id: "events",
  title: "События как области",
  concepts: ["prob.probability-space"],
  lessons: ["foundations/probability/probability-space"],
} as const;
