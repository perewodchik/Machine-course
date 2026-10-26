// Виджет «Гистограмма суммы» (урок III.8): 4000 повторов суммы n независимых величин из базового распределения,
// гистограмма-плотность стандартизованной суммы Z = (S_n − nμ)/(σ√n) и плотность N(0, 1) поверх. Бегунок — n.
// Показания — доля Z в [−1, 1] против 0.683 у нормального. Логика — model.ts.
import { useState } from "react";
import { ParamSlider, Plane, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { BASES, histogram, insideOne, phi, standardizedSums, type BaseId } from "./model";

export interface SumHistogramProps {
  initial?: { base?: BaseId; n?: number };
}

const REPS = 4000;
const WIDTH = 0.25;
const curve = Array.from({ length: 161 }, (_, i) => {
  const z = -4 + i / 20;
  return [z, phi(z)] as [number, number];
});

export default function SumHistogram({ initial = {} }: SumHistogramProps) {
  const [base, setBase] = useState<BaseId>(initial.base ?? "exponential");
  const [n, setN] = useState(initial.n ?? 1);
  const z = standardizedSums(base, n, REPS, 2026);
  const bins = histogram(z, -4, 4, WIDTH);
  const steps = bins.flatMap((b) => [[b.lo, b.density], [b.hi, b.density]] as [number, number][]);
  const outline: [number, number][] = [[-4, 0], ...steps, [4, 0]];
  const top = Math.max(...bins.map((b) => b.density));
  const yMax = top > 0.6 ? Math.ceil(top * 5) / 5 + 0.1 : 0.6;
  const inside = insideOne(z);
  const live = useLiveText(`${BASES[base].name}, n = ${n}: доля стандартизованной суммы в [−1, 1] — ${fmt(inside, 3)}, у нормального 0.683.`);

  return (
    <div className="sum-histogram">
      <Plane x={[-4, 4]} y={[0, yMax]} xStep={1} yStep={yMax > 1.2 ? 0.5 : 0.2} xLabel="z" yLabel="плотность" height={{ ratio: 0.5, min: 200, max: 320 }} label={`Гистограмма стандартизованной суммы ${n} величин (${BASES[base].name}) и плотность N(0, 1)`}>
        <Polyline points={outline} role="data" />
        <Polyline points={curve} role="target" />
      </Plane>
      <div className="sum-histogram__controls">
        <div className="sum-histogram__group" role="group" aria-label="Распределение слагаемых">
          {(Object.keys(BASES) as BaseId[]).map((b) => (
            <button key={b} type="button" className="btn btn--sm" aria-pressed={base === b} onClick={() => setBase(b)}>
              {BASES[b].name}
            </button>
          ))}
        </div>
        <ParamSlider name="n" value={n} min={1} max={50} step={1} digits={0} onChange={(v) => setN(Math.round(v))} />
        <Readout name="P(|Z| ≤ 1)" value={inside} digits={3} hint={"доля повторов; у N(0, 1) — 0.683"} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
