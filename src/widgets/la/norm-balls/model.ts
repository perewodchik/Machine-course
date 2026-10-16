// Виджет «Единичные шары норм» (урок I.2): точки, где ‖x‖₁, ‖x‖₂ или ‖x‖∞ равны единице, — ромб, круг и квадрат.
// Модель без DOM: нормы вектора плоскости и вершины «шаров».
export type Vec2 = readonly [number, number];
export type NormId = "l1" | "l2" | "linf";

export const norm = (id: NormId, [x, y]: Vec2): number =>
  id === "l1" ? Math.abs(x) + Math.abs(y) : id === "l2" ? Math.hypot(x, y) : Math.max(Math.abs(x), Math.abs(y));

export const NORM_NAMES: Record<NormId, string> = { l1: "‖x‖₁", l2: "‖x‖₂", linf: "‖x‖∞" };

/** Вершины единичного «шара» ℓ₁ (ромб) и ℓ∞ (квадрат) — по кругу, первая повторена в конце. */
export const BALL: Record<"l1" | "linf", Vec2[]> = {
  l1: [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 0]],
  linf: [[1, 1], [-1, 1], [-1, -1], [1, -1], [1, 1]],
};

/** Всегда ‖x‖∞ ≤ ‖x‖₂ ≤ ‖x‖₁: шары вложены — квадрат снаружи, ромб внутри. */
export const ordered = (x: Vec2) => norm("linf", x) <= norm("l2", x) + 1e-12 && norm("l2", x) <= norm("l1", x) + 1e-12;
