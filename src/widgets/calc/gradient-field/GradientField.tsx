// Виджет «Поле градиентов над линиями уровня» (урок II.1): f(x) = ½ xᵀAx, стрелки ∇f на сетке поверх линий
// уровня, точка x₀ с градиентом и выбранным направлением u. Показания — f(x₀), ‖∇f‖ и D_u f = ∇fᵀu.
// Цвета: точка и линия уровня через неё — данные, ∇f — ответ, u — параметр, поле и прочие уровни — карандаш.
import { useState } from "react";
import { ParamSlider, Plane, Point, Polyline, Readout, Vector, fmt, useLiveText } from "../../_kit";
import { arrows, backgroundLevels, contourThrough, directional, f, grad, norm, PRESETS, unit, type Abc, type Vec2 } from "./model";

export interface GradientFieldProps {
  initial?: "bowl" | "long" | "saddle";
}

const R = 2.5;

export default function GradientField({ initial = "long" }: GradientFieldProps) {
  const [abc, setAbc] = useState<Abc>(PRESETS.find((p) => p.id === initial)?.abc ?? PRESETS[1]!.abc);
  const [x0, setX0] = useState<Vec2>([1, 1]);
  const [deg, setDeg] = useState(0);
  const g = grad(abc, x0);
  const gn = norm(g);
  const phi = (deg * Math.PI) / 180;
  const u = unit(phi);
  const du = directional(abc, x0, phi);
  const scale = gn > 1.6 ? 1.6 / gn : 1; // стрелка ∇f помещается на рисунок
  const critical = gn < 1e-9;
  const fact = critical
    ? "Критическая точка: ∇f = 0, и производная по любому направлению равна нулю."
    : `∇f перпендикулярен линии уровня через x₀. D_u f = ∇fᵀu = ‖∇f‖ cos α: наибольшая, когда u смотрит вдоль ∇f, ноль — вдоль линии уровня.`;
  const live = useLiveText(`x₀ = (${fmt(x0[0], 1)}, ${fmt(x0[1], 1)}), ∇f = (${fmt(g[0], 2)}, ${fmt(g[1], 2)}), D_u f = ${fmt(du, 2)}.`);
  return (
    <div className="gradient-field">
      <Plane x={[-R, R]} y={[-R, R]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 460 }} xLabel="x_1" yLabel="x_2" label={`Линии уровня f(x) = ½ xᵀAx и поле градиентов; в точке x₀ градиент ∇f = (${fmt(g[0], 2)}, ${fmt(g[1], 2)}) и направление u под углом ${fmt(deg, 0)}°.`}>
        {backgroundLevels(abc).map(({ k, pts }, i) => (
          <Polyline key={`l${i}`} points={pts} role="aux" dashed={k < 0} />
        ))}
        {arrows(abc, 2, 0.5).map(({ from, to }, i) => (
          <Polyline key={`a${i}`} points={[from, to]} role="aux" />
        ))}
        {!critical && contourThrough(abc, x0).map((pts, i) => <Polyline key={`c${i}`} points={pts} role="data" />)}
        {!critical && <Vector from={x0} to={[x0[0] + g[0] * scale, x0[1] + g[1] * scale]} role="target" label="∇f" />}
        <Vector from={x0} to={[x0[0] + u[0] * 0.9, x0[1] + u[1] * 0.9]} role="param" label="u" />
        <Point x={x0[0]} y={x0[1]} role="data" label="x₀" />
      </Plane>
      <div className="gradient-field__controls">
        <div className="gradient-field__group" role="group" aria-label="Функция">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="btn btn--sm" aria-pressed={p.abc.every((v, k) => v === abc[k])} onClick={() => setAbc(p.abc)}>
              {p.name}
            </button>
          ))}
        </div>
        <ParamSlider name="x_1" value={x0[0]} min={-2} max={2} step={0.1} digits={1} role="data" onChange={(v) => setX0([v, x0[1]])} />
        <ParamSlider name="x_2" value={x0[1]} min={-2} max={2} step={0.1} digits={1} role="data" onChange={(v) => setX0([x0[0], v])} />
        <ParamSlider name="угол u" value={deg} min={0} max={355} step={5} digits={0} role="param" onChange={setDeg} />
        <div className="gradient-field__readouts">
          <Readout name="f(x₀)" value={f(abc, x0)} />
          <Readout name="‖∇f‖" value={gn} />
          <Readout name="D_uf" value={du} />
        </div>
        <p className="gradient-field__fact">{fact}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
