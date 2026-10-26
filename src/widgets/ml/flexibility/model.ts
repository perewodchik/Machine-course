// Модель виджета «Гибкость модели» (урок 1.3 «Основ ML»): цена м² от пути до метро (data.json — mlf.datasets.metro_prices,
// разбиение как в ячейке урока). Две ручки сложности: степень полинома по стандартизованному признаку и ширина окна τ
// локально взвешенной регрессии: в точке запроса — прямая по взвешенному МНК с весами exp(−(xᵢ − x)²/(2τ²)).
import { polyEval, polyFit } from "../../../lib/math/poly";
import raw from "./data.json";

export type Pt = readonly [number, number];

export interface Data {
  train: Pt[];
  val: Pt[];
  mu: number;
  s: number;
}

export function loadData(): Data {
  const inTrain = new Set(raw.train);
  const pts = raw.x.map((x, i) => [x, raw.y[i]!] as const);
  const train = pts.filter((_, i) => inTrain.has(i));
  const val = pts.filter((_, i) => !inTrain.has(i));
  const mu = train.reduce((a, [x]) => a + x, 0) / train.length;
  const s = Math.sqrt(train.reduce((a, [x]) => a + (x - mu) ** 2, 0) / train.length);
  return { train, val, mu, s };
}

const rmseOf = (pred: (x: number) => number, pts: readonly Pt[]) => Math.sqrt(pts.reduce((a, [x, y]) => a + (pred(x) - y) ** 2, 0) / pts.length);

export interface Fit {
  predict: (x: number) => number;
  train: number;
  val: number;
}

/** Полином степени p по z = (x − μ)/s. */
export function polyModel(d: Data, p: number): Fit {
  const z = (x: number) => (x - d.mu) / d.s;
  const theta = polyFit(d.train.map(([x, y]) => [z(x), y] as const), p);
  const predict = (x: number) => polyEval(theta, z(x));
  return { predict, train: rmseOf(predict, d.train), val: rmseOf(predict, d.val) };
}

/** Локальная прямая в точке запроса q: θ(q) = (XᵀWX)⁻¹XᵀWy и веса объектов. */
export function localLine(pts: readonly Pt[], q: number, tau: number): { theta: [number, number]; w: number[] } {
  const w = pts.map(([x]) => Math.exp(-((x - q) ** 2) / (2 * tau * tau)));
  // в центрированных координатах u = x − q система 2 × 2 устойчивее
  let s0 = 0, s1 = 0, s2 = 0, t0 = 0, t1 = 0;
  pts.forEach(([x, y], i) => {
    const u = x - q;
    s0 += w[i]!;
    s1 += w[i]! * u;
    s2 += w[i]! * u * u;
    t0 += w[i]! * y;
    t1 += w[i]! * u * y;
  });
  const det = s0 * s2 - s1 * s1;
  const b = det > 1e-12 * s0 * s0 ? (s0 * t1 - s1 * t0) / det : 0;
  const a = (t0 - b * s1) / s0; // прогноз в точке q
  return { theta: [a - b * q, b], w };
}

export function lwrModel(d: Data, tau: number): Fit {
  const predict = (x: number) => {
    const { theta } = localLine(d.train, x, tau);
    return theta[0] + theta[1] * x;
  };
  return { predict, train: rmseOf(predict, d.train), val: rmseOf(predict, d.val) };
}
