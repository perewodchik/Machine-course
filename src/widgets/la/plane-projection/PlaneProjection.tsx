// Виджет «Проекция y на плоскость столбцов» (урок I.8): в ℝ³ — плоскость, натянутая на столбцы X (бирюза),
// точка y (пурпур), её проекция ŷ = Xθ̂ (оранжевый) и остаток y − ŷ пунктиром карандашом. Бегунки двигают y,
// бегунок «поворот» — камеру вокруг вертикальной оси. Показания — Xᵀ(y − ŷ) и длина остатка. Логика — model.ts.
import { useState } from "react";
import { Line, MathText, ParamSlider, Plane, Point, Polygon, Readout, Vector, fmt, usePlane, useLiveText } from "../../_kit";
import { A, B, camera, norm, patch, project, residDots, type Vec3 } from "./model";

export interface PlaneProjectionProps {
  initial?: Vec3;
}

const vec = (v: readonly number[]) => `(${v.map((x) => fmt(x, 2)).join(", ")})`;

/** Подпись оси в точке экрана: прямо по координатам плоскости, без сдвигов подписи линии. */
function AxisLabel({ at, label }: { at: readonly [number, number]; label: string }) {
  const { layout } = usePlane();
  return <MathText x={layout.sx(at[0])} y={layout.sy(at[1])} label={label} anchor="middle" />;
}

export default function PlaneProjection({ initial = [1, 0.5, 2] }: PlaneProjectionProps) {
  const [y, setY] = useState<Vec3>(initial);
  const [azimuth, setAzimuth] = useState(35);
  const cam = camera(azimuth);
  const { yhat, resid, theta } = project(y);
  const dots = residDots(resid);
  const set = (i: 0 | 1 | 2) => (v: number) => setY(y.map((x, k) => (k === i ? v : x)) as unknown as Vec3);
  const live = useLiveText(`y = ${vec(y)}, проекция ŷ = ${vec(yhat)}, остаток длины ${fmt(norm(resid), 2)}; Xᵀ(y − ŷ) = ${vec(dots)}.`);
  const axis = (to: Vec3, name: string) => (
    <g key={name}>
      <Line from={cam([0, 0, 0])} to={cam(to)} role="aux" />
      <AxisLabel at={cam([to[0] * 1.1, to[1] * 1.1, to[2] * 1.1])} label={name} />
    </g>
  );
  return (
    <div className="plane-proj">
      <Plane x={[-3, 3]} y={[-2.4, 3]} equal bare height={{ ratio: 0.9, min: 220, max: 440 }} label={`Плоскость столбцов X, точка y = ${vec(y)} и её проекция ŷ = ${vec(yhat)}; остаток перпендикулярен плоскости.`}>
        <Polygon points={patch(1.2).map(cam)} tone="aux" />
        {axis([2.6, 0, 0], "x_1")}
        {axis([0, 2.6, 0], "x_2")}
        {axis([0, 0, 2.6], "x_3")}
        <Vector to={cam(A)} role="data" label="a" />
        <Vector to={cam(B)} role="data" label="b" />
        <Line from={cam(yhat)} to={cam(y)} role="aux" dashed />
        <Vector to={cam(yhat)} role="param" label="ŷ" />
        <Vector to={cam(y)} role="target" label="y" />
        <Point x={cam(yhat)[0]} y={cam(yhat)[1]} role="param" r={4} />
      </Plane>
      <div className="plane-proj__controls">
        <ParamSlider name="y_1" value={y[0]} min={-2} max={2} step={0.1} digits={1} role="target" onChange={set(0)} />
        <ParamSlider name="y_2" value={y[1]} min={-2} max={2} step={0.1} digits={1} role="target" onChange={set(1)} />
        <ParamSlider name="y_3" value={y[2]} min={-2} max={2.5} step={0.1} digits={1} role="target" onChange={set(2)} />
        <ParamSlider name="φ" value={azimuth} min={-90} max={90} step={5} digits={0} role="aux" onChange={setAzimuth} />
      </div>
      <div className="plane-proj__facts">
        <span>
          <i>ŷ</i> = <b>{fmt(theta[0], 2)}</b>
          <i> a</i> {theta[1] < 0 ? "−" : "+"} <b>{fmt(Math.abs(theta[1]), 2)}</b>
          <i> b</i>
        </span>
        <span>
          <i>X</i>
          <sup>⊤</sup>(<i>y</i> − <i>ŷ</i>) = <b>{vec(dots)}</b>
        </span>
        <Readout name="‖y − ŷ‖" value={norm(resid)} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
