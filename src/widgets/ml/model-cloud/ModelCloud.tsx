// Виджет «Облако моделей» (урок 2.2 «Основ ML»): 100 полиномов на 100 выборках (тонкие линии), истина h* и средняя
// модель h̄; вертикаль — точка x₀. Справа — гистограмма ĥ_S(x₀) с h*(x₀) и h̄(x₀). Внизу — столбик σ² + смещение² +
// разброс (в среднем по x) и ожидаемая ошибка по степени 0–12. Ручки: степень, n, σ, x₀, новая выборка.
import { useMemo, useState } from "react";
import { Line, ParamSlider, Plane, Polyline, Readout, fmt, useLiveText, usePlane } from "../../_kit";
import { polyEval } from "../../../lib/math/poly";
import { atPoint, cloud, errorByDegree, GRID, hStar } from "./model";

const Y: [number, number] = [-2.5, 2.5];

function Hist({ values, lo, hi }: { values: number[]; lo: number; hi: number }) {
  const { layout } = usePlane();
  const bins = 20;
  const w = (hi - lo) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const v of values) if (v >= lo && v < hi) counts[Math.floor((v - lo) / w)]!++;
  return (
    <g aria-hidden="true">
      {counts.map((c, k) => {
        const y0 = layout.sy(lo + k * w);
        const y1 = layout.sy(lo + (k + 1) * w);
        return <rect key={k} className="model-cloud__bar" x={layout.sx(0)} y={y1} width={layout.sx(c / values.length) - layout.sx(0)} height={y0 - y1} />;
      })}
    </g>
  );
}

function Stack({ parts }: { parts: { v: number; cls: string }[] }) {
  const { layout } = usePlane();
  let acc = 0;
  return (
    <g aria-hidden="true">
      {parts.map((p, i) => {
        const y0 = layout.sy(acc);
        acc += p.v;
        const y1 = layout.sy(acc);
        return <rect key={i} className={`model-cloud__stack ${p.cls}`} x={layout.sx(0.25)} y={y1} width={layout.sx(0.75) - layout.sx(0.25)} height={y0 - y1} />;
      })}
    </g>
  );
}

export default function ModelCloud() {
  const [k, setK] = useState(3);
  const [n, setN] = useState(30);
  const [sigma, setSigma] = useState(0.3);
  const [x0, setX0] = useState(0.6);
  const [seed, setSeed] = useState(1);
  const c = useMemo(() => cloud(k, n, sigma, seed), [k, n, sigma, seed]);
  const byDegree = useMemo(() => errorByDegree(n, sigma, seed), [n, sigma, seed]);
  const vals = atPoint(c, x0);
  const meanX0 = vals.reduce((a, b) => a + b, 0) / vals.length;
  const varX0 = vals.reduce((a, v) => a + (v - meanX0) ** 2, 0) / vals.length;
  const clamp = (v: number) => Math.max(Y[0] - 1, Math.min(Y[1] + 1, v));
  const total = sigma * sigma + c.bias2 + c.variance;
  const eTop = Math.min(2, Math.max(...byDegree.map((r) => r.total)) * 1.05);
  const live = useLiveText(`Степень ${k}, n = ${n}, σ = ${fmt(sigma)}: смещение² ${fmt(c.bias2, 4)}, разброс ${fmt(c.variance, 4)}, ожидаемая ошибка ${fmt(total, 3)}`);
  return (
    <div className="model-cloud">
      <div className="model-cloud__top">
        <Plane x={[-1, 1]} y={Y} xStep={0.5} yStep={1} xLabel="x" yLabel="y" height={{ ratio: 0.62, min: 240, max: 360 }} initialWidth={520} label={`Облако из 100 полиномов степени ${k}, обученных на выборках по ${n} точек, истина и средняя модель`}>
          {c.models.map((m, b) => <Polyline key={b} points={GRID.map((x) => [x, clamp(polyEval(m, x))] as [number, number])} role="aux" />)}
          <Polyline points={GRID.map((x) => [x, hStar(x)] as [number, number])} role="target" />
          <Polyline points={GRID.map((x, i) => [x, clamp(c.mean[i]!)] as [number, number])} role="param" />
          <Line from={[x0, Y[0]]} to={[x0, Y[1]]} role="data" />
        </Plane>
        <Plane x={[0, 0.4]} y={Y} xStep={0.2} yStep={1} xLabel="доля" yLabel="ĥ(x₀)" height={{ ratio: 1.4, min: 240, max: 360 }} initialWidth={160} label={`Значения 100 моделей в точке x₀ = ${fmt(x0)}: среднее ${fmt(meanX0)}, истина ${fmt(hStar(x0))}`}>
          <Hist values={vals} lo={Y[0]} hi={Y[1]} />
          <Line from={[0, hStar(x0)]} to={[0.4, hStar(x0)]} role="target" />
          <Line from={[0, meanX0]} to={[0.4, meanX0]} role="param" />
        </Plane>
      </div>
      <p className="model-cloud__legend">серые — 100 моделей, пурпурная — истина h*, оранжевая — средняя модель h̄, бирюзовая вертикаль — x₀; справа — распределение ĥ(x₀)</p>
      <div className="model-cloud__bottom">
        <Plane x={[0, 1]} y={[0, eTop]} xStep={1} yStep={eTop > 1 ? 0.5 : 0.1} xLabel="" yLabel="ошибка" height={{ ratio: 1.6, min: 200, max: 260 }} initialWidth={120} label={`Ожидаемая ошибка ${fmt(total, 3)}: шум ${fmt(sigma * sigma, 3)}, смещение² ${fmt(c.bias2, 4)}, разброс ${fmt(c.variance, 4)}`}>
          <Stack parts={[{ v: sigma * sigma, cls: "is-noise" }, { v: Math.min(c.bias2, eTop), cls: "is-bias" }, { v: Math.min(c.variance, eTop), cls: "is-var" }]} />
        </Plane>
        <Plane x={[0, 12]} y={[0, eTop]} xStep={2} yStep={eTop > 1 ? 0.5 : 0.1} xLabel="степень" yLabel="ошибка" height={{ ratio: 0.5, min: 200, max: 260 }} initialWidth={400} label={`Ожидаемая ошибка по степени при n = ${n}, σ = ${fmt(sigma)}: минимум при степени ${byDegree.reduce((a, b) => (b.total < a.total ? b : a)).k}`}>
          <Polyline points={byDegree.map((r) => [r.k, Math.min(eTop, r.total)] as [number, number])} role="target" />
          <Polyline points={byDegree.map((r) => [r.k, Math.min(eTop, r.bias2)] as [number, number])} role="param" dashed />
          <Polyline points={byDegree.map((r) => [r.k, Math.min(eTop, r.variance)] as [number, number])} role="data" dashed />
          <Line from={[0, sigma * sigma]} to={[12, sigma * sigma]} role="aux" />
          <Line from={[k, 0]} to={[k, eTop]} role="aux" />
        </Plane>
      </div>
      <p className="model-cloud__legend">столбик: снизу шум σ², смещение², разброс; справа — сплошная: ожидаемая ошибка, штрихи: смещение² (оранжевый) и разброс (бирюзовый), пунктир — σ²</p>
      <div className="model-cloud__controls">
        <ParamSlider name="степень" value={k} min={0} max={12} step={1} digits={0} role="param" onChange={setK} />
        <ParamSlider name="n" value={n} min={10} max={200} step={5} digits={0} role="aux" onChange={setN} />
        <ParamSlider name="σ" value={sigma} min={0.05} max={1} step={0.05} role="aux" onChange={setSigma} />
        <ParamSlider name="x₀" value={x0} min={-1} max={1} step={0.05} role="data" onChange={setX0} />
        <div className="model-cloud__actions">
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setSeed((s) => s + 1)}>
            Новые 100 выборок
          </button>
        </div>
        <div className="model-cloud__readouts">
          <Readout name="смещение²" value={c.bias2} digits={4} />
          <Readout name="разброс" value={c.variance} digits={4} />
          <Readout name="σ²" value={sigma * sigma} digits={4} />
          <Readout name="ожидаемая ошибка" value={total} digits={4} />
          <Readout name="разброс в x₀" value={varX0} digits={4} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
