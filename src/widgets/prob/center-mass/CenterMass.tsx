// Виджет «Матожидание как центр масс» (урок III.5): сверху — рычаг со столбиками-грузами p(x) на значениях 0–4 и
// опорой в E X; снизу — парабола f(x) = x², точки (x, x²), f(E X) на параболе и E f(X) над ней. Бегунки весов.
// Показания — E X, Var X, f(E X), E f(X). Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polygon, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { expect, probs, VALUES, variance } from "./model";

export interface CenterMassProps {
  initial?: { w?: number[] };
}

const parabola: [number, number][] = Array.from({ length: 101 }, (_, i) => {
  const x = -0.5 + (5 * i) / 100;
  return [x, x * x];
});

export default function CenterMass({ initial = {} }: CenterMassProps) {
  const [w, setW] = useState<number[]>(initial.w ?? [1, 3, 2, 0, 1]);
  const p = probs(w);
  const m = expect(p);
  const v = variance(p);
  const ef = expect(p, (x) => x * x);
  const live = useLiveText(`Вероятности ${p.map((q) => fmt(q, 2)).join(", ")}: E X = ${fmt(m, 2)}, Var X = ${fmt(v, 2)}, f(E X) = ${fmt(m * m, 2)}, E f(X) = ${fmt(ef, 2)}.`);
  const set = (i: number, value: number) => setW(w.map((x, j) => (j === i ? value : x)));

  return (
    <div className="center-mass">
      <Plane x={[-0.5, 4.5]} y={[-0.15, 1]} xStep={1} yStep={0.25} xLabel="x" yLabel="p(x)" height={{ ratio: 0.42, min: 150, max: 240 }} label={`Рычаг: грузы p(x) на значениях 0–4, опора в E X = ${fmt(m, 2)}`}>
        {VALUES.flatMap((x, i) => [<Line key={`s${x}`} from={[x, 0]} to={[x, p[i]!]} role="data" />, <Point key={`p${x}`} x={x} y={p[i]!} role="data" />])}
        <Polygon
          points={[
            [m, 0],
            [m - 0.12, -0.13],
            [m + 0.12, -0.13],
          ]}
          tone="pen"
        />
        <Line from={[m, 0]} to={[m, 1]} role="aux" label="E X" />
      </Plane>
      <Plane x={[-0.5, 4.5]} y={[0, 17]} xStep={1} yStep={4} xLabel="x" yLabel="f(x) = x²" height={{ ratio: 0.42, min: 150, max: 240 }} label={`Парабола f(x) = x²: f(E X) = ${fmt(m * m, 2)} не больше E f(X) = ${fmt(ef, 2)}`}>
        <Polyline points={parabola} role="aux" />
        {VALUES.map((x, i) => (p[i]! > 0 ? <Point key={x} x={x} y={x * x} role="data" /> : null))}
        <Line from={[m, m * m]} to={[m, ef]} role="target" />
        <Point x={m} y={m * m} role="param" label="f(E X)" />
        <Point x={m} y={ef} role="target" label="E f(X)" />
      </Plane>
      <div className="center-mass__controls">
        <div className="center-mass__weights" role="group" aria-label="Веса значений 0–4">
          {VALUES.map((x, i) => (
            <ParamSlider key={x} name={`w_${x}`} value={w[i]!} min={0} max={5} step={1} digits={0} role="data" onChange={(val) => set(i, Math.round(val))} />
          ))}
        </div>
        <div className="center-mass__readouts">
          <Readout name="E X" value={m} digits={2} hint="точка равновесия" />
          <Readout name="Var X" value={v} digits={2} hint="E X² − (E X)²" />
          <Readout name="Δ" value={ef - m * m} digits={2} hint={"E f(X) − f(E X): разрыв Йенсена для x², равен Var\u00a0X"} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
