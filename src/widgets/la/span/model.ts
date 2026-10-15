// Виджет «Оболочка двух векторов» (урок I.1): все комбинации c₁a + c₂b — вся плоскость, прямая или точка.
// Модель без DOM: вид оболочки, комбинация, целые комбинации (узлы косой решётки) в пределах поля.
export type Vec2 = readonly [number, number];
export type SpanKind = "plane" | "line" | "point";

export interface Preset {
  id: string;
  name: string;
  a: Vec2;
  b: Vec2;
}

export const PRESETS: readonly Preset[] = [
  { id: "independent", name: "не параллельны", a: [2, 1], b: [-1, 1] },
  { id: "parallel", name: "параллельны", a: [2, 1], b: [-4, -2] },
  { id: "zero", name: "b = 0", a: [2, 1], b: [0, 0] },
];

export const det2 = (a: Vec2, b: Vec2) => a[0] * b[1] - a[1] * b[0] + 0;
export const combo = (a: Vec2, b: Vec2, c1: number, c2: number): Vec2 => [c1 * a[0] + c2 * b[0] + 0, c1 * a[1] + c2 * b[1] + 0];

export function spanKind(a: Vec2, b: Vec2): SpanKind {
  if (Math.abs(det2(a, b)) > 1e-12) return "plane";
  return a[0] || a[1] || b[0] || b[1] ? "line" : "point";
}

/** Целые комбинации c₁a + c₂b с |c| ≤ k, попавшие в квадрат [−r, r]²: узлы решётки, которую порождают a и b. */
export function lattice(a: Vec2, b: Vec2, r: number, k = 8): Vec2[] {
  const seen = new Set<string>();
  const out: Vec2[] = [];
  for (let i = -k; i <= k; i++)
    for (let j = -k; j <= k; j++) {
      const p = combo(a, b, i, j);
      const key = `${p[0]},${p[1]}`;
      if (Math.abs(p[0]) <= r && Math.abs(p[1]) <= r && !seen.has(key)) {
        seen.add(key);
        out.push(p);
      }
    }
  return out;
}

export const SPAN_TEXT: Record<SpanKind, string> = {
  plane: "вся плоскость: a и b не параллельны",
  line: "прямая: a и b параллельны",
  point: "одна точка — ноль",
};
