// Виджет «Порог: кривые и цена» (урок 2.1 «Основ ML»): сверху — гистограммы оценок двух классов и порог t; ниже —
// ROC и PR с точкой порога, кривая стоимости c_FP·FP + c_FN·FN (на объект) с минимумом и t*, кривая надёжности.
// Ручки: порог, разделимость классов, доля положительных φ, цены ошибок, «исказить оценки» (s ↦ s³), новая выборка.
import { useMemo, useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { accuracy, f1, fpr, precision, recall } from "../../../lib/math/classification";
import { confusion, histograms, sample, summary, T_GRID } from "./model";

const BINS = 25;

export default function ThresholdLab() {
  const [t, setT] = useState(0.5);
  const [d, setD] = useState(2);
  const [phiPct, setPhi] = useState(30);
  const [cFp, setCfp] = useState(1);
  const [cFn, setCfn] = useState(5);
  const [distort, setDistort] = useState(false);
  const [seed, setSeed] = useState(1);
  const x = useMemo(() => sample(seed, d, phiPct / 100, distort), [seed, d, phiPct, distort]);
  const s = useMemo(() => summary(x, cFp, cFn), [x, cFp, cFn]);
  const h = useMemo(() => histograms(x, BINS), [x]);
  const c = confusion(x.s, x.y, t);
  const tStar = cFp / (cFp + cFn);
  const hTop = Math.max(...h.pos, ...h.neg) * 1.1;
  const step = (v: number[]) => v.flatMap((p, k) => [[k / BINS, p] as [number, number], [(k + 1) / BINS, p] as [number, number]]);
  const costMax = Math.max(...s.costs) * 1.05;
  const costAtT = s.costs[Math.round(t * 200)]!;
  const live = useLiveText(`Порог ${fmt(t)}: TP ${c.tp}, FP ${c.fp}, FN ${c.fn}, TN ${c.tn}; точность ${fmt(precision(c))}, полнота ${fmt(recall(c))}; AUC ${fmt(s.auc, 3)}, AP ${fmt(s.ap, 3)}, Брайер ${fmt(s.brier, 3)}`);
  const small = { height: { ratio: 0.8, min: 190, max: 260 }, initialWidth: 320 } as const;
  return (
    <div className="threshold-lab">
      <Plane x={[0, 1]} y={[0, hTop]} xStep={0.1} yStep={hTop > 0.4 ? 0.2 : 0.1} xLabel="оценка" yLabel="доля класса" height={{ ratio: 0.32, min: 170, max: 230 }} initialWidth={660} label={`Гистограммы оценок: положительные (${phiPct} %) и отрицательные; порог ${fmt(t)}`}>
        <Polyline points={step(h.neg)} role="data" />
        <Polyline points={step(h.pos)} role="target" />
        <Line from={[t, 0]} to={[t, hTop]} role="param" label="t" />
        <Line from={[tStar, 0]} to={[tStar, hTop]} role="aux" />
      </Plane>
      <p className="threshold-lab__legend">бирюзовая ступенька — отрицательные, пурпурная — положительные (каждая нормирована на свой класс); сплошная вертикаль — порог t, пунктир — порог t* по ценам ошибок</p>
      <div className="threshold-lab__grid">
        <Plane x={[0, 1]} y={[0, 1]} xStep={0.5} yStep={0.5} xLabel="FPR" yLabel="TPR" {...small} label={`ROC, AUC = ${fmt(s.auc, 3)}`}>
          <Polyline points={s.roc} role="target" />
          <Line from={[0, 0]} to={[1, 1]} role="aux" />
          <Point x={fpr(c)} y={recall(c)} role="param" r={5} />
        </Plane>
        <Plane x={[0, 1]} y={[0, 1]} xStep={0.5} yStep={0.5} xLabel="полнота" yLabel="точность" {...small} label={`PR, AP = ${fmt(s.ap, 3)}`}>
          <Polyline points={s.pr} role="target" />
          <Line from={[0, phiPct / 100]} to={[1, phiPct / 100]} role="aux" />
          <Point x={recall(c)} y={precision(c)} role="param" r={5} />
        </Plane>
        <Plane x={[0, 1]} y={[0, costMax]} xStep={0.5} yStep={costMax > 1 ? 0.5 : 0.1} xLabel="порог" yLabel="цена на объект" {...small} label={`Кривая стоимости: минимум при t = ${fmt(s.bestT)}, t* = ${fmt(tStar)}`}>
          <Polyline points={T_GRID.map((u, k) => [u, s.costs[k]!] as [number, number])} role="data" />
          <Point x={s.bestT} y={s.costs[Math.round(s.bestT * 200)]!} role="target" r={4} />
          <Point x={t} y={costAtT} role="param" r={5} />
          <Line from={[tStar, 0]} to={[tStar, costMax]} role="aux" />
        </Plane>
        <Plane x={[0, 1]} y={[0, 1]} xStep={0.5} yStep={0.5} xLabel="средняя оценка" yLabel="доля положительных" {...small} label={`Кривая надёжности, Брайер = ${fmt(s.brier, 3)}`}>
          <Line from={[0, 0]} to={[1, 1]} role="aux" />
          <Polyline points={s.rel.map((b) => [b.mean, b.frac] as [number, number])} role="target" />
          {s.rel.map((b, i) => <Point key={i} x={b.mean} y={b.frac} role="target" r={3} />)}
        </Plane>
      </div>
      <p className="threshold-lab__legend">ROC · PR (пунктир — доля положительных) · стоимость (кружок — минимум) · надёжность (пунктир — идеальная калибровка)</p>
      <div className="threshold-lab__controls">
        <ParamSlider name="порог t" value={t} min={0} max={1} step={0.005} digits={3} role="param" onChange={setT} />
        <ParamSlider name="разделимость" value={d} min={0.5} max={4} step={0.1} digits={1} role="aux" onChange={setD} />
        <ParamSlider name="φ, %" value={phiPct} min={1} max={50} step={1} digits={0} role="aux" onChange={setPhi} />
        <ParamSlider name="c_{FP}" value={cFp} min={1} max={20} step={1} digits={0} role="aux" onChange={setCfp} />
        <ParamSlider name="c_{FN}" value={cFn} min={1} max={20} step={1} digits={0} role="aux" onChange={setCfn} />
        <div className="threshold-lab__actions">
          <label className="threshold-lab__check">
            <input type="checkbox" checked={distort} onChange={(e) => setDistort(e.target.checked)} /> исказить оценки (s ↦ s³)
          </label>
          <button type="button" className="btn btn--sm" onClick={() => setT(s.bestT)}>
            Порог к минимуму стоимости
          </button>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setSeed((v) => v + 1)}>
            Новая выборка
          </button>
        </div>
        <table className="threshold-lab__cm">
          <caption className="visually-hidden">Матрица ошибок при пороге {fmt(t)}</caption>
          <thead>
            <tr><td /><th scope="col">отмечен</th><th scope="col">не отмечен</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">положительный</th><td>TP <b>{c.tp}</b></td><td>FN <b>{c.fn}</b></td></tr>
            <tr><th scope="row">отрицательный</th><td>FP <b>{c.fp}</b></td><td>TN <b>{c.tn}</b></td></tr>
          </tbody>
        </table>
        <div className="threshold-lab__readouts">
          <Readout name="доля верных" value={accuracy(c)} digits={3} />
          <Readout name="точность" value={precision(c)} digits={3} />
          <Readout name="полнота" value={recall(c)} digits={3} />
          <Readout name="FPR" value={fpr(c)} digits={3} />
          <Readout name="F_1" value={f1(c)} digits={3} />
          <Readout name="AUC" value={s.auc} digits={3} />
          <Readout name="AP" value={s.ap} digits={3} />
          <Readout name="Брайер" value={s.brier} digits={4} />
          <Readout name="t*" value={tStar} digits={3} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
