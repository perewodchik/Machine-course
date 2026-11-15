// Виджет «Фолды» (урок 2.4 «Основ ML»): полоса из 60 «Квартир», k строк — по прогону на фолд, валидационный фолд
// выделен. Справа — ошибки фолдов по степеням полинома (точки), среднее ± SE и ошибка одной отложенной части. Кнопка
// «Новое разбиение» перемешивает данные; «стратифицировать» показывает отклики звонков по фолдам.
import { useMemo, useState } from "react";
import { Line, Plane, Point, Polyline, Readout, fmt, useLiveText, usePlane } from "../../_kit";
import { argmin, CALLS, cv, folds, holdout, MAX_DEGREE, N, oneSe, stratifiedFolds } from "./model";

const KS = [2, 5, 10, 60] as const;
const ROWS_MAX = 10;

function Strip({ fs }: { fs: number[][] }) {
  const { layout } = usePlane();
  const rows = fs.slice(0, ROWS_MAX);
  return (
    <g aria-hidden="true">
      {rows.map((f, r) => {
        const inF = new Set(f);
        return Array.from({ length: N }, (_, i) => {
          const x0 = layout.sx(i);
          const y0 = layout.sy(r + 1);
          const cls = inF.has(i) ? "folds__cell is-val" : "folds__cell";
          return <rect key={`${r}-${i}`} className={cls} x={x0 + 0.5} y={y0 + 1} width={layout.sx(i + 1) - x0 - 1} height={layout.sy(r) - y0 - 2} />;
        });
      })}
    </g>
  );
}

export default function Folds() {
  const [k, setK] = useState<(typeof KS)[number]>(5);
  const [seed, setSeed] = useState(1);
  const [strat, setStrat] = useState(false);
  const fs = useMemo(() => folds(k, seed), [k, seed]);
  const scores = useMemo(() => cv(fs), [fs]);
  const hold = useMemo(() => holdout(seed), [seed]);
  const best = argmin(scores.map((s) => s.mean));
  const se1 = oneSe(scores);
  const holdBest = argmin(hold);
  const top = Math.min(4, Math.max(...scores.flatMap((s) => s.errs), ...hold) * 1.05);
  const order = fs.flat();
  const sf = useMemo(() => (strat ? stratifiedFolds(5, seed) : folds(5, seed)), [strat, seed]);
  const posPerFold = sf.map((f) => f.filter((i) => CALLS[i] === 1).length);
  const live = useLiveText(`${k === 60 ? "Без одного" : `${k}-кратная кросс-валидация`}: лучшая степень ${best}, по правилу одной SE — ${se1}; по одной отложенной части — ${holdBest}`);
  return (
    <div className="folds">
      <div className="folds__actions" role="group" aria-label="Число фолдов">
        {KS.map((v) => (
          <button key={v} type="button" className="btn btn--sm" aria-pressed={k === v} onClick={() => setK(v)}>
            {v === 60 ? "без одного (k = n)" : `k = ${v}`}
          </button>
        ))}
        <button type="button" className="btn btn--sm btn--quiet" onClick={() => setSeed((s) => s + 1)}>
          Новое разбиение
        </button>
      </div>
      <div className="folds__plots">
        <Plane x={[0, N]} y={[0, Math.min(k, ROWS_MAX)]} xStep={10} yStep={Math.min(k, ROWS_MAX)} bare height={{ ratio: 0.45, min: 120, max: 220 }} initialWidth={420} label={`Разбиение 60 объектов на ${k} фолдов: в каждой строке валидационный фолд выделен${k > ROWS_MAX ? `; показаны первые ${ROWS_MAX} прогонов из ${k}` : ""}`}>
          <Strip fs={fs.map((f) => f.map((i) => order.indexOf(i)))} />
        </Plane>
        <Plane x={[0, MAX_DEGREE]} y={[0, top]} xStep={1} yStep={top > 2 ? 1 : 0.5} xLabel="степень" yLabel="MSE" height={{ ratio: 0.6, min: 200, max: 280 }} initialWidth={420} label={`Ошибки фолдов по степеням: лучшая ${best} (MSE ${fmt(scores[best]!.mean, 3)} ± ${fmt(scores[best]!.se, 3)}), отложенная часть выбирает ${holdBest}`}>
          {scores.flatMap((s) => s.errs.slice(0, 10).map((e, j) => <Point key={`${s.d}-${j}`} x={s.d} y={Math.min(top, e)} role="aux" r={2.75} />))}
          {scores.map((s) => <Line key={`se${s.d}`} from={[s.d, Math.max(0, s.mean - s.se)]} to={[s.d, Math.min(top, s.mean + s.se)]} role="param" />)}
          <Polyline points={scores.map((s) => [s.d, Math.min(top, s.mean)] as [number, number])} role="param" />
          <Polyline points={hold.map((v, d) => [d, Math.min(top, v)] as [number, number])} role="target" dashed />
          <Point x={best} y={scores[best]!.mean} role="param" r={5} />
        </Plane>
      </div>
      <p className="folds__legend">слева — строки прогонов, выделен валидационный фолд; справа — серые точки: ошибки фолдов, оранжевая — среднее ± SE, пурпурный штрих — одна отложенная часть 70/30</p>
      <div className="folds__readouts">
        <Readout name="лучшая степень по CV" value={best} digits={0} />
        <Readout name="по правилу одной SE" value={se1} digits={0} />
        <Readout name="по отложенной части" value={holdBest} digits={0} />
      </div>
      <div className="folds__strat">
        <label className="folds__check">
          <input type="checkbox" checked={strat} onChange={(e) => setStrat(e.target.checked)} /> стратифицировать (60 звонков, откликов {CALLS.reduce((a, b) => a + b, 0)})
        </label>
        <p className="folds__pos">Откликов в каждом из 5 фолдов: {posPerFold.join(", ")}</p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
