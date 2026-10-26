// Виджет «Порог классификатора» (курс «Основы ML», урок 2.1): 300 заявок на оси оценки p, два ряда — дефолты и вернувшие
// кредит; вертикаль — порог t, справа от неё отказы. Ошибки крупнее и цвета ответа. Рядом — матрица ошибок, точность,
// полнота, FPR, доля верных и точка на ROC. С пропом cost — цена ошибок. Эталон — initThresholdStrip в prototype/assets/ml.js.
import { useState } from "react";
import { Line, MathText, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText, usePlane } from "../../_kit";
import data from "./data.json";
import { accuracy, confusion, fpr, precision, recall, rocAuc, rocPoints } from "./model";

const { scores: S, y: Y } = data as { scores: number[]; y: number[] };
const ROC = rocPoints(S, Y);
const AUC = rocAuc(S, Y);
const P = Y.reduce((a, b) => a + b, 0);
const N = Y.length - P;

export interface ThresholdProps {
  /** Начальный порог; по умолчанию 0.5. */
  initial?: number;
  /** Цена ошибок: лишний отказ и пропущенный дефолт. Без неё цена не показывается. */
  cost?: { fp: number; fn: number };
  /** Показать ROC-кривую. */
  roc?: boolean;
}

/** Подписи рядов слева от точек. */
function RowLabels() {
  const { layout } = usePlane();
  return (
    <>
      <MathText x={layout.inner.x + 6} y={layout.sy(1.92)} label="дефолт" role="aux" />
      <MathText x={layout.inner.x + 6} y={layout.sy(0.92)} label="вернул" role="aux" />
    </>
  );
}

export default function Threshold({ initial = 0.5, cost, roc = true }: ThresholdProps) {
  const [t, setT] = useState(initial);
  const c = confusion(S, Y, t);
  const live = useLiveText(
    `Порог ${fmt(t)}: отказов ${c.tp + c.fp}, пропущенных дефолтов ${c.fn}, лишних отказов ${c.fp}. Точность ${fmt(precision(c), 3)}, полнота ${fmt(recall(c), 3)}.${cost ? ` Цена ошибок ${cost.fn * c.fn + cost.fp * c.fp}.` : ""}`,
  );
  return (
    <div className="threshold">
      <Plane x={[0, 1]} y={[0, 2]} xStep={0.2} yStep={4} xLabel="p" yLabel="" height={{ ratio: 0.36, min: 190, max: 260 }} label="300 заявок на оси оценки p: верхний ряд — дефолты, нижний — вернувшие кредит; вертикаль — порог t, справа — отказы">
        <RowLabels />
        {S.map((p, i) => {
          const err = (p >= t) !== Boolean(Y[i]);
          const jitter = (((i * 37) % 23) / 22 - 0.5) * 0.6;
          return <Point key={i} x={p} y={(Y[i] ? 1.5 : 0.5) + jitter} role={err ? "target" : Y[i] ? "data" : "aux"} r={err ? 4 : 2.75} />;
        })}
        <Line from={[t, 0]} to={[t, 2]} role="param" label="t" />
      </Plane>
      <div className="threshold__panel">
        <div className="threshold__controls">
          <ParamSlider name="t" value={t} min={0} max={1} step={0.005} digits={3} role="param" onChange={setT} />
          <div className="threshold__metrics">
            <Readout name="точность" value={precision(c)} digits={3} />
            <Readout name="полнота" value={recall(c)} digits={3} />
            <Readout name="FPR" value={fpr(c)} digits={3} />
            <Readout name="доля верных" value={accuracy(c)} digits={2} />
            {cost && <Readout name="цена ошибок" value={cost.fn * c.fn + cost.fp * c.fp} digits={0} />}
          </div>
        </div>
        <table className="threshold__cm">
          <caption className="visually-hidden">Матрица ошибок при выбранном пороге</caption>
          <thead>
            <tr>
              <td></td>
              <th scope="col">Отказ, p ≥ t</th>
              <th scope="col">Выдача, p &lt; t</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Дефолт</th>
              <td><b>{c.tp}</b> верный отказ</td>
              <td className="is-err"><b>{c.fn}</b> пропущенный дефолт</td>
            </tr>
            <tr>
              <th scope="row">Вернул</th>
              <td className="is-err"><b>{c.fp}</b> лишний отказ</td>
              <td><b>{c.tn}</b> верная выдача</td>
            </tr>
          </tbody>
        </table>
        {roc && (
          <div className="threshold__roc">
            <Plane x={[0, 1]} y={[0, 1]} xStep={0.5} yStep={0.5} xLabel="FPR" yLabel="TPR" height={{ ratio: 1, min: 200, max: 260 }} initialWidth={260} label={`ROC-кривая, AUC = ${fmt(AUC, 3)}; точка — выбранный порог`}>
              <Line from={[0, 0]} to={[1, 1]} role="aux" />
              <Polyline points={ROC} role="data" />
              <Point x={c.fp / N} y={c.tp / P} role="param" r={5} />
            </Plane>
            <p className="threshold__auc">AUC = {fmt(AUC, 3)}</p>
          </div>
        )}
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
