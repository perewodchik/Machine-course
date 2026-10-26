// Модель виджета «Спуск по линиям уровня» (урок 1.2 «Основ ML»): J(θ₀, θ₁) = ‖Zθ − y‖²/(2n) для цены от площади,
// Z = [1, x] или [1, (x − μ)/s] после стандартизации. Пакетный спуск, SGD и мини-батч с перемешиванием по эпохам
// (seed), постоянный или убывающий шаг α/(1 + t/t₀). Гессиан H = ZᵀZ/n: порог шага 2/λ_max, κ = λ_max/λ_min.
import { gauss } from "../../../lib/math/correlation";
import { rng } from "../../../lib/math/rng";

export type Vec2 = [number, number];
export type Mode = "batch" | "sgd" | "minibatch";

export interface Data {
  x: number[];
  y: number[];
}

/** 60 квартир: площадь 25–120 м², цена ≈ 1.5 + 0.11 · площадь + шум 0.8 (как mlf.datasets). */
export function makeData(seed = 12, n = 60): Data {
  const r = rng(seed);
  const x = Array.from({ length: n }, () => Math.round(25 + 95 * r.next()));
  return { x, y: x.map((a) => 1.5 + 0.11 * a + 0.8 * gauss(r)) };
}

export interface Problem {
  z: number[];
  y: number[];
  mu: number;
  s: number;
  standardized: boolean;
  H: [[number, number], [number, number]];
  thetaStar: Vec2;
  jStar: number;
  lamMax: number;
  lamMin: number;
}

export function problem(d: Data, standardized: boolean): Problem {
  const n = d.x.length;
  const mu = d.x.reduce((a, b) => a + b, 0) / n;
  const s = Math.sqrt(d.x.reduce((a, b) => a + (b - mu) ** 2, 0) / n);
  const z = standardized ? d.x.map((v) => (v - mu) / s) : [...d.x];
  const sz = z.reduce((a, b) => a + b, 0) / n;
  const szz = z.reduce((a, b) => a + b * b, 0) / n;
  const sy = d.y.reduce((a, b) => a + b, 0) / n;
  const szy = z.reduce((a, v, i) => a + v * d.y[i]!, 0) / n;
  const H: [[number, number], [number, number]] = [
    [1, sz],
    [sz, szz],
  ];
  const det = szz - sz * sz;
  const thetaStar: Vec2 = [(szz * sy - sz * szy) / det, (szy - sz * sy) / det];
  const tr = 1 + szz;
  const disc = Math.sqrt((tr * tr) / 4 - det);
  const p: Problem = { z, y: d.y, mu, s, standardized, H, thetaStar, jStar: 0, lamMax: tr / 2 + disc, lamMin: tr / 2 - disc };
  p.jStar = loss(p, thetaStar);
  return p;
}

export const loss = (p: Problem, t: Vec2) => p.z.reduce((a, v, i) => a + (t[0] + t[1] * v - p.y[i]!) ** 2, 0) / (2 * p.z.length);

export interface RunOptions {
  alpha: number;
  mode: Mode;
  batch: number;
  epochs: number;
  decay: boolean;
  start: Vec2;
  seed?: number;
}

/** Путь весов: точка после каждого шага; расходящийся путь обрывается, как только уходит далеко. */
export function run(p: Problem, o: RunOptions): Vec2[] {
  const r = rng(o.seed ?? 1);
  const n = p.z.length;
  const path: Vec2[] = [[...o.start]];
  let t: Vec2 = [...o.start];
  let step = 0;
  const size = o.mode === "batch" ? n : o.mode === "sgd" ? 1 : Math.max(1, Math.min(n, o.batch));
  for (let e = 0; e < o.epochs; e++) {
    const order = r.shuffle(Array.from({ length: n }, (_, i) => i));
    for (let k = 0; k < n; k += size) {
      const idx = o.mode === "batch" ? order : order.slice(k, k + size);
      let g0 = 0;
      let g1 = 0;
      for (const i of idx) {
        const err = t[0] + t[1] * p.z[i]! - p.y[i]!;
        g0 += err;
        g1 += err * p.z[i]!;
      }
      const a = o.decay ? o.alpha / (1 + step / (5 * Math.ceil(n / size))) : o.alpha;
      t = [t[0] - (a * g0) / idx.length, t[1] - (a * g1) / idx.length];
      step++;
      path.push([...t]);
      if (!Number.isFinite(t[0] + t[1]) || Math.abs(t[0]) + Math.abs(t[1]) > 1e6) return path;
      if (o.mode === "batch") break;
    }
  }
  return path;
}
