// Прямая y = a + b·x или отрезок между точками. Рисунок обрезает clipPath области графика,
// подпись стоит у видимого конца; если линия целиком вне графика — подписи нет.
import { clipLine, clipSegment, labelAnchor, type Pt } from "./clip";
import { plainLabel } from "./format";
import { usePlane } from "./context";
import { useLit } from "./hooks";
import { MathText } from "./MathText";
import { roleClass, type Role } from "./roles";

type Geometry = { intercept: number; slope: number } | { from: Pt; to: Pt };

type Props = Geometry & {
  role?: Role;
  sym?: string;
  label?: string;
  /** Подпись над линией (по умолчанию — под ней, точки обычно выше). */
  labelAbove?: boolean;
  dashed?: boolean;
};

export function Line(props: Props) {
  const { layout, box } = usePlane();
  const { role = "param", sym, label, labelAbove = false, dashed = role === "aux" } = props;
  const lit = useLit(sym);
  // для рисования — вся прямая через область (её обрежет clipPath), для подписи — видимая часть
  const [p, q]: [Pt, Pt] =
    "slope" in props
      ? [
          [box.x0, props.intercept + props.slope * box.x0],
          [box.x1, props.intercept + props.slope * box.x1],
        ]
      : [props.from, props.to];
  const visible = "slope" in props ? clipLine(props.intercept, props.slope, box) : clipSegment(p, q, box);
  const anchor = visible && labelAnchor(visible);
  // подпись стоит левее точки привязки (text-anchor: end): у наклонной прямой её левый край ближе к линии —
  // отступ растёт с наклоном в пикселях и шириной подписи (≈ 8.5 px на знак при 17 px)
  const dxPx = layout.sx(q[0]) - layout.sx(p[0]);
  const slopePx = dxPx === 0 ? 0 : (layout.sy(q[1]) - layout.sy(p[1])) / dxPx;
  const textW = label ? plainLabel(label).length * 8.5 : 0;
  const rise = labelAbove ? Math.max(0, slopePx) * textW : Math.max(0, -slopePx) * textW;
  let ly = anchor ? layout.sy(anchor[1]) + (labelAbove ? -12 - rise : 26 + rise) : 0;
  // подпись не выходит за область графика
  const top = layout.inner.y + 16;
  const bottom = layout.inner.y + layout.inner.h - 8;
  if (ly > bottom) ly = anchor ? layout.sy(anchor[1]) - 12 : ly;
  ly = Math.min(bottom, Math.max(top, ly));
  return (
    <g data-sym={sym} className={["kit-line", roleClass(role), dashed && "is-dashed", lit && "is-lit"].filter(Boolean).join(" ")} data-visible={visible ? "true" : "false"}>
      <line x1={layout.sx(p[0])} y1={layout.sy(p[1])} x2={layout.sx(q[0])} y2={layout.sy(q[1])} />
      {label && anchor && <MathText x={layout.sx(anchor[0])} y={ly} label={label} role={role} anchor="end" />}
    </g>
  );
}
