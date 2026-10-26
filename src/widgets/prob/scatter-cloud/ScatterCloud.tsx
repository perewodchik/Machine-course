// Виджет «Облако точек» (урок III.9): 40 точек линейного облака с бегунком ρ, параболы или кольца и одна точка-выброс,
// которую двигают бегунками x₀, y₀. Показания — Cov и ρ облака с выбросом и без него. Модель — model.ts и src/lib/math/correlation.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Readout, fmt, useLiveText } from "../../_kit";
import { corr, moments, type Pt } from "../../../lib/math/correlation";
import { cloud, SHAPE_NAMES, type CloudShape } from "./model";

export interface ScatterCloudProps {
  initial?: { shape?: CloudShape; rho?: number; outlier?: boolean };
}

export default function ScatterCloud({ initial = {} }: ScatterCloudProps) {
  const [shape, setShape] = useState<CloudShape>(initial.shape ?? "linear");
  const [rho, setRho] = useState(initial.rho ?? 0.6);
  const [outlier, setOutlier] = useState(initial.outlier ?? false);
  const [ox, setOx] = useState(3.5);
  const [oy, setOy] = useState(-3.5);
  const base = cloud(shape, rho);
  const all: Pt[] = outlier ? [...base, [ox, oy]] : base;
  const m = moments(all);
  const r = corr(all);
  const r0 = corr(base);
  const live = useLiveText(`${SHAPE_NAMES[shape]}${shape === "linear" ? `, ρ = ${fmt(rho, 2)}` : ""}${outlier ? `, выброс в (${fmt(ox, 1)}, ${fmt(oy, 1)})` : ""}: выборочная корреляция ${fmt(r, 2)}, ковариация ${fmt(m.cov, 2)}.`);

  return (
    <div className="scatter-cloud">
      <Plane x={[-4, 4]} y={[-4, 4]} xStep={1} yStep={1} equal xLabel="x" yLabel="y" height={{ ratio: 0.6, min: 240, max: 380 }} label={`Облако точек: ${SHAPE_NAMES[shape]}, выборочная корреляция ${fmt(r, 2)}`}>
        <Line from={[m.mx, -4]} to={[m.mx, 4]} role="aux" />
        <Line from={[-4, m.my]} to={[4, m.my]} role="aux" />
        {base.map(([x, y], i) => (
          <Point key={i} x={x} y={y} role="data" r={4} />
        ))}
        {outlier && <Point x={ox} y={oy} role="param" label="выброс" />}
      </Plane>
      <div className="scatter-cloud__controls">
        <div className="scatter-cloud__group" role="group" aria-label="Форма облака">
          {(Object.keys(SHAPE_NAMES) as CloudShape[]).map((s) => (
            <button key={s} type="button" className="btn btn--sm" aria-pressed={shape === s} onClick={() => setShape(s)}>
              {SHAPE_NAMES[s]}
            </button>
          ))}
          <button type="button" className="btn btn--sm" aria-pressed={outlier} onClick={() => setOutlier(!outlier)}>
            выброс
          </button>
        </div>
        {shape === "linear" && <ParamSlider name="ρ" value={rho} min={-0.95} max={0.95} step={0.05} digits={2} onChange={setRho} />}
        {outlier && <ParamSlider name="x_0" value={ox} min={-4} max={4} step={0.5} digits={1} role="param" onChange={setOx} />}
        {outlier && <ParamSlider name="y_0" value={oy} min={-4} max={4} step={0.5} digits={1} role="param" onChange={setOy} />}
        <Readout name="Cov" value={m.cov} digits={2} hint="средний (x − x̄)(y − ȳ)" />
        <Readout name="r" value={r} digits={2} hint="выборочная корреляция" />
        <Readout name="r без выброса" value={r0} digits={2} hint="только облако" />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
