// Виджет «Обозреватель распределений» (урок III.6): семейство (Бернулли, биномиальное, геометрическое, Пуассона),
// бегунки параметров, столбики функции вероятности и вертикаль в E X. Показания — E X и Var X по формулам.
// Формулы — src/lib/math/distributions.ts.
import { useState } from "react";
import { Line, ParamSlider, Plane, Point, Readout, fmt, useLiveText } from "../../_kit";
import { moments, pmf, support, type FamilyId } from "../../../lib/math/distributions";

export type ExplorerFamily = Exclude<FamilyId, "categorical">;

export interface DistExplorerProps {
  initial?: { family?: ExplorerFamily; phi?: number; n?: number; lambda?: number };
  families?: ExplorerFamily[];
}

export const FAMILY_NAMES: Record<ExplorerFamily, string> = {
  bernoulli: "Бернулли",
  binomial: "биномиальное",
  geometric: "геометрическое",
  poisson: "Пуассона",
};

const FORMULAS: Record<ExplorerFamily, [string, string]> = {
  bernoulli: ["φ", "φ(1 − φ)"],
  binomial: ["nφ", "nφ(1 − φ)"],
  geometric: ["1/φ", "(1 − φ)/φ²"],
  poisson: ["λ", "λ"],
};

export default function DistExplorer({ initial = {}, families = ["bernoulli", "binomial", "geometric", "poisson"] }: DistExplorerProps) {
  const [family, setFamily] = useState<ExplorerFamily>(initial.family ?? families[0] ?? "binomial");
  const [phi, setPhi] = useState(initial.phi ?? 0.3);
  const [n, setN] = useState(initial.n ?? 10);
  const [lambda, setLambda] = useState(initial.lambda ?? 3);
  const params = { phi, n, lambda };
  const ks = support(family, params, 30);
  const { mean, variance } = moments(family, params);
  const yMax = Math.max(0.2, Math.ceil(Math.max(...ks.map((k) => pmf(family, params, k))) * 10) / 10 + 0.05);
  const xMax = Math.max(4, ks[ks.length - 1]! + 1);
  const live = useLiveText(`${FAMILY_NAMES[family]}: ${family === "poisson" ? `λ = ${fmt(lambda, 1)}` : `φ = ${fmt(phi, 2)}`}${family === "binomial" ? `, n = ${n}` : ""}; E X = ${fmt(mean, 2)}, Var X = ${fmt(variance, 2)}.`);

  return (
    <div className="dist-explorer">
      <Plane x={[-0.5, xMax]} y={[0, yMax]} xStep={xMax > 16 ? 5 : xMax > 8 ? 2 : 1} yStep={yMax > 0.5 ? 0.2 : 0.1} xLabel="k" yLabel="P(X = k)" height={{ ratio: 0.5, min: 180, max: 300 }} label={`Функция вероятности: распределение ${FAMILY_NAMES[family]}, E X = ${fmt(mean, 2)}`}>
        {ks.flatMap((k) => [<Line key={`s${k}`} from={[k, 0]} to={[k, pmf(family, params, k)]} role="data" />, <Point key={`p${k}`} x={k} y={pmf(family, params, k)} role="data" />])}
        <Line from={[mean, 0]} to={[mean, yMax]} role="aux" label="E X" />
      </Plane>
      <div className="dist-explorer__controls">
        <div className="dist-explorer__group" role="group" aria-label="Семейство">
          {families.map((f) => (
            <button key={f} type="button" className="btn btn--sm" aria-pressed={family === f} onClick={() => setFamily(f)}>
              {FAMILY_NAMES[f]}
            </button>
          ))}
        </div>
        {family === "poisson" ? <ParamSlider name="λ" value={lambda} min={0.5} max={10} step={0.5} digits={1} onChange={setLambda} /> : <ParamSlider name="φ" value={phi} min={0.05} max={0.95} step={0.05} digits={2} onChange={setPhi} />}
        {family === "binomial" && <ParamSlider name="n" value={n} min={1} max={20} step={1} digits={0} onChange={(v) => setN(Math.round(v))} />}
        <Readout name="E X" value={mean} digits={2} hint={FORMULAS[family][0]} />
        <Readout name="Var X" value={variance} digits={2} hint={FORMULAS[family][1]} />
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
