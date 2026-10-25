// Виджет «Активное и неактивное ограничение» (урок II.9): бегунки двигают центр c функции ½‖x − c‖², ограничение —
// полуплоскость x₁ + x₂ ≤ 1. На рисунке — граница, окружности уровня f, x* и отрезок от c до x*. Показания — α*,
// g(x*), их произведение и значения прямой и двойственной задач. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { dual, g, primal, PROBLEM, solve, type Vec } from "./model";

export interface KktProps {
  initial?: { c?: Vec };
}

const ring = (c: Vec, r: number): [number, number][] => Array.from({ length: 97 }, (_, i) => [c[0] + r * Math.cos((i * Math.PI) / 48), c[1] + r * Math.sin((i * Math.PI) / 48)]);

export default function Kkt({ initial = {} }: KktProps) {
  const [c, setC] = useState<Vec>(initial.c ?? [2, 1]);
  const s = solve(PROBLEM, c);
  const p = primal(c, s.x);
  const d = dual(PROBLEM, c, s.alpha);
  const fact = s.active
    ? `Ограничение активно: x* на границе, α* = ${fmt(s.alpha, 2)} > 0, а g(x*) = 0.`
    : "Ограничение неактивно: c допустима, x* = c, α* = 0, а g(x*) < 0.";
  const live = useLiveText(`c = (${fmt(c[0], 1)}, ${fmt(c[1], 1)}), x* = (${fmt(s.x[0], 2)}, ${fmt(s.x[1], 2)}). ${fact}`);
  const r = Math.sqrt(2 * p);

  return (
    <div className="kkt">
      <Plane x={[-2, 3]} y={[-2, 3]} xStep={1} yStep={1} equal xLabel="x₁" yLabel="x₂" height={{ ratio: 1, min: 240, max: 440 }} label={`Полуплоскость x₁ + x₂ ≤ 1, центр c = (${fmt(c[0], 1)}, ${fmt(c[1], 1)}) и решение x* = (${fmt(s.x[0], 2)}, ${fmt(s.x[1], 2)})`}>
        {[0.5, 1, 1.5, 2].map((k) => (
          <Polyline key={k} points={ring(c, k)} role="data" />
        ))}
        {s.active && <Polyline points={ring(c, r)} role="param" dashed />}
        <Line from={[-2, 3]} to={[3, -2]} role="target" label="g = 0" />
        {s.active && <Line from={c} to={s.x} role="aux" />}
        <Point x={c[0]} y={c[1]} role="data" label="c" />
        <Point x={s.x[0]} y={s.x[1]} role="param" label="x*" />
      </Plane>
      <div className="kkt__controls">
        <ParamSlider name="c_1" value={c[0]} min={-2} max={3} step={0.1} digits={1} role="data" onChange={(v) => setC([v, c[1]])} />
        <ParamSlider name="c_2" value={c[1]} min={-2} max={3} step={0.1} digits={1} role="data" onChange={(v) => setC([c[0], v])} />
        <Readout name="α*" value={s.alpha} digits={2} />
        <Readout name="g(x*)" value={g(PROBLEM, s.x)} digits={2} />
        <Readout name="α* · g(x*)" value={s.alpha * g(PROBLEM, s.x) + 0} digits={2} hint="дополняющая нежёсткость" />
        <Readout name="p* = d*" value={p} digits={3} hint={`двойственная: ${fmt(d, 3)}`} />
        <p className="kkt__fact">{fact}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
