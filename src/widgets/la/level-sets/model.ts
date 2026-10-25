// Виджет «Линии уровня xᵀAx» (урок I.10): для симметричной A = [[a, b], [b, c]] — кривые xᵀAx = k на плоскости.
// В собственных осях форма — λ₁u² + λ₂w²: при λ₁, λ₂ > 0 это эллипсы с полуосями √(k/λᵢ), при λ₂ = 0 — пары
// параллельных прямых, при разных знаках — гиперболы. Модель без DOM.
import { eig2, form, levelCurves, type Vec2 } from "../../../lib/math/conics";

export { eig2, form, levelCurves, type Vec2 };
export type Kind = "pd" | "psd" | "nd" | "nsd" | "indefinite" | "zero";

const EPS = 1e-9;

export function classify(l1: number, l2: number): Kind {
  const z = (x: number) => Math.abs(x) < EPS;
  if (z(l1) && z(l2)) return "zero";
  if (l2 > EPS) return "pd";
  if (l1 < -EPS) return "nd";
  if (z(l2)) return "psd";
  if (z(l1)) return "nsd";
  return "indefinite";
}

export const KIND_TEXT: Record<Kind, string> = {
  pd: "положительно определена: линии уровня — эллипсы",
  psd: "положительно полуопределена: линии уровня — пары параллельных прямых",
  nd: "отрицательно определена: эллипсы только на отрицательных уровнях",
  nsd: "отрицательно полуопределена: пары прямых только на отрицательных уровнях",
  indefinite: "не знакоопределена: линии уровня — гиперболы",
  zero: "нулевая форма: xᵀAx = 0 везде",
};

/** Готовые матрицы: эллипсы, полосы, гиперболы. */
export const PRESETS: readonly { id: Kind; name: string; abc: readonly [number, number, number] }[] = [
  { id: "pd", name: "эллипсы", abc: [2, 0.5, 1] },
  { id: "psd", name: "полосы", abc: [1, 1, 1] },
  { id: "indefinite", name: "гиперболы", abc: [1, 1.5, -0.5] },
];
