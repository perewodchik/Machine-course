// Виджет «Касание линии уровня и ограничения» (урок II.8): бегунок двигает точку по ограничению h = 0
// (окружность или прямая); на рисунке — линии уровня f, линия через текущую точку и стрелки ∇f и ∇h.
// Показания — f, угол между градиентами и λ из ∇f = λ∇h. Логика — model.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, Vector, fmt, useLiveText } from "../../_kit";
import { levelCurves } from "../../../lib/math/conics";
import { angleBetween, CASE_IDS, CASES, gradF, lambda, touching, value, type CaseId, type Vec } from "./model";

export interface LagrangeProps {
  initial?: { case?: CaseId; p?: number };
  /** Какие заготовки можно выбрать; одна — кнопок выбора нет. */
  cases?: CaseId[];
}

const scaled = (from: Vec, v: Vec, len: number): Vec => {
  const n = Math.hypot(v[0], v[1]) || 1;
  return [from[0] + (len * v[0]) / n, from[1] + (len * v[1]) / n];
};

export default function Lagrange({ initial = {}, cases = CASE_IDS }: LagrangeProps) {
  const [id, setId] = useState<CaseId>(initial.case ?? cases[0] ?? "pca");
  const c = CASES[id];
  const [p, setP] = useState(initial.p ?? c.init);
  const choose = (next: CaseId) => {
    setId(next);
    setP(CASES[next].init);
  };
  const x = c.at(p);
  const gf = gradF(c, x);
  const gh = c.gradH(x);
  const ang = angleBetween(gf, gh);
  const lam = lambda(gf, gh);
  const f = value(c, x);
  const touch = touching(c, p);
  const pca = id === "pca";
  const fact = touch
    ? pca
      ? `Касание: ∇f ∥ ∇h, u — собственный вектор Σ, λ = uᵀΣu = ${fmt(f, 2)}.`
      : `Касание: ∇f ∥ ∇h — минимум f на прямой, λ = ${fmt(lam, 2)}.`
    : "Линия уровня пересекает ограничение: вдоль него f ещё можно изменить.";
  const live = useLiveText(`${c.name}: точка (${fmt(x[0], 2)}, ${fmt(x[1], 2)}), f = ${fmt(f, 3)}, угол между ∇f и ∇h ${fmt(ang, 0)}°. ${fact}`);
  const [a, b, d] = c.form;
  const box: readonly [number, number] = pca ? [-2, 2] : [-1, 2];
  const levels = pca ? [0.5, 1, 1.5, 2, 2.5, 3] : [0.1, 0.33, 0.6, 1, 1.5, 2.2];
  const circle: [number, number][] = Array.from({ length: 121 }, (_, i) => [Math.cos((i * Math.PI) / 60), Math.sin((i * Math.PI) / 60)]);

  return (
    <div className="lagrange">
      <Plane x={box} y={box} xStep={1} yStep={1} equal xLabel="x₁" yLabel="x₂" height={{ ratio: 1, min: 240, max: 460 }} label={`Линии уровня ${c.name}, ограничение и стрелки градиентов в точке (${fmt(x[0], 2)}, ${fmt(x[1], 2)})`}>
        {levels.flatMap((k) => levelCurves(a, b, d, k / c.scale, 6, 96).map((pts, i) => <Polyline key={`${k}-${i}`} points={pts} role="data" />))}
        {levelCurves(a, b, d, f / c.scale, 6, 96).map((pts, i) => <Polyline key={`cur-${i}`} points={pts} role="param" dashed />)}
        {pca ? <Polyline points={circle} role="target" /> : <Line from={[-1, 2]} to={[2, -1]} role="target" />}
        <Vector from={x} to={scaled(x, gf, 0.6)} role="data" label="∇f" />
        <Vector from={x} to={scaled(x, gh, 0.45)} role="target" label="∇h" />
        <Point x={x[0]} y={x[1]} role="param" />
      </Plane>
      <div className="lagrange__controls">
        {pca ? (
          <ParamSlider name="φ" value={p} min={c.range[0]} max={c.range[1]} step={c.step} digits={0} onChange={setP} />
        ) : (
          <ParamSlider name="t" value={p} min={c.range[0]} max={c.range[1]} step={c.step} digits={2} onChange={setP} />
        )}
        {cases.length > 1 && (
          <div className="lagrange__group" role="group" aria-label="Задача">
            {cases.map((k) => (
              <button key={k} type="button" className="btn btn--sm" aria-pressed={id === k} onClick={() => choose(k)}>
                {CASES[k].name}
              </button>
            ))}
          </div>
        )}
        <Readout name="f" value={f} digits={3} />
        <Readout name="∠" value={ang} digits={0} hint="угол между ∇f и ∇h, градусы" />
        <Readout name="λ" value={lam} digits={3} hint="из ∇f = λ∇h" />
        <p className="lagrange__fact">{fact}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
