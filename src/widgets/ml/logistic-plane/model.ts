// Модель виджета «Сигмоида над плоскостью» (урок 1.4 «Основ ML»): 200 «Квартир» на плоскости «площадь — до метро»,
// класс 1 — дороже медианы (data.json — ячейка урока). Признаки стандартизованы по этим 200; веса задаются
// направлением нормали φ, сдвигом границы c и крутизной k: θ = (−kc, k cos φ, k sin φ), граница — θᵀx = 0.
import { meanLoglik, newtonPath, sigmoid } from "../../../lib/math/logistic";
import raw from "./data.json";

export interface Item {
  area: number;
  metro: number;
  y: number;
}

const mean = (v: readonly number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v: readonly number[]) => Math.sqrt(mean(v.map((x) => (x - mean(v)) ** 2)));

export const BASE: Item[] = raw.area.map((area, i) => ({ area, metro: raw.metro[i]!, y: raw.y[i]! }));
/** Выброс: большая квартира у метро, но дешевле медианы (например, в аварийном доме). */
export const OUTLIER: Item = { area: 118, metro: 3, y: 0 };

// масштаб — по 200 квартирам без выброса, чтобы ручки не прыгали при его добавлении
const MU = [mean(BASE.map((d) => d.area)), mean(BASE.map((d) => d.metro))] as const;
const SD = [sd(BASE.map((d) => d.area)), sd(BASE.map((d) => d.metro))] as const;

export const features = (area: number, metro: number) => [1, (area - MU[0]) / SD[0], (metro - MU[1]) / SD[1]];
export const design = (items: readonly Item[]) => items.map((d) => features(d.area, d.metro));

export interface Knobs {
  /** Направление нормали к границе, градусы. */
  phi: number;
  /** Сдвиг границы вдоль нормали в стандартизованных единицах. */
  c: number;
  /** Крутизна ‖w‖. */
  k: number;
}

export const toTheta = ({ phi, c, k }: Knobs) => {
  const a = (phi * Math.PI) / 180;
  return [-k * c, k * Math.cos(a), k * Math.sin(a)];
};

export function fromTheta([t0, t1, t2]: readonly number[]): Knobs {
  const k = Math.hypot(t1!, t2!);
  return { phi: (Math.atan2(t2!, t1!) * 180) / Math.PI, c: -t0! / k, k };
}

export const prob = (theta: readonly number[], area: number, metro: number) => {
  const x = features(area, metro);
  return sigmoid(theta[0]! * x[0]! + theta[1]! * x[1]! + theta[2]! * x[2]!);
};

/** Потери объекта −log p(y | x; θ). */
export const itemLoss = (theta: readonly number[], d: Item) => {
  const p = prob(theta, d.area, d.metro);
  return -Math.log(Math.max(1e-12, d.y ? p : 1 - p));
};

export function stats(theta: readonly number[], items: readonly Item[]) {
  const X = design(items);
  const y = items.map((d) => d.y);
  const right = items.filter((d) => (prob(theta, d.area, d.metro) > 0.5) === (d.y === 1)).length;
  return { ell: meanLoglik(theta, X, y), acc: right / items.length };
}

/** Максимум правдоподобия методом Ньютона. */
export function best(items: readonly Item[]): number[] {
  return newtonPath(design(items), items.map((d) => d.y), [0, 0, 0]).points.at(-1)!;
}

/** Две точки границы θᵀx = 0 в исходных единицах — далеко за краями поля (Plane обрежет). */
export function boundary(theta: readonly number[]): [[number, number], [number, number]] {
  const [t0, t1, t2] = theta as [number, number, number];
  // точка на границе, ближайшая к центру в стандартизованных координатах, и направление вдоль неё
  const k2 = t1 * t1 + t2 * t2;
  const p = [(-t0 * t1) / k2, (-t0 * t2) / k2];
  const dir = [-t2, t1].map((v) => v / Math.sqrt(k2));
  const at = (s: number): [number, number] => [MU[0] + SD[0] * (p[0]! + s * dir[0]!), MU[1] + SD[1] * (p[1]! + s * dir[1]!)];
  return [at(-20), at(20)];
}
