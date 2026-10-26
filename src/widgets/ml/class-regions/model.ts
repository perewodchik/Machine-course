// Модель виджета «Области классов» (урок 1.5 «Основ ML»): 300 «Квартир» на плоскости стандартизованных площади и пути
// до метро, классы — эконом, комфорт, бизнес по терцилям цены (data.json — ячейка урока). У класса j веса
// θ_j = (b_j, k_j cos φ_j, k_j sin φ_j): стрелка w_j из центра, длина k_j, сдвиг b_j. Область — argmax_j θ_jᵀx.
import { accuracy, crossEntropy, fitSoftmax, probs, type Theta } from "../../../lib/math/softmax";
import raw from "./data.json";

export const X: number[][] = raw.z1.map((a, i) => [1, a, raw.z2[i]!]);
export const Y: number[] = raw.y;
export const CLASSES = ["эконом", "комфорт", "бизнес"] as const;

export interface Arrow {
  phi: number;
  k: number;
  b: number;
}

export const toTheta = (arrows: readonly Arrow[]): Theta =>
  arrows.map(({ phi, k, b }) => {
    const a = (phi * Math.PI) / 180;
    return [b, k * Math.cos(a), k * Math.sin(a)];
  });

export const fromTheta = (theta: Theta): Arrow[] =>
  theta.map(([b, w1, w2]) => ({ phi: (Math.atan2(w2!, w1!) * 180) / Math.PI, k: Math.hypot(w1!, w2!), b: b! }));

/** Прибавить один и тот же вектор c ко всем θ_j. */
export const shiftAll = (theta: Theta, c: readonly number[]): Theta => theta.map((th) => th.map((v, i) => v + c[i]!));

export const stats = (theta: Theta) => ({ J: crossEntropy(theta, X, Y), acc: accuracy(theta, X, Y) });

let fitted: Theta | null = null;
/** Минимум кросс-энтропии спуском, как в ячейке урока (3000 шагов, α = 2); считается один раз. */
export const best = (): Theta => (fitted ??= fitSoftmax(X, Y, 3, 2, 3000));

/** Класс и уверенность в точке плоскости. */
export function region(theta: Theta, z1: number, z2: number): { j: number; p: number } {
  const p = probs(theta, [1, z1, z2]);
  const m = Math.max(...p);
  return { j: p.indexOf(m), p: m };
}
