// Виджет «Ax = b: нет решений, одно, бесконечно много» (урок I.6): первое уравнение закреплено, второе меняют
// бегунки a₂₁, a₂₂, b₂ или заготовки. Прямые — цветами уравнений, решение — точка цвета ответа; при совпадении
// прямых вторая — пунктиром поверх первой. Показания — ранги A и [A | b]. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Readout, fmt, useLiveText } from "../../_kit";
import { analyze, FIRST, KIND_TEXT, lineEnds, PRESETS, type Row } from "./model";

export interface SystemLinesProps {
  initial?: "one" | "none" | "many";
}

const num = (v: number) => fmt(v, Number.isInteger(v) ? 0 : 1);
/** Уравнение строкой: «x₁ + 2x₂ = 2», «2x₁ − x₂ = −1». */
function equation([a1, a2, b]: Row): string {
  const term = (c: number, name: string, first: boolean) => {
    if (c === 0) return "";
    const sign = c < 0 ? (first ? "−" : " − ") : first ? "" : " + ";
    const k = Math.abs(c) === 1 ? "" : num(Math.abs(c));
    return `${sign}${k}${name}`;
  };
  const left = term(a1, "x₁", true) + term(a2, "x₂", a1 === 0);
  return `${left || "0"} = ${num(b)}`;
}

/** То же уравнение разметкой: x — курсивом с индексом, числа — прямо (как в формулах урока). */
function Eq({ row: [a1, a2, b] }: { row: Row }) {
  const term = (c: number, k: 1 | 2, first: boolean) =>
    c === 0 ? null : (
      <>
        {c < 0 ? (first ? "−" : " − ") : first ? "" : " + "}
        {Math.abs(c) === 1 ? "" : num(Math.abs(c))}
        <i>x</i>
        <sub>{k}</sub>
      </>
    );
  return (
    <>
      {term(a1, 1, true)}
      {term(a2, 2, a1 === 0)}
      {a1 === 0 && a2 === 0 && "0"} = {num(b)}
    </>
  );
}

export default function SystemLines({ initial = "one" }: SystemLinesProps) {
  const [row, setRow] = useState<Row>(PRESETS.find((p) => p.id === initial)?.row ?? PRESETS[0]!.row);
  const a = analyze(FIRST, row);
  const l1 = lineEnds(FIRST);
  const l2 = lineEnds(row);
  const set = (i: 0 | 1 | 2) => (v: number) => setRow(row.map((x, k) => (k === i ? v : x)) as unknown as Row);
  const sol = a.x ? ` Решение: x = (${num(Math.round(a.x[0] * 100) / 100)}, ${num(Math.round(a.x[1] * 100) / 100)}).` : "";
  const live = useLiveText(`Второе уравнение: ${equation(row)}. Ранг A — ${a.rankA}, ранг [A | b] — ${a.rankAb}: ${KIND_TEXT[a.kind]}.${sol}`);
  return (
    <div className="system-lines">
      <Plane x={[-5, 5]} y={[-5, 5]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 460 }} xLabel="x_1" yLabel="x_2" label={`Прямые ${equation(FIRST)} и ${equation(row)}: ${KIND_TEXT[a.kind]}.`}>
        {l1 && <Line from={l1[0]} to={l1[1]} role="data" />}
        {l2 && <Line from={l2[0]} to={l2[1]} role="param" dashed={a.kind === "many"} />}
        {a.x && <Point x={a.x[0]} y={a.x[1]} role="target" label="x" r={6} />}
      </Plane>
      <div className="system-lines__controls">
        <p className="system-lines__eqs">
          <span className="system-lines__eq system-lines__eq--1">
            <Eq row={FIRST} />
          </span>
          <span className="system-lines__eq system-lines__eq--2">
            <Eq row={row} />
          </span>
        </p>
        <div className="system-lines__group" role="group" aria-label="Заготовки второго уравнения">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="btn btn--sm" aria-pressed={p.row.every((v, k) => v === row[k])} onClick={() => setRow(p.row)}>
              {p.name}
            </button>
          ))}
        </div>
        <ParamSlider name="a_{21}" value={row[0]} min={-4} max={4} step={0.5} digits={1} onChange={set(0)} />
        <ParamSlider name="a_{22}" value={row[1]} min={-4} max={4} step={0.5} digits={1} onChange={set(1)} />
        <ParamSlider name="b_2" value={row[2]} min={-4} max={4} step={0.5} digits={1} onChange={set(2)} />
        <div className="system-lines__readouts">
          <Readout name="rank A" value={a.rankA} digits={0} />
          <Readout name="rank [A | b]" value={a.rankAb} digits={0} />
        </div>
        <p className="system-lines__fact">
          {KIND_TEXT[a.kind]}
          {sol && "."}
          {sol}
        </p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
