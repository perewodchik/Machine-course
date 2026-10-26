// Представление «Машина правдоподобия»: над полем — выборка; на поле — замеры ℓ(θ) точками и бегунок θ вертикалью.
// Кривая ℓ скрыта до сдачи, потом рисуется целиком. Справа — бегунок θ, «Замерить ℓ», «Сдать» и список замеров.
// Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point, Polyline } from "../../widgets/_kit";
import { BUDGET, DEBRIEF, ell, LEVEL_NAMES, LEVELS, likelihoodMachine, mle, PARAM, type Action, type Level, type State } from "./model";

const f = (x: number) => (Math.round(x * 100) / 100).toFixed(2).replace("-", "−");

function dataText(l: Level): string {
  if (l.kind === "bernoulli") {
    const k = l.data.reduce((a, b) => a + b, 0);
    return `${l.data.length} бросков монеты, орлов — ${k}: ${l.data.join(" ")}`;
  }
  const what = { poisson: "звонков за минуту", "normal-mean": "измерений, σ = 1 известна", exponential: "интервалов ожидания, мин", "normal-sd": "отклонений от известного μ = 0" }[l.kind];
  return `${l.data.length} ${what}: ${l.data.map((v) => String(v).replace("-", "−")).join(", ")}`;
}

function Board({ state }: { state: State }) {
  const l = state.level;
  const top = ell(l, mle(l));
  const lowest = Math.min(top - 8, ...state.probes.map((p) => p.ell));
  const lo = Math.max(top - 60, lowest - 1);
  const hi = top + 0.15 * (top - lo);
  const clampY = (y: number) => Math.max(lo, y);
  const done = state.submitted !== null;
  const curve = done ? Array.from({ length: 241 }, (_, i) => l.range[0] + ((l.range[1] - l.range[0]) * i) / 240).map((t) => [t, clampY(ell(l, t))] as [number, number]) : [];
  const span = l.range[1] - l.range[0];
  return (
    <figure className="game__figure">
      <p className="game-like__data">{dataText(l)}</p>
      <Plane x={[l.range[0], l.range[1]]} y={[lo, hi]} xStep={span > 6 ? 1 : span > 2 ? 0.5 : 0.1} yStep={(hi - lo) > 40 ? 10 : (hi - lo) > 15 ? 5 : 2} xLabel={PARAM[l.kind]} yLabel="ℓ" height={{ ratio: 0.6, min: 220, max: 360 }} initialWidth={480} label={`Замеры логарифма правдоподобия: ${state.probes.length} из ${BUDGET}${done ? "; после сдачи показана вся кривая" : ""}`}>
        {done && <Polyline points={curve} role="aux" />}
        <Line from={[state.theta, lo]} to={[state.theta, hi]} role="param" />
        {state.probes.map((p, i) => (
          <Point key={i} x={p.theta} y={clampY(p.ell)} role="data" />
        ))}
        {done && <Point x={mle(l)} y={top} role="target" label="максимум" />}
      </Plane>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const l = state.level;
  const done = state.submitted !== null;
  const p = PARAM[l.kind];
  return (
    <div className="game-eigen">
      <ParamSlider name={p} value={state.theta} min={l.range[0]} max={l.range[1]} step={l.step} digits={2} role="param" disabled={done} onChange={(t) => dispatch({ type: "set", theta: t })} />
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm" disabled={!likelihoodMachine.canProbe(state)} onClick={() => dispatch({ type: "probe" })}>
          Замерить ℓ
        </button>
        <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "submit" })}>
          Сдать {p}
        </button>
      </div>
      {state.probes.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Замеры">
          {state.probes.map((x, i) => (
            <li key={i}>
              ℓ({f(x.theta)}) = {f(x.ell)}
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
  feedback: (s) => likelihoodMachine.feedback(s),
  stats: (s) => [
    ["Замеров", `${s.probes.length} из ${BUDGET}`],
    ["Промахов", s.misses.length],
  ],
  actions: (s) => s.probes.length + s.misses.length + (s.submitted === null ? 0 : 1),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунке", "мелкий шаг; Page Up и Page Down — крупнее"],
    ["Enter на «Замерить ℓ»", `значение логарифма правдоподобия в точке; всего ${BUDGET}`],
    ["Подсказка", "сначала где искать максимум, потом формула оценки"],
  ],
};

export function LikelihoodMachine({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={likelihoodMachine} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
