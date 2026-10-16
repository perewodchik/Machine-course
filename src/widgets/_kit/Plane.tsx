// Координатная плоскость: клетка совпадает с делениями осей, viewBox пересчитывается по ширине контейнера,
// всё внутри обрезается областью графика (clipPath) — линии не «улетают» за оси.
import { useId, type ReactNode } from "react";
import { Axis } from "./Axis";
import { PlaneContext } from "./context";
import { useWidth } from "./hooks";
import { gridLines, planeLayout, type PlaneOptions } from "./layout";

interface Props extends PlaneOptions {
  /** Подпись рисунка для скринридера: что изображено. */
  label: string;
  xLabel?: string;
  yLabel?: string;
  /** Ширина до первого измерения (при сборке). */
  initialWidth?: number;
  /** Без клетки и осей: чистый лист для своих построений (проекция трёхмерной сцены). */
  bare?: boolean;
  children?: ReactNode;
}

export function Plane({ label, xLabel = "x", yLabel = "y", initialWidth = 660, bare = false, children, ...opts }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>(initialWidth);
  const layout = planeLayout(width, opts);
  const clipId = `plot-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { inner } = layout;
  const box = { x0: opts.x[0], x1: opts.x[1], y0: opts.y[0], y1: opts.y[1] };
  const vx = gridLines(inner.x, inner.w, layout.cellX, layout.sx(layout.xTicks[0] ?? opts.x[0]));
  const hy = gridLines(inner.y, inner.h, layout.cellY, layout.sy(layout.yTicks[0] ?? opts.y[0]));
  return (
    <div ref={ref} className="kit-plane">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label={label}>
        <defs>
          <clipPath id={clipId}>
            <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} />
          </clipPath>
        </defs>
        {!bare && (
          <g className="kit-grid" aria-hidden="true">
            {vx.map((p) => (
              <line key={`v${p}`} x1={p} y1={inner.y} x2={p} y2={inner.y + inner.h} />
            ))}
            {hy.map((p) => (
              <line key={`h${p}`} x1={inner.x} y1={p} x2={inner.x + inner.w} y2={p} />
            ))}
          </g>
        )}
        <PlaneContext.Provider value={{ layout, box, clipId }}>
          {!bare && <Axis part="lines" />}
          <g clipPath={`url(#${clipId})`}>{children}</g>
          {!bare && <Axis part="labels" xLabel={xLabel} yLabel={yLabel} />}
        </PlaneContext.Provider>
      </svg>
    </div>
  );
}
