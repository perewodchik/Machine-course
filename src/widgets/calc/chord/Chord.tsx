// Виджет «Хорда над графиком» (урок II.5): концы хорды a, b и параметр t — у ученика. Показания — значение хорды
// и графика в точке t·a + (1 − t)·b, их зазор и f'' там же; вывод — проходит ли хорда где-то под графиком.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { chord, curve, FN_IDS, FNS, gap, minGap, mix, type FnId } from "./model";

export interface ChordProps {
  initial?: { fn?: FnId; t?: number };
  /** Какие функции можно выбрать; одна — кнопок выбора нет. */
  fns?: FnId[];
}

export default function Chord({ initial = {}, fns = FN_IDS }: ChordProps) {
  const [fnId, setFnId] = useState<FnId>(initial.fn ?? fns[0] ?? "square");
  const fn = FNS[fnId];
  const [[a, b], setEnds] = useState<readonly [number, number]>(fn.init);
  const [t, setT] = useState(initial.t ?? 0.5);
  const setFn = (id: FnId) => {
    setFnId(id);
    setEnds(FNS[id].init);
  };

  const xt = mix(a, b, t);
  const ct = chord(fn, a, b, t);
  const ft = fn.f(xt);
  const g = gap(fn, a, b, t);
  const worst = minGap(fn, a, b);
  const below = worst.gap < -1e-9;
  const fact = below
    ? `Хорда проходит под графиком около x = ${fmt(mix(a, b, worst.t), 2)}: функция не выпукла.`
    : a === b
      ? "Концы хорды совпали — сдвиньте a или b."
      : "Хорда целиком не ниже графика.";
  const live = useLiveText(`${fn.name}, хорда от ${fmt(a, 1)} до ${fmt(b, 1)}, t = ${fmt(t, 2)}: хорда ${fmt(ct, 2)}, график ${fmt(ft, 2)}. ${fact}`);
  const pts = curve(fn);

  return (
    <div className="chord">
      <Plane x={fn.x} y={fn.y} xStep={fn.x[1] - fn.x[0] > 5 ? 2 : 1} yStep={1} label={`График ${fn.name} и хорда между точками x = ${fmt(a, 1)} и x = ${fmt(b, 1)}`}>
        <Polyline points={pts} role="data" />
        <Line from={[a, fn.f(a)]} to={[b, fn.f(b)]} role="param" />
        <Line from={[xt, ft]} to={[xt, ct]} role="aux" />
        <Point x={a} y={fn.f(a)} role="param" label="a" />
        <Point x={b} y={fn.f(b)} role="param" label="b" />
        <Point x={xt} y={ct} role="param" />
        <Point x={xt} y={ft} role="data" />
      </Plane>
      <div className="chord__controls">
        <ParamSlider name="a" value={a} min={fn.x[0]} max={fn.x[1]} step={0.1} digits={1} onChange={(v) => setEnds([v, b])} />
        <ParamSlider name="b" value={b} min={fn.x[0]} max={fn.x[1]} step={0.1} digits={1} onChange={(v) => setEnds([a, v])} />
        <ParamSlider name="t" value={t} min={0} max={1} step={0.05} digits={2} onChange={setT} />
        {fns.length > 1 && (
          <div className="chord__group" role="group" aria-label="Функция">
            {fns.map((id) => (
              <button key={id} type="button" className="btn btn--sm" aria-pressed={fnId === id} onClick={() => setFn(id)}>
                {FNS[id].name}
              </button>
            ))}
          </div>
        )}
        <Readout name="Δ" value={g} digits={3} hint="хорда − график" />
        <Readout name="f''" value={fn.d2(xt)} digits={2} hint={`в точке ${fmt(xt, 2)}`} />
        <p className="chord__fact">{fact}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
