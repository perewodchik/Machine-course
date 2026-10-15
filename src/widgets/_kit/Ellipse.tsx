// Эллипс в координатах данных: центр, полуоси и поворот (или ковариация 2×2 — линия уровня).
// Масштабы осей разные, поэтому эллипс задаётся матрицей преобразования единичной окружности.
import { usePlane } from "./context";
import { useLit } from "./hooks";
import { roleClass, type Role } from "./roles";

type Shape = { radii: readonly [number, number]; angle?: number } | { cov: readonly [readonly [number, number], readonly [number, number]]; k?: number };

type Props = Shape & {
  center: readonly [number, number];
  role?: Role;
  sym?: string;
  filled?: boolean;
};

/** Полуоси и угол (рад) эллипса xᵀΣ⁻¹x = k² по ковариации Σ. */
export function covAxes(cov: readonly [readonly [number, number], readonly [number, number]], k = 1): { radii: [number, number]; angle: number } {
  const [[a, b], [, d]] = cov;
  const tr = a + d;
  const det = a * d - b * b;
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  const angle = b === 0 ? (a >= d ? 0 : Math.PI / 2) : Math.atan2(l1 - a, b);
  return { radii: [k * Math.sqrt(Math.max(l1, 0)), k * Math.sqrt(Math.max(l2, 0))], angle };
}

export function Ellipse(props: Props) {
  const { layout } = usePlane();
  const { center, role = "aux", sym, filled = false } = props;
  const lit = useLit(sym);
  const { radii, angle } = "cov" in props ? covAxes(props.cov, props.k) : { radii: props.radii, angle: ((props.angle ?? 0) * Math.PI) / 180 };
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  // M = diag(kx, ky) · R(angle) · diag(rx, ry): единичная окружность → эллипс в пикселях
  const m = [layout.kx * c * radii[0], layout.ky * s * radii[0], -layout.kx * s * radii[1], layout.ky * c * radii[1], layout.sx(center[0]), layout.sy(center[1])];
  return (
    <g data-sym={sym} className={["kit-ellipse", roleClass(role), filled && "is-filled", lit && "is-lit"].filter(Boolean).join(" ")}>
      <circle cx={0} cy={0} r={1} transform={`matrix(${m.map((v) => Number(v.toFixed(4))).join(" ")})`} vectorEffect="non-scaling-stroke" />
    </g>
  );
}
