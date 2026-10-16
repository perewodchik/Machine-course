// Виджет «Оболочка двух векторов» (урок I.1): бегунки c₁ и c₂ двигают комбинацию c₁a + c₂b, «Показать оболочку»
// рисует узлы целых комбинаций — косую решётку на всей плоскости или точки на одной прямой. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Vector, fmt, useLiveText } from "../../_kit";
import { combo, lattice, PRESETS, SPAN_TEXT, spanKind } from "./model";

export interface SpanProps {
  /** Заготовка векторов при открытии: independent, parallel, zero. */
  initial?: string;
  /** Показать оболочку сразу. */
  showSpan?: boolean;
}

const R = 6;

export default function Span({ initial = "independent", showSpan = false }: SpanProps) {
  const [preset, setPreset] = useState(PRESETS.find((p) => p.id === initial) ?? PRESETS[0]!);
  const [c, setC] = useState<[number, number]>([1, 1]);
  const [show, setShow] = useState(showSpan);
  const { a, b } = preset;
  const first = combo(a, b, c[0], 0);
  const end = combo(a, b, c[0], c[1]);
  const kind = spanKind(a, b);
  const live = useLiveText(`c1 = ${fmt(c[0], 1)}, c2 = ${fmt(c[1], 1)}: c1·a + c2·b = (${fmt(end[0], 1)}, ${fmt(end[1], 1)}). Оболочка — ${SPAN_TEXT[kind]}.`);
  const dir = a[0] || a[1] ? a : b;
  return (
    <div className="span-widget">
      <Plane x={[-R, R]} y={[-R, R]} xStep={1} yStep={1} height={{ ratio: 1, min: 240, max: 520 }} equal label={`Векторы a = (${a.join(", ")}) и b = (${b.join(", ")}); их оболочка — ${SPAN_TEXT[kind]}.`}>
        {show && kind === "line" && <Line from={[-10 * dir[0], -10 * dir[1]]} to={[10 * dir[0], 10 * dir[1]]} role="aux" />}
        {show && lattice(a, b, R).map(([x, y]) => <Point key={`${x},${y}`} x={x} y={y} role="aux" r={2.5} />)}
        <Line from={[0, 0]} to={a} role="aux" label="a" labelAbove />
        {(b[0] || b[1]) && <Line from={[0, 0]} to={b} role="aux" label="b" labelAbove />}
        <Vector to={first} role="data" label="c_1 a" />
        <Vector from={first} to={end} role="param" label="c_2 b" />
      </Plane>
      <div className="span-widget__controls">
        <ParamSlider name="c_1" value={c[0]} min={-3} max={3} step={0.1} digits={1} role="data" onChange={(v) => setC([v, c[1]])} />
        <ParamSlider name="c_2" value={c[1]} min={-3} max={3} step={0.1} digits={1} role="param" onChange={(v) => setC([c[0], v])} />
        <div className="span-widget__group" role="group" aria-label="Векторы a и b">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="btn btn--sm" aria-pressed={preset.id === p.id} onClick={() => setPreset(p)}>
              {p.name}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--sm" aria-pressed={show} onClick={() => setShow(!show)}>
          {show ? "Скрыть оболочку" : "Показать оболочку"}
        </button>
        <p className="span-widget__fact">
          <i>c</i>
          <sub>1</sub>
          <i>a</i> + <i>c</i>
          <sub>2</sub>
          <i>b</i> = <b>({fmt(end[0], 1)}, {fmt(end[1], 1)})</b>
          {show && <span> · оболочка — {SPAN_TEXT[kind]}</span>}
        </p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
