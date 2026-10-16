// Ломаная в координатах данных: кривая, заданная точками (ветвь гиперболы, линия уровня). Цвет — по роли,
// как у Line; обрезается областью графика вместе с остальным содержимым Plane.
import { usePlane } from "./context";
import { roleClass, type Role } from "./roles";

interface Props {
  points: readonly (readonly [number, number])[];
  role?: Role;
  dashed?: boolean;
}

export function Polyline({ points, role = "aux", dashed = false }: Props) {
  const { layout } = usePlane();
  return (
    <polyline
      className={["kit-polyline", roleClass(role), dashed && "is-dashed"].filter(Boolean).join(" ")}
      points={points.map(([x, y]) => `${layout.sx(x)},${layout.sy(y)}`).join(" ")}
    />
  );
}
