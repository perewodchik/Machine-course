// Контекст плоскости: шкалы и область графика для элементов внутри <Plane>.
import { createContext, useContext } from "react";
import type { Box } from "./clip";
import type { PlaneLayout } from "./layout";

export interface PlaneContextValue {
  layout: PlaneLayout;
  /** Область графика в данных: по ней считается видимая часть линий. */
  box: Box;
  /** id clipPath области графика. */
  clipId: string;
}

export const PlaneContext = createContext<PlaneContextValue | null>(null);

export function usePlane(): PlaneContextValue {
  const ctx = useContext(PlaneContext);
  if (!ctx) throw new Error("элемент рисунка должен лежать внутри <Plane>");
  return ctx;
}
