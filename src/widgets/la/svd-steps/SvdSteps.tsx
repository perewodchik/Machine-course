// Виджет «Окружность → эллипс по шагам» (урок I.11): A = U S Vᵀ применяется к единичной окружности по одному
// множителю справа налево. Кнопки шагов: x, Vᵀx, S Vᵀx, U S Vᵀx = Ax; матрица — бегунками или заготовками.
// Цвета как у e₁, e₂ и Av в модуле I: образы v₁ и v₂ — бирюза и оранжевый, образ окружности — пурпур,
// исходная окружность — карандашом. Логика — model.ts.
import { useState } from "react";
import { ParamSlider, Plane, Polyline, Readout, Vector, fmt, useLiveText } from "../../_kit";
import { circleImage, LABELS, partial, PRESETS, reflects, STEPS, svd2, type M2, type Step } from "./model";

export interface SvdStepsProps {
  initial?: "shear" | "flip" | "singular";
  step?: Step;
}

function fact(step: Step, s: readonly [number, number], flip: boolean): string {
  const [s1, s2] = [fmt(s[0], 2), fmt(s[1], 2)];
  if (step === 0) return "Единичная окружность и правые сингулярные векторы v₁, v₂ — перпендикулярные направления, которые A переведёт в оси эллипса.";
  if (step === 1) return "Vᵀ поворачивает плоскость: v₁ и v₂ ложатся на оси координат. Окружность осталась окружностью.";
  if (step === 2) return s[1] < 1e-9 ? `S растягивает первую ось в σ₁ = ${s1} раза, а вторую сжимает в ноль: эллипс выродился в отрезок.` : `S растягивает оси: первую в σ₁ = ${s1} раза, вторую в σ₂ = ${s2} раза. Окружность стала эллипсом.`;
  if (s[1] < 1e-9) return `U ${flip ? "отражает" : "поворачивает"} отрезок: он лежит вдоль u₁, его половина — σ₁u₁. Это образ окружности под A: вырожденная матрица сплющивает плоскость в прямую.`;
  return `U ${flip ? "отражает" : "поворачивает"} эллипс${flip ? " (det U = −1)" : ""}: его полуоси — σ₁u₁ и σ₂u₂. Это образ окружности под A.`;
}

export default function SvdSteps({ initial = "shear", step: step0 = 0 }: SvdStepsProps) {
  const [A, setA] = useState<M2>(PRESETS.find((p) => p.id === initial)?.A ?? PRESETS[0]!.A);
  const [step, setStep] = useState<Step>(step0);
  const svd = svd2(A);
  const flip = reflects(svd);
  const set = (i: 0 | 1, j: 0 | 1) => (x: number) => setA(A.map((row, r) => row.map((v, c) => (r === i && c === j ? x : v))) as unknown as M2);
  const text = fact(step, svd.s, flip);
  const live = useLiveText(`Шаг ${STEPS[step].name}. ${text}`);
  const [l1, l2] = LABELS[step];
  return (
    <div className="svd-steps">
      <Plane x={[-3, 3]} y={[-3, 3]} xStep={1} yStep={1} equal height={{ ratio: 1, min: 240, max: 440 }} xLabel="x_1" yLabel="x_2" label={`Образ единичной окружности после шага ${STEPS[step].name}. ${text}`}>
        <Polyline points={circleImage(svd, 0)} role="aux" dashed />
        <Polyline points={circleImage(svd, step)} role="target" />
        <Vector to={partial(svd, step, svd.v[0])} role="data" label={l1} />
        <Vector to={partial(svd, step, svd.v[1])} role="param" label={l2} />
      </Plane>
      <div className="svd-steps__controls">
        <div className="svd-steps__group" role="group" aria-label="Шаг разложения">
          {STEPS.map((s) => (
            <button key={s.id} type="button" className="btn btn--sm" aria-pressed={step === s.id} onClick={() => setStep(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="svd-steps__group" role="group" aria-label="Заготовки матрицы">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" className="btn btn--sm" aria-pressed={p.A.flat().every((v, k) => v === A.flat()[k])} onClick={() => setA(p.A)}>
              {p.name}
            </button>
          ))}
        </div>
        <ParamSlider name="a_{11}" value={A[0][0]} min={-2} max={2} step={0.1} digits={1} onChange={set(0, 0)} />
        <ParamSlider name="a_{12}" value={A[0][1]} min={-2} max={2} step={0.1} digits={1} onChange={set(0, 1)} />
        <ParamSlider name="a_{21}" value={A[1][0]} min={-2} max={2} step={0.1} digits={1} onChange={set(1, 0)} />
        <ParamSlider name="a_{22}" value={A[1][1]} min={-2} max={2} step={0.1} digits={1} onChange={set(1, 1)} />
        <div className="svd-steps__readouts">
          <Readout name="σ_1" value={svd.s[0]} />
          <Readout name="σ_2" value={svd.s[1]} />
        </div>
        <p className="svd-steps__fact">{text}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
