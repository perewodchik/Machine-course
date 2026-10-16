// Виджет «Линии уровня xᵀAx» (урок I.10): симметричная A = [[a, b], [b, c]] задаётся бегунками или заготовками;
// на плоскости — уровни xᵀAx = 1 и 4 сплошные, −1 и −4 — пунктиром (цвет данных: это множества точек x),
// собственные оси — карандашными штрихами.
// Показания — λ₁, λ₂ и вывод о знакоопределённости. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { classify, eig2, KIND_TEXT, levelCurves, PRESETS } from "./model";

export interface LevelSetsProps {
  initial?: "pd" | "psd" | "indefinite";
}

const LEVELS = [1, 4, -1, -4] as const;

export default function LevelSets({ initial = "pd" }: LevelSetsProps) {
  const [abc, setAbc] = useState<readonly [number, number, number]>(PRESETS.find((p) => p.id === initial)?.abc ?? PRESETS[0]!.abc);
  const [a, b, c] = abc;
  const { l1, l2, theta } = eig2(a, b, c);
  const kind = classify(l1, l2);
  const set = (i: 0 | 1 | 2) => (v: number) => setAbc(abc.map((x, k) => (k === i ? v : x)) as unknown as [number, number, number]);
  const live = useLiveText(`A = ((${fmt(a, 1)}, ${fmt(b, 1)}), (${fmt(b, 1)}, ${fmt(c, 1)})); λ₁ = ${fmt(l1, 2)}, λ₂ = ${fmt(l2, 2)}: ${KIND_TEXT[kind]}.`);
  const axis = (t: number) => [Math.cos(t) * 10, Math.sin(t) * 10] as const;
  return (
    <div className="level-sets">
      <Plane x={[-3, 3]} y={[-3, 3]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 460 }} xLabel="x_1" yLabel="x_2" label={`Линии уровня формы xᵀAx: ${KIND_TEXT[kind]}.`}>
        <Line from={axis(theta + Math.PI)} to={axis(theta)} role="aux" dashed />
        <Line from={axis(theta + Math.PI / 2 + Math.PI)} to={axis(theta + Math.PI / 2)} role="aux" dashed />
        {LEVELS.flatMap((k) => levelCurves(a, b, c, k).map((pts, i) => <Polyline key={`${k}-${i}`} points={pts} role="data" dashed={k < 0} />))}
      </Plane>
      <div className="level-sets__controls">
        <div className="level-sets__group" role="group" aria-label="Заготовки матрицы">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="btn btn--sm" aria-pressed={p.abc.every((v, k) => v === abc[k])} onClick={() => setAbc(p.abc)}>
              {p.name}
            </button>
          ))}
        </div>
        <ParamSlider name="a" value={a} min={-2} max={3} step={0.1} digits={1} onChange={set(0)} />
        <ParamSlider name="b" value={b} min={-2} max={2} step={0.1} digits={1} onChange={set(1)} />
        <ParamSlider name="c" value={c} min={-2} max={3} step={0.1} digits={1} onChange={set(2)} />
        <div className="level-sets__readouts">
          <Readout name="λ_1" value={l1} />
          <Readout name="λ_2" value={l2} />
        </div>
        <p className="level-sets__fact">{KIND_TEXT[kind][0]!.toUpperCase() + KIND_TEXT[kind].slice(1)}.</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
