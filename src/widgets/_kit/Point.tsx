// Точка данных: цвет роли, белая обводка цвета поля; подсвечивается вместе с символом в формулах.
import { usePlane } from "./context";
import { useLit } from "./hooks";
import { MathText } from "./MathText";
import { roleClass, type Role } from "./roles";

interface Props {
  x: number;
  y: number;
  role?: Role;
  /** Имя символа (\sym{name}): наведение подсвечивает его и в формулах. */
  sym?: string;
  label?: string;
  r?: number;
}

export function Point({ x, y, role = "data", sym, label, r = 5 }: Props) {
  const { layout } = usePlane();
  const lit = useLit(sym);
  const cx = layout.sx(x);
  const cy = layout.sy(y);
  return (
    <g data-sym={sym} className={["kit-point", roleClass(role), lit && "is-lit"].filter(Boolean).join(" ")}>
      <circle cx={cx} cy={cy} r={lit ? r + 1.5 : r} />
      {label && <MathText x={cx + 8} y={cy - 8} label={label} role={role} />}
    </g>
  );
}
