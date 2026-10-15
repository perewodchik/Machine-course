// Раскладка плоскости: шкалы, область графика, деления осей и клетка. Чистые функции без DOM.
// Клетка — делитель шага делений, поэтому линии клетки всегда проходят через деления осей.
import { scaleLinear } from "d3-scale";

export type Range2 = readonly [number, number];

export interface PlaneOptions {
  x: Range2;
  y: Range2;
  /** Шаг делений по осям (в единицах данных). По умолчанию — «круглый» шаг на 5–10 делений. */
  xStep?: number;
  yStep?: number;
  margin?: Partial<Margin>;
  /** Высота области графика: доля ширины, ограниченная снизу и сверху (px). */
  height?: { ratio: number; min: number; max: number };
}

interface Margin {
  l: number;
  t: number;
  r: number;
  b: number;
}

export interface PlaneLayout {
  width: number;
  height: number;
  inner: { x: number; y: number; w: number; h: number };
  sx: (v: number) => number;
  sy: (v: number) => number;
  /** Пиксели на единицу данных по осям (y — со знаком минус: ось вниз). */
  kx: number;
  ky: number;
  cellX: number;
  cellY: number;
  xTicks: number[];
  yTicks: number[];
  /** Где проходят оси: через ноль, если он внутри области, иначе по краю. */
  axisX: number;
  axisY: number;
}

export const MIN_WIDTH = 300;
const CELL = 20; // px: клетка тетради
const DEFAULT_MARGIN: Margin = { l: 40, t: 20, r: 20, b: 40 };

/** «Круглый» шаг 1, 2 или 5 × 10^k, чтобы делений было 5–10. */
export function niceStep(span: number, target = 6): number {
  const raw = span / target;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/** Деления от min до max с шагом step, без накопления ошибки округления. */
export function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  const first = Math.ceil(min / step - 1e-9);
  const last = Math.floor(max / step + 1e-9);
  for (let i = first; i <= last; i++) out.push(Number((i * step).toPrecision(12)));
  return out;
}

/** Клетка около 20 px, целое число клеток в шаге делений. */
export function cellSize(stepPx: number): number {
  return stepPx / Math.max(1, Math.round(stepPx / CELL));
}

export function planeLayout(width: number, o: PlaneOptions): PlaneLayout {
  const m = { ...DEFAULT_MARGIN, ...o.margin };
  const total = Math.max(MIN_WIDTH, Math.round(width));
  const w = total - m.l - m.r;
  const hs = o.height ?? { ratio: 0.47, min: 200, max: 280 };
  const h = Math.round(Math.min(hs.max, Math.max(hs.min, w * hs.ratio)));
  const sx = scaleLinear().domain(o.x).range([m.l, m.l + w]);
  const sy = scaleLinear().domain(o.y).range([m.t + h, m.t]);
  const xStep = o.xStep ?? niceStep(o.x[1] - o.x[0]);
  const yStep = o.yStep ?? niceStep(o.y[1] - o.y[0]);
  const kx = w / (o.x[1] - o.x[0]);
  const ky = -h / (o.y[1] - o.y[0]);
  const clamp = (v: number, [a, b]: Range2) => Math.min(b, Math.max(a, v));
  return {
    width: total,
    height: h + m.t + m.b,
    inner: { x: m.l, y: m.t, w, h },
    // сотые доли пикселя: короче разметка, без хвостов вроде 64.00000000000001
    sx: (v) => Math.round(sx(v) * 100) / 100,
    sy: (v) => Math.round(sy(v) * 100) / 100,
    kx,
    ky,
    cellX: cellSize(xStep * kx),
    cellY: cellSize(yStep * -ky),
    xTicks: ticks(o.x[0], o.x[1], xStep),
    yTicks: ticks(o.y[0], o.y[1], yStep),
    axisX: Math.round(sy(clamp(0, o.y)) * 100) / 100,
    axisY: Math.round(sx(clamp(0, o.x)) * 100) / 100,
  };
}

/** Линии клетки по одной оси: от начала области с шагом cell, проходят через деления. */
export function gridLines(start: number, length: number, cell: number, anchor: number): number[] {
  // anchor — пиксель любого деления: клетка выравнивается по нему
  const offset = ((anchor - start) % cell + cell) % cell;
  const out: number[] = [];
  for (let p = start + offset; p <= start + length + 0.5; p += cell) out.push(Math.round(p * 100) / 100);
  return out;
}
