// Представление «Тир оценок»: на поле — мишень θ, 200 «выстрелов» последнего залпа (оценки c·x̄) и их среднее.
// Справа — бегунок c, «Залп» и «Сдать c», показания последнего залпа и список залпов. Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point, Readout } from "../../widgets/_kit";
import { C_MAX, C_STEP, DEBRIEF, estimatorRange, LEVEL_NAMES, LEVELS, SHOTS, type Action, type Level, type State } from "./model";

const f = (x: number) => (Math.round(x * 100) / 100).toFixed(2).replace("-", "−");

function Board({ state }: { state: State }) {
  const { theta, sigma, n } = state.level;
  const sd = sigma / Math.sqrt(n);
  const lo = Math.min(-0.5, theta - 4 * sd);
  const hi = theta + 4 * sd;
  const v = state.volleys[state.volleys.length - 1];
  const center = v ? v.hits.reduce((a, b) => a + b, 0) / v.hits.length : null;
  const step = hi - lo > 12 ? 2 : hi - lo > 5 ? 1 : 0.5;
  return (
    <figure className="game__figure">
      <Plane x={[lo, hi]} y={[-1, 1]} xStep={step} yStep={1} xLabel="оценка" yLabel="" height={{ ratio: 0.45, min: 200, max: 300 }} initialWidth={480} label={v ? `Залп из ${SHOTS} оценок при c = ${f(v.c)}: среднее ${f(center!)}, мишень θ = ${f(theta)}` : `Мишень θ = ${f(theta)}, выстрелов пока нет`}>
        {v?.hits.map((h, i) => (
          <Point key={i} x={h} y={(((i * 37) % 100) / 100 - 0.5) * 1.4} role="data" r={2.5} />
        ))}
        <Line from={[theta, 1]} to={[theta, -1]} role="target" label="θ" />
        {center !== null && <Line from={[center, -1]} to={[center, 1]} role="param" label="среднее" />}
      </Plane>
      <figcaption className="game__legend">каждая точка — оценка c·x̄ по своей выборке из {n} наблюдений; разброс по высоте только для наглядности</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const done = state.submitted !== null;
  const v = state.volleys[state.volleys.length - 1];
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          оценка = <b>c</b> · x̄, выборки по <b>{state.level.n}</b> наблюдений, σ = <b>{f(state.level.sigma)}</b>
        </span>
      </p>
      <ParamSlider name="c" value={state.c} min={0} max={C_MAX} step={C_STEP} digits={2} role="param" disabled={done} onChange={(c) => dispatch({ type: "set", c })} />
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm" disabled={done} onClick={() => dispatch({ type: "shoot" })}>
          Залп
        </button>
        <button type="button" className="btn btn--sm btn--primary" disabled={!estimatorRange.canSubmit(state)} onClick={() => dispatch({ type: "submit" })}>
          Сдать c
        </button>
      </div>
      {v && (
        <div className="game-range__readouts">
          <Readout name="смещение²" value={v.bias2} digits={3} />
          <Readout name="дисперсия" value={v.variance} digits={3} />
          <Readout name="MSE" value={v.mse} digits={3} />
        </div>
      )}
      {state.volleys.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Залпы">
          {state.volleys.map((x, i) => (
            <li key={i}>
              c = {f(x.c)}: MSE {f(x.mse)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => LEVEL_NAMES[l.kind],
  feedback: (s) => estimatorRange.feedback(s),
  stats: (s) => [
    ["Залпов", s.volleys.length],
    ["Выстрелов в залпе", SHOTS],
  ],
  actions: (s) => s.volleys.length + s.misses.length + (s.submitted === null ? 0 : 1),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунке c", "шаг 0.01; Page Up и Page Down — крупнее"],
    ["Enter на «Залп»", `${SHOTS} новых выборок и оценок`],
    ["Подсказка", "сначала как устроена ошибка, потом формула MSE(c)"],
  ],
};

export function EstimatorRange({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={estimatorRange} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
