// Виджет «Плотность и CDF при перетаскивании порога» (урок III.4): сверху — функция вероятности (столбики) или
// плотность с закрашенной площадью слева от порога t, снизу — F(x) и точка (t, F(t)). Бегунок t, выбор
// распределения; показания — F(t) и значение плотности в t, которое вероятностью не является. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polygon, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { cdf, cdfCurve, DIST_IDS, DISTS, pdfCurve, type DistId } from "./model";

export interface DensityCdfProps {
  initial?: { dist?: DistId; t?: number };
  /** Какие распределения можно выбрать; одно — кнопок выбора нет. */
  dists?: DistId[];
}

export default function DensityCdf({ initial = {}, dists = DIST_IDS }: DensityCdfProps) {
  const [id, setId] = useState<DistId>(initial.dist ?? dists[0] ?? "binomial");
  const d = DISTS[id];
  const [t, setT] = useState(initial.t ?? d.init);
  const choose = (next: DistId) => {
    setId(next);
    setT(DISTS[next].init);
  };
  const F = cdf(d, t);
  const local = d.discrete ? d.pmf!(Math.round(t * 1e9) / 1e9) : d.pdf!(t);
  const live = useLiveText(`${d.name}: порог t = ${fmt(t, 2)}, F(t) = P(X ≤ t) = ${fmt(F, 3)}; ${d.discrete ? `P(X = t) = ${fmt(local, 3)}` : `плотность в t равна ${fmt(local, 3)} — это не вероятность`}.`);
  const area = d.discrete ? [] : ([[d.x[0], 0], ...pdfCurve(d).filter(([x]) => x <= t), [t, d.pdf!(t)], [t, 0]] as [number, number][]);

  return (
    <div className="density-cdf">
      <Plane x={d.x} y={[0, d.yMax]} xStep={d.x[1] - d.x[0] > 6 ? 2 : d.x[1] - d.x[0] > 2 ? 1 : 0.5} yStep={d.yMax > 1 ? 0.5 : 0.1} xLabel="x" yLabel="p(x)" height={{ ratio: 0.45, min: 160, max: 260 }} label={`${d.discrete ? "Функция вероятности" : "Плотность"} распределения «${d.name}», порог t = ${fmt(t, 2)}`}>
        {d.discrete
          ? d.support!.flatMap((k) => [<Line key={`s${k}`} from={[k, 0]} to={[k, d.pmf!(k)]} role={k <= t ? "param" : "data"} />, <Point key={`p${k}`} x={k} y={d.pmf!(k)} role={k <= t ? "param" : "data"} />])
          : [<Polygon key="area" points={area} tone="pen" />, <Polyline key="pdf" points={pdfCurve(d)} role="data" />]}
        <Line from={[t, 0]} to={[t, d.yMax]} role="aux" label="t" />
      </Plane>
      <Plane x={d.x} y={[0, 1.1]} xStep={d.x[1] - d.x[0] > 6 ? 2 : d.x[1] - d.x[0] > 2 ? 1 : 0.5} yStep={0.5} xLabel="x" yLabel="F(x)" height={{ ratio: 0.35, min: 130, max: 210 }} label={`Функция распределения: F(${fmt(t, 2)}) = ${fmt(F, 3)}`}>
        <Polyline points={cdfCurve(d)} role="data" />
        <Line from={[d.x[0], F]} to={[t, F]} role="aux" />
        <Point x={t} y={F} role="param" label="F(t)" />
      </Plane>
      <div className="density-cdf__controls">
        <ParamSlider name="t" value={t} min={d.x[0]} max={d.x[1]} step={d.discrete ? 0.5 : 0.05} digits={2} onChange={setT} />
        {dists.length > 1 && (
          <div className="density-cdf__group" role="group" aria-label="Распределение">
            {dists.map((k) => (
              <button key={k} type="button" className="btn btn--sm" aria-pressed={id === k} onClick={() => choose(k)}>
                {DISTS[k].name}
              </button>
            ))}
          </div>
        )}
        <Readout name="F(t)" value={F} digits={3} hint="P(X ≤ t)" />
        <Readout name={d.discrete ? "P(X = t)" : "p(t)"} value={local} digits={3} hint={d.discrete ? "вероятность значения" : "плотность — не вероятность"} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
