// Виджет «Перцептрон» (урок 1.5 «Основ ML»): точки двух классов на плоскости стандартизованных признаков, граница
// θᵀx = 0, стрелки w до и после последней поправки, объект поправки выделен. Кнопки: поправка на следующей ошибке,
// эпоха целиком, задача (разделимая или нет). Внизу — ошибки по эпохам.
import { useMemo, useState } from "react";
import { Line, Plane, Point, Readout, Vector, useLiveText, usePlane } from "../../_kit";
import { converged, errors, finishEpoch, initial, problem, step, type Task } from "./model";

const R: [number, number] = [-2.4, 2.4];

function boundary(theta: readonly number[]): [[number, number], [number, number]] | null {
  const [t0, t1, t2] = theta as [number, number, number];
  const k2 = t1 * t1 + t2 * t2;
  if (k2 < 1e-12) return null;
  const p = [(-t0 * t1) / k2, (-t0 * t2) / k2];
  const d = [-t2 / Math.sqrt(k2), t1 / Math.sqrt(k2)];
  return [
    [p[0]! - 10 * d[0]!, p[1]! - 10 * d[1]!],
    [p[0]! + 10 * d[0]!, p[1]! + 10 * d[1]!],
  ];
}

function Dots({ X, y }: { X: number[][]; y: number[] }) {
  const { layout } = usePlane();
  return (
    <g aria-hidden="true">
      {X.map(([, a, b], i) => {
        const cx = layout.sx(a!);
        const cy = layout.sy(b!);
        return y[i] ? <path key={i} className="perceptron__dot is-pos" d={`M${cx} ${cy - 4}L${cx + 3.6} ${cy + 2.6}L${cx - 3.6} ${cy + 2.6}Z`} /> : <circle key={i} className="perceptron__dot" cx={cx} cy={cy} r={3} />;
      })}
    </g>
  );
}

const TASKS: { id: Task; label: string }[] = [
  { id: "separable", label: "эконом или бизнес" },
  { id: "overlap", label: "бизнес или нет" },
];

export default function Perceptron() {
  const [task, setTask] = useState<Task>("separable");
  const p = useMemo(() => problem(task), [task]);
  const [s, setS] = useState(initial);
  const switchTask = (t: Task) => {
    setTask(t);
    setS(initial());
  };
  const line = boundary(s.theta);
  const scale = 1.6 / Math.max(1, Math.hypot(s.theta[1]!, s.theta[2]!), s.last ? Math.hypot(s.last.before[1]!, s.last.before[2]!) : 0);
  const done = converged(s);
  const errs = errors(p, s.theta);
  const live = useLiveText(done ? `Эпоха без ошибок: перцептрон остановился, ошибок ${errs}` : `Эпоха ${s.epoch + 1}, поправок в ней ${s.current}; сейчас ошибок ${errs} из ${p.X.length}`);
  return (
    <div className="perceptron">
      <Plane x={R} y={R} xStep={1} yStep={1} equal xLabel="площадь" yLabel="до метро" height={{ ratio: 1, min: 260, max: 420 }} initialWidth={480} label={`${p.X.length} квартир: треугольники — класс 1, круги — 0; ${line ? "граница перцептрона" : "граница ещё не задана"}; ошибок ${errs}`}>
        <Dots X={p.X} y={p.y} />
        {line && <Line from={line[0]} to={line[1]} role="param" />}
        {s.last && <Vector to={[scale * s.last.before[1]!, scale * s.last.before[2]!]} role="aux" label="до" />}
        {(s.theta[1] !== 0 || s.theta[2] !== 0) && <Vector to={[scale * s.theta[1]!, scale * s.theta[2]!]} role="param" label="w" />}
        {s.last && <Point x={p.X[s.last.i]![1]!} y={p.X[s.last.i]![2]!} role="target" r={6} />}
      </Plane>
      <p className="perceptron__legend">треугольники — класс 1, круги — класс 0; линия — граница; выделена точка последней поправки, пунктир — w до неё</p>
      <div className="perceptron__controls">
        <div className="perceptron__actions" role="group" aria-label="Задача">
          {TASKS.map((t) => (
            <button key={t.id} type="button" className="btn btn--sm" aria-pressed={task === t.id} onClick={() => switchTask(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="perceptron__actions">
          <button type="button" className="btn btn--sm" disabled={done} onClick={() => setS((x) => step(p, x))}>
            Поправка на следующей ошибке
          </button>
          <button type="button" className="btn btn--sm" disabled={done || s.mistakes.length >= 30} onClick={() => setS((x) => finishEpoch(p, x))}>
            Эпоха целиком
          </button>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => setS(initial())}>
            Сначала
          </button>
        </div>
        <div className="perceptron__readouts">
          <Readout name="эпоха" value={s.epoch + 1} digits={0} />
          <Readout name="ошибок сейчас" value={errs} digits={0} />
        </div>
        <p className="perceptron__history" aria-label="Ошибок по эпохам">
          {s.mistakes.length ? `Поправок по эпохам: ${s.mistakes.join(", ")}${done ? " — эпоха без ошибок, перцептрон остановился." : ""}` : "Поправок по эпохам: пока ни одной завершённой эпохи."}
        </p>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {live}
      </p>
    </div>
  );
}
