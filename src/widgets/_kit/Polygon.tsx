// Многоугольник в координатах данных: фигура, которую двигает матрица. tone="aux" — пунктир карандашом (цель),
// tone="pen" — синяя ручка с заливкой: то, что строит ученик (ручка красит действие ученика, а не символ).
// Вырожденный многоугольник (все точки на прямой) рисуется отрезком — его видно по обводке.
import { usePlane } from "./context";

interface Props {
  points: readonly (readonly [number, number])[];
  tone?: "aux" | "pen";
}

export function Polygon({ points, tone = "aux" }: Props) {
  const { layout } = usePlane();
  return <polygon className={`kit-polygon kit-polygon--${tone}`} points={points.map(([x, y]) => `${layout.sx(x)},${layout.sy(y)}`).join(" ")} />;
}
