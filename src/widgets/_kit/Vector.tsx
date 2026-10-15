// Вектор-стрелка: из from (по умолчанию из начала координат) в to. Наконечник строится в пикселях,
// поэтому не искажается разными масштабами осей.
import { usePlane } from "./context";
import { useLit } from "./hooks";
import { MathText } from "./MathText";
import { roleClass, type Role } from "./roles";

interface Props {
  to: readonly [number, number];
  from?: readonly [number, number];
  role?: Role;
  sym?: string;
  label?: string;
}

const HEAD = 10; // px
const HALF = 4.5; // px

/**
 * Подпись за остриём: над стрелкой, а у стрелки вниз — под ней; у стрелки влево — левее острия. Деления осей
 * стоят слева и снизу от осей, поэтому подпись вектора, лежащего на оси, не наезжает на число.
 */
function labelAt(x1: number, y1: number, ux: number, uy: number): { x: number; y: number; anchor: "start" | "end" } {
  const left = ux < -0.5;
  return { x: x1 + ux * 10 + (left ? 0 : 4), y: y1 + uy * 10 + (uy > 0.3 ? 14 : -6), anchor: left ? "end" : "start" };
}

export function Vector({ to, from = [0, 0], role = "data", sym, label }: Props) {
  const { layout } = usePlane();
  const lit = useLit(sym);
  const x0 = layout.sx(from[0]);
  const y0 = layout.sy(from[1]);
  const x1 = layout.sx(to[0]);
  const y1 = layout.sy(to[1]);
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 1) return null;
  const ux = (x1 - x0) / len;
  const uy = (y1 - y0) / len;
  const bx = x1 - ux * HEAD;
  const by = y1 - uy * HEAD;
  const head = `${x1},${y1} ${bx - uy * HALF},${by + ux * HALF} ${bx + uy * HALF},${by - ux * HALF}`;
  return (
    <g data-sym={sym} className={["kit-vector", roleClass(role), lit && "is-lit"].filter(Boolean).join(" ")}>
      <line x1={x0} y1={y0} x2={bx} y2={by} />
      <polygon points={head} />
      {label && <MathText {...labelAt(x1, y1, ux, uy)} label={label} role={role} />}
    </g>
  );
}
