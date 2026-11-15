// Виджет «Кривые обучения» (урок 2.5 «Основ ML»): MSE на обучении и на свежих точках от размера выборки n
// (логарифмическая шкала) с полосами 10–90 % по 20 повторам, линия σ² и цель. Сначала диагноз кнопкой — смещение,
// разброс или всё в порядке, — потом лечение: удвоить n, поднять степень, увеличить λ.
import { useMemo, useState } from "react";
import { Line, ParamSlider, Plane, Polyline, Readout, fmt, useLiveText, usePlane } from "../../_kit";
import { curves, diagnose, SIGMA, TARGET, type Diagnosis } from "./model";

const NAMES: Record<Diagnosis, string> = { bias: "смещение", variance: "разброс", ok: "всё в порядке" };
const WHY: Record<Diagnosis, string> = {
  bias: "обе кривые вышли на плато выше цели и почти сошлись: модели не хватает гибкости. Поможет степень выше или меньший λ; данные — нет.",
  variance: "между кривыми большой разрыв, а валидация ещё падает с ростом n: модель подстраивается под шум. Помогут данные, больший λ или степень ниже.",
  ok: "валидационная ошибка уже у цели, а до σ² снизу не опуститься никакой моделью.",
};

function Band({ points, cls }: { points: [number, number][]; cls: string }) {
  const { layout } = usePlane();
  return <polygon className={`learning-curves__band ${cls}`} aria-hidden="true" points={points.map(([x, y]) => `${layout.sx(x)},${layout.sy(y)}`).join(" ")} />;
}

export default function LearningCurves() {
  const [k, setK] = useState(1);
  const [lg, setLg] = useState(-6);
  const [maxN, setMaxN] = useState(160);
  const [guess, setGuess] = useState<Diagnosis | null>(null);
  const c = useMemo(() => curves(k, lg <= -6 ? 0 : 10 ** lg, maxN), [k, lg, maxN]);
  const truth = diagnose(c);
  const last = c.at(-1)!;
  const top = Math.min(1.5, Math.max(...c.map((p) => p.valHi)) * 1.05);
  const lx = (n: number) => Math.log10(n);
  type P = (typeof c)[number];
  const band = (lo: (p: P) => number, hi: (p: P) => number) => [...c.map((p) => [lx(p.n), Math.min(top, lo(p))] as [number, number]), ...[...c].reverse().map((p) => [lx(p.n), Math.min(top, hi(p))] as [number, number])];
  const change = (f: () => void) => {
    f();
    setGuess(null);
  };
  const live = useLiveText(`Степень ${k}, ${lg <= -6 ? "без штрафа" : `lg λ = ${fmt(lg, 0)}`}, n до ${maxN}: обучение ${fmt(last.train, 3)}, валидация ${fmt(last.val, 3)}, цель ${TARGET}${guess ? `; ваш диагноз — ${NAMES[guess]}, верный — ${NAMES[truth]}` : ""}`);
  return (
    <div className="learning-curves">
      <Plane x={[1, Math.log10(1280)]} y={[0, top]} xStep={0.5} yStep={top > 0.6 ? 0.2 : 0.1} xLabel="lg n" yLabel="MSE" height={{ ratio: 0.5, min: 220, max: 320 }} initialWidth={660} label={`Кривые обучения: при n = ${maxN} MSE на обучении ${fmt(last.train, 3)}, на валидации ${fmt(last.val, 3)}; σ² = ${fmt(SIGMA * SIGMA, 2)}, цель ${TARGET}`}>
        <Band points={band((p) => p.trainLo, (p) => p.trainHi)} cls="is-train" />
        <Band points={band((p) => p.valLo, (p) => p.valHi)} cls="is-val" />
        <Polyline points={c.map((p) => [lx(p.n), Math.min(top, p.train)] as [number, number])} role="data" />
        <Polyline points={c.map((p) => [lx(p.n), Math.min(top, p.val)] as [number, number])} role="target" />
        <Line from={[1, SIGMA * SIGMA]} to={[3.2, SIGMA * SIGMA]} role="aux" label="σ²" />
        <Line from={[1, TARGET]} to={[3.2, TARGET]} role="param" label="цель" />
      </Plane>
      <p className="learning-curves__legend">бирюзовая — ошибка на обучении, пурпурная — на свежих данных; полосы — 10–90 % по 20 повторам; пунктир — σ², оранжевая — цель</p>
      <div className="learning-curves__actions" role="group" aria-label="Диагноз">
        <span className="learning-curves__ask">Ваш диагноз:</span>
        {(["bias", "variance", "ok"] as Diagnosis[]).map((d) => (
          <button key={d} type="button" className="btn btn--sm" aria-pressed={guess === d} onClick={() => setGuess(d)}>
            {NAMES[d]}
          </button>
        ))}
      </div>
      {guess && (
        <p className="learning-curves__verdict" role="status">
          {guess === truth ? "Верно" : `Не совсем: здесь ${NAMES[truth]}`} — {WHY[truth]}
        </p>
      )}
      <div className="learning-curves__actions" role="group" aria-label="Лечение">
        <button type="button" className="btn btn--sm" disabled={maxN >= 1280} onClick={() => change(() => setMaxN((n) => Math.min(1280, n * 2)))}>
          Удвоить n
        </button>
        <button type="button" className="btn btn--sm" disabled={k >= 10} onClick={() => change(() => setK((v) => Math.min(10, v + 2)))}>
          Степень +2
        </button>
        <button type="button" className="btn btn--sm" onClick={() => change(() => setLg((v) => (v <= -6 ? -4 : Math.min(0, v + 1))))}>
          λ ×10
        </button>
        <button
          type="button"
          className="btn btn--sm btn--quiet"
          onClick={() =>
            change(() => {
              setK(1);
              setLg(-6);
              setMaxN(160);
            })
          }
        >
          Сначала
        </button>
      </div>
      <div className="learning-curves__controls">
        <ParamSlider name="степень" value={k} min={0} max={10} step={1} digits={0} role="param" onChange={(v) => change(() => setK(v))} />
        <ParamSlider name="lg λ" value={lg} min={-6} max={0} step={1} digits={0} role="aux" onChange={(v) => change(() => setLg(v))} />
        <div className="learning-curves__readouts">
          <Readout name="n" value={maxN} digits={0} />
          <Readout name="MSE обуч." value={last.train} digits={3} />
          <Readout name="MSE вал." value={last.val} digits={3} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
