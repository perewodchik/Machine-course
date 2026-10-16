// Подпись на рисунке шрифтом формул: индексы меньшим кеглем, подложка цвета фона (CSS .kit-label).
import { labelParts } from "./format";
import { roleClass, type Role } from "./roles";

interface Props {
  x: number;
  y: number;
  label: string;
  role?: Role;
  anchor?: "start" | "middle" | "end";
  className?: string;
}

export function MathText({ x, y, label, role, anchor = "start", className }: Props) {
  const parts = labelParts(label);
  return (
    <text x={x} y={y} textAnchor={anchor} className={["kit-label", role && roleClass(role), className].filter(Boolean).join(" ")} aria-hidden="true">
      {parts.map((p, i) => {
        // индекс опускается, следующая за ним основа возвращается на строку
        const dy = p.sub ? "0.3em" : i > 0 && parts[i - 1]?.sub ? "-0.3em" : undefined;
        return (
          <tspan key={i} className={p.sub ? "sub" : p.fn ? "kit-fn" : undefined} dy={dy}>
            {p.text}
          </tspan>
        );
      })}
    </text>
  );
}
