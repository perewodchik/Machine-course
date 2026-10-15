// Оси с делениями и подписями. Проходят через ноль, если он в области графика, иначе по краю.
import { usePlane } from "./context";
import { fmt } from "./format";
import { MathText } from "./MathText";

interface Props {
  xLabel?: string;
  yLabel?: string;
}

const tick = (v: number) => (Number.isInteger(v) ? fmt(v, 0) : fmt(v, String(v).split(".")[1]?.length ?? 1));

export function Axis({ xLabel = "x", yLabel = "y" }: Props) {
  const { layout } = usePlane();
  const { inner, axisX, axisY } = layout;
  return (
    <g className="kit-axes" aria-hidden="true">
      <line className="axis" x1={inner.x} y1={axisX} x2={inner.x + inner.w} y2={axisX} />
      <line className="axis" x1={axisY} y1={inner.y} x2={axisY} y2={inner.y + inner.h} />
      {layout.xTicks.map((t) => (
        <text key={`x${t}`} className="tick" x={layout.sx(t)} y={axisX + 18} textAnchor="middle">
          {tick(t)}
        </text>
      ))}
      {layout.yTicks.map((t) => (
        <text key={`y${t}`} className="tick" x={axisY - 10} y={layout.sy(t) + 4} textAnchor="end">
          {tick(t)}
        </text>
      ))}
      <MathText x={inner.x + inner.w - 4} y={axisX - 8} label={xLabel} anchor="end" className="axis-label" />
      <MathText x={axisY + 8} y={inner.y + 16} label={yLabel} className="axis-label" />
    </g>
  );
}
