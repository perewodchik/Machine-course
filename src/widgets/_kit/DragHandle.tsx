// Ручка на рисунке: точку тянут мышью или пальцем, виджет получает новые координаты в единицах данных.
// Рисунок Plane — role="img", поэтому ручка для скринридера скрыта: тот же параметр всегда дублирует ползунок
// с клавиатурой (ParamSlider). Зона касания — 44 px (WCAG 2.5.8), видимая точка — кольцо цвета роли.
import { useRef, type PointerEvent } from "react";
import { usePlane } from "./context";
import { roleClass, type Role } from "./roles";

interface Props {
  x: number;
  y: number;
  /** Новые координаты точки в единицах данных (внутри области графика). */
  onDrag: (x: number, y: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  role?: Role;
  r?: number;
  /** Подсказка при наведении: что делает ручка. */
  title?: string;
}

/** Пиксели viewBox → данные: обратная линейная шкала по краям области графика. */
export function invert(px: number, a0: number, a1: number, p0: number, p1: number): number {
  return a0 + ((px - p0) * (a1 - a0)) / (p1 - p0);
}

export function DragHandle({ x, y, onDrag, onStart, onEnd, role = "param", r = 6, title }: Props) {
  const { layout, box } = usePlane();
  const dragging = useRef(false);
  const toData = (e: PointerEvent<SVGGElement>): [number, number] | null => {
    const svg = e.currentTarget.ownerSVGElement;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const dx = invert(p.x, box.x0, box.x1, layout.sx(box.x0), layout.sx(box.x1));
    const dy = invert(p.y, box.y0, box.y1, layout.sy(box.y0), layout.sy(box.y1));
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, Math.min(lo, hi)), Math.max(lo, hi));
    return [clamp(dx, box.x0, box.x1), clamp(dy, box.y0, box.y1)];
  };
  const down = (e: PointerEvent<SVGGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    onStart?.();
  };
  const move = (e: PointerEvent<SVGGElement>) => {
    if (!dragging.current) return;
    const p = toData(e);
    if (p) onDrag(p[0], p[1]);
  };
  const up = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onEnd?.();
  };
  const cx = layout.sx(x);
  const cy = layout.sy(y);
  return (
    <g className={["kit-handle", roleClass(role)].join(" ")} aria-hidden="true" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {title && <title>{title}</title>}
      <circle className="kit-handle__hit" cx={cx} cy={cy} r={22} />
      <circle className="kit-handle__ring" cx={cx} cy={cy} r={r} />
    </g>
  );
}
