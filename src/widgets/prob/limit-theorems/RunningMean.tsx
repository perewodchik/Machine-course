// Виджет «Бегущее среднее» (урок III.8): три независимые выборки из базового распределения, бегущее среднее
// m_k каждой, горизонталь μ и коридор μ ± 2σ/√k. Бегунок — длина выборки n, кнопка — новые выборки.
// Показания — m_n первой выборки, её ошибка и ширина коридора. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { BASES, runningMeans, type BaseId } from "./model";

export interface RunningMeanProps {
  initial?: { base?: BaseId; n?: number };
}

const PATHS = 3;

export default function RunningMean({ initial = {} }: RunningMeanProps) {
  const [base, setBase] = useState<BaseId>(initial.base ?? "dice");
  const [n, setN] = useState(initial.n ?? 500);
  const [seed, setSeed] = useState(1);
  const { mean, variance } = BASES[base];
  const sigma = Math.sqrt(variance);
  const paths = Array.from({ length: PATHS }, (_, j) => runningMeans(base, n, seed * 10 + j));
  const step = Math.max(1, Math.floor(n / 400));
  const pts = (m: number[]) => m.filter((_, k) => k % step === 0 || k === n - 1).map((v, i, arr) => [i === arr.length - 1 ? n : i * step + 1, v] as [number, number]);
  const band = (sign: 1 | -1) => Array.from({ length: 201 }, (_, i) => {
    const k = 1 + ((n - 1) * i) / 200;
    return [k, mean + (sign * 2 * sigma) / Math.sqrt(k)] as [number, number];
  });
  const first = paths[0]![n - 1]!;
  const width = (2 * sigma) / Math.sqrt(n);
  const live = useLiveText(`${BASES[base].name}, n = ${n}: среднее первой выборки ${fmt(first, 3)}, μ = ${fmt(mean, 2)}, ошибка ${fmt(Math.abs(first - mean), 3)}, коридор ±${fmt(width, 3)}.`);

  return (
    <div className="running-mean">
      <Plane x={[0, n]} y={[mean - 1.1 * sigma, mean + 1.1 * sigma]} xStep={n > 1000 ? 500 : n > 400 ? 100 : n > 100 ? 50 : 10} yStep={sigma > 1 ? 0.5 : sigma > 0.4 ? 0.2 : 0.1} xLabel="k" yLabel="среднее" height={{ ratio: 0.5, min: 200, max: 320 }} label={`Бегущее среднее трёх выборок: ${BASES[base].name}, n = ${n}, коридор μ ± 2σ/√k`}>
        <Polyline points={band(1)} role="aux" dashed />
        <Polyline points={band(-1)} role="aux" dashed />
        <Line from={[0, mean]} to={[n, mean]} role="target" label="μ" />
        {paths.map((m, j) => (
          <Polyline key={j} points={pts(m)} role="data" />
        ))}
      </Plane>
      <div className="running-mean__controls">
        <div className="running-mean__group" role="group" aria-label="Распределение">
          {(Object.keys(BASES) as BaseId[]).map((b) => (
            <button key={b} type="button" className="btn btn--sm" aria-pressed={base === b} onClick={() => setBase(b)}>
              {BASES[b].name}
            </button>
          ))}
        </div>
        <ParamSlider name="n" value={n} min={20} max={2000} step={20} digits={0} onChange={(v) => setN(Math.round(v))} />
        <button type="button" className="btn btn--sm running-mean__again" onClick={() => setSeed(seed + 1)}>
          Новые выборки
        </button>
        <Readout name="m_n" value={first} digits={3} hint="среднее первой выборки" />
        <Readout name="|m_n − μ|" value={Math.abs(first - mean)} digits={3} hint="ошибка" />
        <Readout name="2σ/√n" value={width} digits={3} hint="полуширина коридора" />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
