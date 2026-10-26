// Виджет «KL между двумя распределениями» (урок III.13): столбики p (данные) и q (модель) на четырёх исходах,
// бегунки весов каждого. Показания — H(p), H(p, q), KL(p ‖ q) и KL(q ‖ p) в натах. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Readout, fmt, useLiveText } from "../../_kit";
import { crossEntropy, entropy, kl, OUTCOMES, probs } from "./model";

export interface KlExplorerProps {
  initial?: { p?: number[]; q?: number[] };
}

export default function KlExplorer({ initial = {} }: KlExplorerProps) {
  const [wp, setWp] = useState<number[]>(initial.p ?? [4, 3, 2, 1]);
  const [wq, setWq] = useState<number[]>(initial.q ?? [1, 1, 1, 1]);
  const p = probs(wp);
  const q = probs(wq);
  const setAt = (arr: number[], set: (v: number[]) => void, i: number) => (v: number) => set(arr.map((x, j) => (j === i ? Math.round(v) : x)));
  const live = useLiveText(`p = (${p.map((v) => fmt(v, 2)).join(", ")}), q = (${q.map((v) => fmt(v, 2)).join(", ")}): H(p) = ${fmt(entropy(p), 3)}, H(p, q) = ${fmt(crossEntropy(p, q), 3)}, KL(p ‖ q) = ${fmt(kl(p, q), 3)}, KL(q ‖ p) = ${fmt(kl(q, p), 3)}.`);

  return (
    <div className="kl-explorer">
      <Plane x={[-0.6, 3.6]} y={[0, 1]} xStep={1} yStep={0.25} xLabel="x" yLabel="вероятность" height={{ ratio: 0.42, min: 170, max: 260 }} label={`Распределения p и q на четырёх исходах; KL(p ‖ q) = ${fmt(kl(p, q), 3)}, KL(q ‖ p) = ${fmt(kl(q, p), 3)}`}>
        {OUTCOMES.flatMap((_, i) => [
          <Line key={`p${i}`} from={[i - 0.12, 0]} to={[i - 0.12, p[i]!]} role="data" />,
          <Point key={`pp${i}`} x={i - 0.12} y={p[i]!} role="data" label={i === 0 ? "p" : undefined} />,
          <Line key={`q${i}`} from={[i + 0.12, 0]} to={[i + 0.12, q[i]!]} role="param" />,
          <Point key={`qq${i}`} x={i + 0.12} y={q[i]!} role="param" label={i === 0 ? "q" : undefined} />,
        ])}
      </Plane>
      <div className="kl-explorer__controls">
        <div className="kl-explorer__group" role="group" aria-label="Веса распределения p">
          {OUTCOMES.map((o, i) => (
            <ParamSlider key={o} name={`p_${o}`} value={wp[i]!} min={0} max={5} step={1} digits={0} role="data" onChange={setAt(wp, setWp, i)} />
          ))}
        </div>
        <div className="kl-explorer__group" role="group" aria-label="Веса распределения q">
          {OUTCOMES.map((o, i) => (
            <ParamSlider key={o} name={`q_${o}`} value={wq[i]!} min={0} max={5} step={1} digits={0} role="param" onChange={setAt(wq, setWq, i)} />
          ))}
        </div>
        <div className="kl-explorer__readouts">
          <Readout name="H(p)" value={entropy(p)} digits={3} hint="энтропия, наты" />
          <Readout name="H(p, q)" value={crossEntropy(p, q)} digits={3} hint="кросс-энтропия" />
          <Readout name="KL(p ‖ q)" value={kl(p, q)} digits={3} hint="H(p, q) − H(p)" />
          <Readout name="KL(q ‖ p)" value={kl(q, p)} digits={3} hint="в обратную сторону" />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
