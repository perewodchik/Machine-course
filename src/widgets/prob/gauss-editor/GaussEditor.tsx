// Виджет «Редактор μ и Σ» (урок III.11): линии уровня N(μ, Σ) — эллипсы расстояния Махаланобиса 1, 2, 3 —
// и их оси: собственные векторы Σ длины √λ. Бегунки — μ₁, μ₂, σ₁, σ₂, ρ. Точка P показывает, что «далеко»
// измеряют в σ, а не в единицах осей. Модель — src/lib/math/gauss2.ts.
import { useState } from "react";
import { Ellipse, ParamSlider, Plane, Point, Readout, Vector, fmt, useLiveText } from "../../_kit";
import { det2, eig2, mahalanobis2, sigmaOf, type Vec2 } from "../../../lib/math/gauss2";

export interface GaussEditorProps {
  initial?: { mu?: [number, number]; s1?: number; s2?: number; rho?: number };
}

export const PROBE: Vec2 = [-2, 2];

export default function GaussEditor({ initial = {} }: GaussEditorProps) {
  const [m1, setM1] = useState(initial.mu?.[0] ?? 0);
  const [m2, setM2] = useState(initial.mu?.[1] ?? 0);
  const [s1, setS1] = useState(initial.s1 ?? 1.5);
  const [s2, setS2] = useState(initial.s2 ?? 1);
  const [rho, setRho] = useState(initial.rho ?? 0.6);
  const mu: Vec2 = [m1, m2];
  const S = sigmaOf(s1, s2, rho);
  const { l1, l2, u } = eig2(S);
  const v: Vec2 = [-u[1], u[0]];
  const cov = [
    [S[0], S[1]],
    [S[1], S[2]],
  ] as const;
  const dM = Math.sqrt(mahalanobis2(PROBE, mu, S));
  const dE = Math.hypot(PROBE[0] - m1, PROBE[1] - m2);
  const live = useLiveText(`Σ = [[${fmt(S[0], 2)}, ${fmt(S[1], 2)}], [${fmt(S[1], 2)}, ${fmt(S[2], 2)}]], λ₁ = ${fmt(l1, 2)}, λ₂ = ${fmt(l2, 2)}; точка P: расстояние Махаланобиса ${fmt(dM, 2)}, обычное ${fmt(dE, 2)}.`);

  return (
    <div className="gauss-editor">
      <Plane x={[-5, 5]} y={[-5, 5]} xStep={1} yStep={1} equal xLabel="x₁" yLabel="x₂" height={{ ratio: 0.6, min: 260, max: 400 }} label={`Линии уровня N(μ, Σ): эллипсы с осями вдоль собственных векторов Σ, полуоси √λ₁ = ${fmt(Math.sqrt(l1), 2)} и √λ₂ = ${fmt(Math.sqrt(l2), 2)}`}>
        {[3, 2].map((k) => (
          <Ellipse key={k} center={mu} cov={cov} k={k} role="aux" />
        ))}
        <Ellipse center={mu} cov={cov} k={1} role="target" />
        <Vector from={mu} to={[m1 + Math.sqrt(l1) * u[0], m2 + Math.sqrt(l1) * u[1]]} role="param" label="√λ₁ u₁" />
        <Vector from={mu} to={[m1 + Math.sqrt(l2) * v[0], m2 + Math.sqrt(l2) * v[1]]} role="param" label="√λ₂ u₂" />
        <Point x={m1} y={m2} role="target" label="μ" />
        <Point x={PROBE[0]} y={PROBE[1]} role="data" label="P" />
      </Plane>
      <div className="gauss-editor__controls">
        <ParamSlider name="μ_1" value={m1} min={-2} max={2} step={0.25} digits={2} role="target" onChange={setM1} />
        <ParamSlider name="μ_2" value={m2} min={-2} max={2} step={0.25} digits={2} role="target" onChange={setM2} />
        <ParamSlider name="σ_1" value={s1} min={0.3} max={2.5} step={0.1} digits={1} onChange={setS1} />
        <ParamSlider name="σ_2" value={s2} min={0.3} max={2.5} step={0.1} digits={1} onChange={setS2} />
        <ParamSlider name="ρ" value={rho} min={-0.95} max={0.95} step={0.05} digits={2} onChange={setRho} />
        <div className="gauss-editor__readouts">
          <Readout name="λ_1" value={l1} digits={2} hint="дисперсия вдоль длинной оси" />
          <Readout name="λ_2" value={l2} digits={2} hint="вдоль короткой" />
          <Readout name="det Σ" value={det2(S)} digits={2} hint="λ₁λ₂: площадь эллипса ∝ √det" />
          <Readout name="d_M(P)" value={dM} digits={2} hint={`Махаланобис; обычное — ${fmt(dE, 2)}`} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
