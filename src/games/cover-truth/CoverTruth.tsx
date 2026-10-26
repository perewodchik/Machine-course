// Представление «Покрой истину»: на поле — 100 интервалов последнего залпа (по строке на выборку) и вертикаль μ;
// не накрывшие μ — штриховые другого цвета. Справа — бегунок z, «Построить 100 интервалов», «Сдать z» и залпы.
// Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane } from "../../widgets/_kit";
import { coverTruth, DEBRIEF, LEVEL_NAMES, LEVELS, PER_VOLLEY, Z, type Action, type Level, type State } from "./model";

const f = (x: number) => (Math.round(x * 100) / 100).toFixed(2);
const pct = (x: number) => `${Math.round(x * 100)} %`;

function Board({ state }: { state: State }) {
  const l = state.level;
  const half = (l.known ? 3.2 : 5) * (l.sigma / Math.sqrt(l.n));
  const v = state.volleys[state.volleys.length - 1];
  const step = half > 6 ? 2 : half > 2.5 ? 1 : 0.5;
  return (
    <figure className="game__figure">
      <Plane x={[l.mu - half, l.mu + half]} y={[0, PER_VOLLEY + 1]} xStep={step} yStep={25} xLabel="" yLabel="" height={{ ratio: 0.75, min: 260, max: 420 }} initialWidth={480} label={v ? `${PER_VOLLEY} интервалов при z = ${f(v.z)}: накрыли μ = ${l.mu} ${v.covered}, не накрыли ${PER_VOLLEY - v.covered}` : `Истинное μ = ${l.mu}, интервалов пока нет`}>
        {v?.intervals.map((it, i) => (
          <Line key={i} from={[it.lo, i + 1]} to={[it.hi, i + 1]} role={it.covers ? "data" : "target"} dashed={!it.covers} />
        ))}
        <Line from={[l.mu, 0]} to={[l.mu, PER_VOLLEY + 1]} role="param" label="μ" labelAbove />
      </Plane>
      <figcaption className="game__legend">каждая строка — интервал по своей выборке; сплошные накрыли μ, штриховые — нет</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const l = state.level;
  const done = state.submitted !== null;
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          интервал x̄ ± <b>z</b> · {l.known ? "σ" : "s"}/√n, n = <b>{l.n}</b>, {l.known ? <>σ = <b>{l.sigma}</b> известна</> : "σ оценивается по выборке"}; нужно покрытие <b>{pct(l.conf)}</b>
        </span>
      </p>
      <ParamSlider name="z" value={state.z} min={Z.min} max={Z.max} step={Z.step} digits={2} role="param" disabled={done} onChange={(z) => dispatch({ type: "set", z })} />
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm" disabled={done} onClick={() => dispatch({ type: "draw" })}>
          Построить 100 интервалов
        </button>
        <button type="button" className="btn btn--sm btn--primary" disabled={!coverTruth.canSubmit(state)} onClick={() => dispatch({ type: "submit" })}>
          Сдать z
        </button>
      </div>
      {state.volleys.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Залпы">
          {state.volleys.map((x, i) => (
            <li key={i}>
              z = {f(x.z)}: накрыли {x.covered} из {PER_VOLLEY}
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
  feedback: (s) => coverTruth.feedback(s),
  stats: (s) => [
    ["Залпов", s.volleys.length],
    ["Не принято", s.misses.length],
  ],
  actions: (s) => s.volleys.length + s.misses.length + (s.submitted === null ? 0 : 1),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунке z", "шаг 0.01; Page Up и Page Down — крупнее"],
    ["Enter на «Построить 100 интервалов»", "100 новых выборок и интервалов"],
    ["Подсказка", "сначала про шум залпа, потом откуда взять z"],
  ],
};

export function CoverTruth({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={coverTruth} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
