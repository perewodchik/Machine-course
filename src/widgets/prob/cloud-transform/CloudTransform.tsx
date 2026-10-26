// Виджет «Линейное преобразование облака» (урок III.10): облако X ~ N(0, I) и его образ Y = AX + b. Бегунки —
// элементы A и сдвиг b, кнопки — заготовки матриц. Эллипсы уровня 2σ: пунктир — у X, сплошной — AAᵀ у Y.
// Показания — AAᵀ по формуле против выборки и det A. Логика — model.ts.
import { useState } from "react";
import { Ellipse, ParamSlider, Plane, Point, Readout, fmt, useLiveText } from "../../_kit";
import { apply, baseCloud, covLinear, det, PRESETS, sampleCov, type Mat2 } from "./model";

export interface CloudTransformProps {
  initial?: { A?: [[number, number], [number, number]]; b?: [number, number] };
}

const X = baseCloud();
const I: Mat2 = [
  [1, 0],
  [0, 1],
];

export default function CloudTransform({ initial = {} }: CloudTransformProps) {
  const [a, setA] = useState<[number, number, number, number]>(initial.A ? [initial.A[0][0], initial.A[0][1], initial.A[1][0], initial.A[1][1]] : [1.5, 0.5, 0, 0.8]);
  const [b, setB] = useState<[number, number]>(initial.b ?? [0, 0]);
  const A: Mat2 = [
    [a[0], a[1]],
    [a[2], a[3]],
  ];
  const Y = X.map((p) => apply(A, b, p));
  const C = covLinear(A, I);
  const S = sampleCov(Y);
  const d = det(A);
  const set = (i: number) => (v: number) => setA(a.map((x, j) => (j === i ? v : x)) as [number, number, number, number]);
  const live = useLiveText(`A = [[${a.map((v) => fmt(v, 1)).join(", ")}]]: Cov Y = AAᵀ = [[${fmt(C[0][0], 2)}, ${fmt(C[0][1], 2)}], [${fmt(C[1][0], 2)}, ${fmt(C[1][1], 2)}]], det A = ${fmt(d, 2)}.`);

  return (
    <div className="cloud-transform">
      <Plane x={[-5, 5]} y={[-5, 5]} xStep={1} yStep={1} equal xLabel="y₁" yLabel="y₂" height={{ ratio: 0.6, min: 260, max: 400 }} label={`Облако Y = AX + b из ${X.length} точек; ковариация AAᵀ, det A = ${fmt(d, 2)}`}>
        {Y.map(([x, y], i) => (
          <Point key={i} x={x} y={y} role="data" r={2.5} />
        ))}
        <Ellipse center={[0, 0]} cov={I} k={2} role="aux" />
        {Math.abs(d) > 1e-9 && <Ellipse center={b} cov={C} k={2} role="target" />}
      </Plane>
      <div className="cloud-transform__controls">
        <div className="cloud-transform__group" role="group" aria-label="Заготовки матрицы A">
          {Object.entries(PRESETS).map(([name, M]) => (
            <button key={name} type="button" className="btn btn--sm" onClick={() => setA([M[0][0], M[0][1], M[1][0], M[1][1]])}>
              {name}
            </button>
          ))}
        </div>
        <div className="cloud-transform__matrix" role="group" aria-label="Элементы матрицы A">
          <ParamSlider name="a_{11}" value={a[0]} min={-2} max={2} step={0.1} digits={1} role="param" onChange={set(0)} />
          <ParamSlider name="a_{12}" value={a[1]} min={-2} max={2} step={0.1} digits={1} role="param" onChange={set(1)} />
          <ParamSlider name="a_{21}" value={a[2]} min={-2} max={2} step={0.1} digits={1} role="param" onChange={set(2)} />
          <ParamSlider name="a_{22}" value={a[3]} min={-2} max={2} step={0.1} digits={1} role="param" onChange={set(3)} />
          <ParamSlider name="b_1" value={b[0]} min={-2} max={2} step={0.5} digits={1} onChange={(v) => setB([v, b[1]])} />
          <ParamSlider name="b_2" value={b[1]} min={-2} max={2} step={0.5} digits={1} onChange={(v) => setB([b[0], v])} />
        </div>
        <div className="cloud-transform__readouts">
          <Readout name="Σ_{11}" value={C[0][0]} digits={2} hint={`выборка ${fmt(S[0][0], 2)}`} />
          <Readout name="Σ_{12}" value={C[0][1]} digits={2} hint={`выборка ${fmt(S[0][1], 2)}`} />
          <Readout name="Σ_{22}" value={C[1][1]} digits={2} hint={`выборка ${fmt(S[1][1], 2)}`} />
          <Readout name="det A" value={d} digits={2} hint="во сколько раз растут площади" />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
