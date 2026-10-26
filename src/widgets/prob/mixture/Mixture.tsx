// Виджет «Смесь двух гауссиан и ответственности» (урок III.12): сверху — плотность смеси и пунктиром взвешенные
// компоненты φ p(x | z = 1), (1 − φ) p(x | z = 2); снизу — ответственность w₁(x) = P(z = 1 | x). Бегунки —
// φ, μ₁, σ₁, μ₂, σ₂ и точка x₀. Показания — p(x₀) и ответственности в x₀. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { density, parts, resp1, type Mix } from "./model";

export interface MixtureProps {
  initial?: Partial<Mix> & { x0?: number };
}

const XS = Array.from({ length: 221 }, (_, i) => -5 + i / 20);

export default function Mixture({ initial = {} }: MixtureProps) {
  const [m, setM] = useState<Mix>({ phi: initial.phi ?? 0.4, mu1: initial.mu1 ?? -1.5, s1: initial.s1 ?? 0.8, mu2: initial.mu2 ?? 2, s2: initial.s2 ?? 1.2 });
  const [x0, setX0] = useState(initial.x0 ?? 0.5);
  const set = (k: keyof Mix) => (v: number) => setM({ ...m, [k]: v });
  const top = Math.max(...XS.map((x) => density(m, x)));
  const yMax = Math.max(0.3, Math.ceil(top * 10) / 10 + 0.05);
  const w1 = resp1(m, x0);
  const live = useLiveText(`Смесь: φ = ${fmt(m.phi, 2)}, компоненты N(${fmt(m.mu1, 1)}, ${fmt(m.s1, 1)}²) и N(${fmt(m.mu2, 1)}, ${fmt(m.s2, 1)}²). В x₀ = ${fmt(x0, 1)}: p(x₀) = ${fmt(density(m, x0), 3)}, P(z = 1 | x₀) = ${fmt(w1, 2)}.`);

  return (
    <div className="mixture">
      <Plane x={[-5, 6]} y={[0, yMax]} xStep={1} yStep={yMax > 0.6 ? 0.2 : 0.1} xLabel="x" yLabel="p(x)" height={{ ratio: 0.42, min: 170, max: 260 }} label={`Плотность смеси двух нормальных и взвешенные компоненты; в x₀ = ${fmt(x0, 1)} плотность ${fmt(density(m, x0), 3)}`}>
        <Polyline points={XS.map((x) => [x, parts(m, x)[0]] as [number, number])} role="aux" dashed />
        <Polyline points={XS.map((x) => [x, parts(m, x)[1]] as [number, number])} role="aux" dashed />
        <Polyline points={XS.map((x) => [x, density(m, x)] as [number, number])} role="data" />
        <Line from={[x0, 0]} to={[x0, yMax]} role="param" label="x₀" />
      </Plane>
      <Plane x={[-5, 6]} y={[0, 1]} xStep={1} yStep={0.25} xLabel="x" yLabel="P(z = 1 | x)" height={{ ratio: 0.3, min: 130, max: 190 }} label={`Ответственность первой компоненты; в x₀ = ${fmt(x0, 1)} она равна ${fmt(w1, 2)}`}>
        <Polyline points={XS.map((x) => [x, resp1(m, x)] as [number, number])} role="target" />
        <Line from={[x0, 0]} to={[x0, 1]} role="param" />
        <Point x={x0} y={w1} role="target" />
      </Plane>
      <div className="mixture__controls">
        <ParamSlider name="φ" value={m.phi} min={0.05} max={0.95} step={0.05} digits={2} onChange={set("phi")} />
        <ParamSlider name="x_0" value={x0} min={-5} max={6} step={0.1} digits={1} role="param" onChange={setX0} />
        <ParamSlider name="μ_1" value={m.mu1} min={-4} max={5} step={0.5} digits={1} onChange={set("mu1")} />
        <ParamSlider name="μ_2" value={m.mu2} min={-4} max={5} step={0.5} digits={1} onChange={set("mu2")} />
        <ParamSlider name="σ_1" value={m.s1} min={0.3} max={2} step={0.1} digits={1} onChange={set("s1")} />
        <ParamSlider name="σ_2" value={m.s2} min={0.3} max={2} step={0.1} digits={1} onChange={set("s2")} />
        <div className="mixture__readouts">
          <Readout name="p(x_0)" value={density(m, x0)} digits={3} hint="φ p₁ + (1 − φ) p₂" />
          <Readout name="w_1" value={w1} digits={2} hint="P(z = 1 | x₀)" />
          <Readout name="w_2" value={1 - w1} digits={2} hint="P(z = 2 | x₀)" />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
