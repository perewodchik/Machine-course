// Виджет «Обучение и тест» (урок 1.1 «Основ ML»): слева — квартиры (крупные точки — обучение, мелкие — тест) и полином
// выбранной степени; справа — RMSE на обучении и на тесте по степени 0–12. Бегунок степени, размер обучающей выборки
// (20 или 200) и «Новая выборка» (другой seed).
import { useMemo, useState } from "react";
import { Line, ParamSlider, Plane, Point, Polyline, Readout, fmt, useLiveText } from "../../_kit";
import { polyEval, toArea } from "../../../lib/math/poly";
import { curves, DEGREES, sample } from "./model";

export interface TrainTestProps {
  seed?: number;
}

const SIZES = [20, 200] as const;

export default function TrainTest({ seed: seed0 = 7 }: TrainTestProps) {
  const [degree, setDegree] = useState(1);
  const [n, setN] = useState<(typeof SIZES)[number]>(20);
  const [seed, setSeed] = useState(seed0);
  const s = useMemo(() => sample(seed, n), [seed, n]);
  const c = useMemo(() => curves(s), [s]);
  const cur = c[degree]!;
  const curve = Array.from({ length: 121 }, (_, i) => -1 + i / 60).map((x) => [toArea(x), Math.max(-2, Math.min(22, polyEval(cur.theta, x)))] as [number, number]);
  const top = Math.min(4, Math.max(...c.map((r) => Math.max(r.train, r.test))) * 1.1);
  const clip = (v: number) => Math.min(top, v);
  const live = useLiveText(`Степень ${degree}, обучающих ${n}: RMSE на обучении ${fmt(cur.train)}, на тесте ${fmt(cur.test)}`);
  return (
    <div className="train-test">
      <div className="train-test__plots">
        <Plane x={[20, 125]} y={[0, 20]} xStep={20} yStep={5} xLabel="площадь" yLabel="цена" height={{ ratio: 0.7, min: 220, max: 320 }} initialWidth={420} label={`Квартиры: ${n} обучающих (крупные точки) и 200 тестовых (мелкие), полином степени ${degree}`}>
          {s.test.map(([x, y], i) => <Point key={`t${i}`} x={toArea(x)} y={y} role="aux" r={1.75} />)}
          {s.train.map(([x, y], i) => <Point key={`a${i}`} x={toArea(x)} y={y} role="data" r={n > 50 ? 2.75 : 4} />)}
          <Polyline points={curve} role="param" />
        </Plane>
        <Plane x={[0, DEGREES]} y={[0, top]} xStep={2} yStep={top > 2 ? 1 : 0.5} xLabel="степень" yLabel="RMSE" height={{ ratio: 0.7, min: 220, max: 320 }} initialWidth={420} label={`RMSE по степени: обучение падает, тест при степени ${degree} — ${fmt(cur.test)}`}>
          <Polyline points={c.map((r) => [r.d, clip(r.train)] as [number, number])} role="data" />
          <Polyline points={c.map((r) => [r.d, clip(r.test)] as [number, number])} role="target" dashed />
          <Line from={[degree, 0]} to={[degree, top]} role="param" />
        </Plane>
      </div>
      <p className="train-test__legend">справа: сплошная — ошибка на обучении, штриховая — на тесте; вертикаль — выбранная степень</p>
      <div className="train-test__controls">
        <ParamSlider name="степень" value={degree} min={0} max={DEGREES} step={1} digits={0} role="param" onChange={setDegree} />
        <div className="train-test__actions" role="group" aria-label="Размер обучающей выборки">
          {SIZES.map((k) => (
            <button key={k} type="button" className="btn btn--sm" aria-pressed={n === k} onClick={() => setN(k)}>
              {k} объектов
            </button>
          ))}
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setSeed((x) => x + 1)}>
            Новая выборка
          </button>
        </div>
        <div className="train-test__readouts">
          <Readout name="RMSE на обучении" value={cur.train} digits={3} />
          <Readout name="RMSE на тесте" value={cur.test} digits={3} />
        </div>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
