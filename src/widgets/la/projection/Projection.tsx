// Виджет «Проекция с подвижным углом» (урок I.2): бегунок φ поворачивает b, длина — бегунок |b|; видны проекция b на a
// и перпендикулярный остаток. Показания — aᵀb, cos φ и длина проекции со знаком. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Readout, Vector, fmt, useLiveText } from "../../_kit";
import { cosAngle, dot, polar, project, type Vec2 } from "./model";

export interface ProjectionProps {
  initial?: { angle?: number; length?: number };
}

const A: Vec2 = [3, 0];

export default function Projection({ initial = {} }: ProjectionProps) {
  const [angle, setAngle] = useState(initial.angle ?? 50);
  const [length, setLength] = useState(initial.length ?? 2.5);
  const b = polar(length, angle);
  const p = project(A, b);
  const ab = dot(A, b);
  const live = useLiveText(`угол ${fmt(angle, 0)}°, aᵀb = ${fmt(ab, 2)}, проекция b на a = (${fmt(p[0], 2)}, 0).`);
  return (
    <div className="projection-widget">
      <Plane x={[-3.5, 4.5]} y={[-1, 3]} xStep={1} yStep={1} height={{ ratio: 0.6, min: 160, max: 400 }} equal label={`Вектор a вдоль оси x, вектор b под углом ${fmt(angle, 0)}°, проекция b на a и остаток.`}>
        <Line from={b} to={p} role="aux" />
        <Vector to={A} role="data" label="a" />
        <Vector to={b} role="param" label="b" />
        <Vector to={p} role="target" label="p" />
      </Plane>
      <div className="projection-widget__controls">
        <ParamSlider name="φ" value={angle} min={0} max={180} step={5} digits={0} role="param" onChange={setAngle} />
        <ParamSlider name="‖b‖" value={length} min={0.5} max={3} step={0.1} digits={1} role="param" onChange={setLength} />
      </div>
      <div className="projection-widget__readouts">
        <Readout name="aᵀb" value={ab} />
        <Readout name="cos φ" value={cosAngle(A, b)} />
        <Readout name="aᵀb / ‖a‖" value={p[0]} hint="длина p со знаком" />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
