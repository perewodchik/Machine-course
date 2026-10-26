// Виджет «Обозреватель непрерывных распределений» (урок III.7): семейство, бегунки параметров, плотность и функция
// распределения, вертикаль в E X; у нормального — границы μ ± σ и μ ± 2σ и доля внутри. Формулы —
// src/lib/math/continuous.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { cdf, contMoments, pdf, type ContId, type ContParams } from "../../../lib/math/continuous";

export interface ContExplorerProps {
  initial?: { family?: ContId } & ContParams;
  families?: ContId[];
}

export const CONT_NAMES: Record<ContId, string> = {
  uniform: "равномерное",
  exponential: "показательное",
  normal: "нормальное",
  laplace: "Лапласа",
  logistic: "логистическое",
  beta: "бета",
};

interface Knob {
  key: keyof ContParams;
  name: string;
  min: number;
  max: number;
  step: number;
}

const KNOBS: Record<ContId, Knob[]> = {
  uniform: [
    { key: "a", name: "a", min: -4, max: 0, step: 0.5 },
    { key: "b", name: "b", min: 0.5, max: 4, step: 0.5 },
  ],
  exponential: [{ key: "lambda", name: "λ", min: 0.25, max: 3, step: 0.25 }],
  normal: [
    { key: "mu", name: "μ", min: -2, max: 2, step: 0.1 },
    { key: "sigma", name: "σ", min: 0.3, max: 2, step: 0.1 },
  ],
  laplace: [
    { key: "mu", name: "μ", min: -2, max: 2, step: 0.1 },
    { key: "b", name: "b", min: 0.3, max: 2, step: 0.1 },
  ],
  logistic: [
    { key: "mu", name: "μ", min: -2, max: 2, step: 0.1 },
    { key: "s", name: "s", min: 0.3, max: 2, step: 0.1 },
  ],
  beta: [
    { key: "alpha", name: "α", min: 1, max: 8, step: 0.5 },
    { key: "beta", name: "β", min: 1, max: 8, step: 0.5 },
  ],
};

const DEFAULTS: ContParams = { a: -1, b: 1, lambda: 1, mu: 0.5, sigma: 1, s: 0.6, alpha: 2, beta: 5 };

export default function ContExplorer({ initial = {}, families = ["uniform", "exponential", "normal", "laplace", "logistic", "beta"] }: ContExplorerProps) {
  const { family: f0, ...p0 } = initial;
  const [family, setFamily] = useState<ContId>(f0 ?? families[0] ?? "normal");
  const [params, setParams] = useState<ContParams>({ ...DEFAULTS, ...p0 });
  // у равномерного b — правый конец, у Лапласа — масштаб: разные бегунки с одним ключом
  const p: ContParams = family === "laplace" ? { ...params, b: params.b && params.b > 0 ? Math.min(params.b, 2) : 1 } : params;
  const range: [number, number] = family === "beta" ? [0, 1] : family === "exponential" ? [-0.5, 6] : [-6, 6];
  const xs = Array.from({ length: 241 }, (_, i) => range[0] + ((range[1] - range[0]) * i) / 240);
  const dens = xs.map((x) => [x, pdf(family, p, x)] as [number, number]);
  const yMax = Math.max(0.5, Math.ceil(Math.max(...dens.map(([, y]) => y)) * 4) / 4 + 0.1);
  const { mean, variance } = contMoments(family, p);
  const normal = family === "normal";
  const [mu, sigma] = [p.mu ?? 0, p.sigma ?? 1];
  const within = normal ? cdf("normal", p, mu + sigma) - cdf("normal", p, mu - sigma) : 0;
  const live = useLiveText(`${CONT_NAMES[family]}: ${KNOBS[family].map((k) => `${k.name} = ${fmt(p[k.key] ?? 0, 2)}`).join(", ")}; E X = ${fmt(mean, 2)}, Var X = ${fmt(variance, 2)}.${normal ? ` Внутри μ ± σ — ${fmt(within * 100, 1)} %.` : ""}`);

  return (
    <div className="cont-explorer">
      <Plane x={range} y={[0, yMax]} xStep={family === "beta" ? 0.25 : 1} yStep={yMax > 2 ? 1 : yMax > 1 ? 0.5 : 0.25} xLabel="x" yLabel="p(x)" height={{ ratio: 0.42, min: 160, max: 260 }} label={`Плотность распределения ${CONT_NAMES[family]}, E X = ${fmt(mean, 2)}`}>
        <Polyline points={dens} role="data" />
        <Line from={[mean, 0]} to={[mean, yMax]} role="aux" label="E X" />
        {normal && [-2, -1, 1, 2].map((k) => <Line key={k} from={[mu + k * sigma, 0]} to={[mu + k * sigma, pdf("normal", p, mu + k * sigma)]} role="param" />)}
      </Plane>
      <Plane x={range} y={[0, 1.1]} xStep={family === "beta" ? 0.25 : 1} yStep={0.5} xLabel="x" yLabel="F(x)" height={{ ratio: 0.3, min: 120, max: 190 }} label={`Функция распределения: ${CONT_NAMES[family]}`}>
        <Polyline points={xs.map((x) => [x, cdf(family, p, x)] as [number, number])} role="data" />
      </Plane>
      <div className="cont-explorer__controls">
        <div className="cont-explorer__group" role="group" aria-label="Семейство">
          {families.map((id) => (
            <button key={id} type="button" className="btn btn--sm" aria-pressed={family === id} onClick={() => setFamily(id)}>
              {CONT_NAMES[id]}
            </button>
          ))}
        </div>
        {KNOBS[family].map((k) => (
          <ParamSlider key={`${family}-${k.key}`} name={k.name} value={Math.min(k.max, Math.max(k.min, p[k.key] ?? k.min))} min={k.min} max={k.max} step={k.step} digits={2} onChange={(v) => setParams({ ...params, [k.key]: v })} />
        ))}
        <Readout name="E X" value={mean} digits={2} />
        <Readout name="Var X" value={variance} digits={2} hint={normal ? "σ², а не σ" : undefined} />
        {normal && <Readout name="P(|X − μ| ≤ σ)" value={within} digits={3} hint="правило 68–95–99.7" />}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
