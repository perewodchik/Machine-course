// Виджет «Ax = b: нет решений, одно, бесконечно много» (урок I.6): система 2 × 2 как две прямые на плоскости.
// Строка i — уравнение aᵢ₁x₁ + aᵢ₂x₂ = bᵢ, прямая; решение — их общая точка. Сколько решений, решают ранги
// A и расширенной матрицы [A | b]. Модель без DOM.
export type Row = readonly [number, number, number]; // a₁, a₂, b
export type Kind = "one" | "none" | "many";

const EPS = 1e-9;
const det2 = (a: number, b: number, c: number, d: number) => a * d - b * c;

/** Ранг матрицы 2 × k по строкам: 0, 1 или 2. */
export function rank(rows: readonly (readonly number[])[]): number {
  const [r1, r2] = rows as [readonly number[], readonly number[]];
  const nz = (r: readonly number[]) => r.some((v) => Math.abs(v) > EPS);
  if (!nz(r1) && !nz(r2)) return 0;
  // ранг 2, если найдётся ненулевой минор 2 × 2
  for (let i = 0; i < r1.length; i++) for (let j = i + 1; j < r1.length; j++) if (Math.abs(det2(r1[i]!, r1[j]!, r2[i]!, r2[j]!)) > EPS) return 2;
  return 1;
}

export interface Analysis {
  rankA: number;
  rankAb: number;
  kind: Kind;
  /** Единственное решение, если оно есть. */
  x?: readonly [number, number];
}

/** Теорема Кронекера — Капелли: ранги равны и полные — одно решение, равны и меньше 2 — бесконечно много, разные — нет. */
export function analyze(r1: Row, r2: Row): Analysis {
  const rankA = rank([r1.slice(0, 2), r2.slice(0, 2)]);
  const rankAb = rank([r1, r2]);
  if (rankA !== rankAb) return { rankA, rankAb, kind: "none" };
  if (rankA < 2) return { rankA, rankAb, kind: "many" };
  const d = det2(r1[0], r1[1], r2[0], r2[1]);
  return { rankA, rankAb, kind: "one", x: [det2(r1[2], r1[1], r2[2], r2[1]) / d + 0, det2(r1[0], r1[2], r2[0], r2[2]) / d + 0] };
}

/** Две далёкие точки прямой a₁x₁ + a₂x₂ = b для рисования; null — если строка нулевая (это не прямая). */
export function lineEnds([a1, a2, b]: Row, far = 50): [readonly [number, number], readonly [number, number]] | null {
  const n = Math.hypot(a1, a2);
  if (n < EPS) return null;
  // ближайшая к нулю точка прямой и направление вдоль неё
  const p = [(a1 * b) / (n * n), (a2 * b) / (n * n)];
  const dir = [-a2 / n, a1 / n];
  return [
    [p[0]! - far * dir[0]!, p[1]! - far * dir[1]!],
    [p[0]! + far * dir[0]!, p[1]! + far * dir[1]!],
  ];
}

export const KIND_TEXT: Record<Kind, string> = {
  one: "одно решение: прямые пересекаются",
  none: "нет решений: прямые параллельны",
  many: "бесконечно много решений: прямые совпадают",
};

/** Готовые вторые строки при первой строке (1, 2 | 2): пересекаются, параллельны, совпадают. */
export const PRESETS: readonly { id: Kind; name: string; row: Row }[] = [
  { id: "one", name: "пересекаются", row: [1, -1, -1] },
  { id: "none", name: "параллельны", row: [2, 4, 1] },
  { id: "many", name: "совпадают", row: [2, 4, 4] },
];
export const FIRST: Row = [1, 2, 2];
