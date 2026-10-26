// Представление «Переобучи, если сможешь: облако»: до сдачи — одна выборка из n точек и подписи n, σ; после — облако
// из 100 моделей выбранной степени, истина и ожидаемая ошибка по степеням. Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point, Polyline } from "../../widgets/_kit";
import { gauss } from "../../lib/math/correlation";
import { polyEval } from "../../lib/math/poly";
import { rng } from "../../lib/math/rng";
import { DEBRIEF, expectedErrors, LEVEL_NAMES, LEVELS, MAX_DEGREE, models, overfitCloud, type Action, type Level, type State } from "./model";

const hStar = (x: number) => Math.sin(2.5 * x) + 0.3 * x;
const GRID = Array.from({ length: 81 }, (_, i) => -1 + i / 40);

/** Одна выборка уровня — та же, что первая в облаке. */
function firstSample(l: Level) {
  const r = rng(l.seed);
  return Array.from({ length: l.n }, () => {
    const x = -1 + 2 * r.next();
    return [x, hStar(x) + l.sigma * gauss(r)] as const;
  });
}

function Board({ state }: { state: State }) {
  const l = state.level;
  const pts = firstSample(l);
  const clamp = (v: number) => Math.max(-4, Math.min(4, v));
  const e = state.submitted ? expectedErrors(l) : null;
  return (
    <figure className="game__figure game-cloud">
      <Plane x={[-1, 1]} y={[-3, 3]} xStep={0.5} yStep={1} height={{ ratio: 0.6, min: 220, max: 340 }} initialWidth={480} label={`Выборка из ${l.n} точек, шум σ = ${l.sigma}${state.submitted ? `; облако из 100 моделей степени ${state.k} и истина` : ""}`}>
        {state.submitted && models(l, state.k).map((m, b) => <Polyline key={b} points={GRID.map((x) => [x, clamp(polyEval(m, x))] as [number, number])} role="aux" />)}
        {state.submitted && <Polyline points={GRID.map((x) => [x, hStar(x)] as [number, number])} role="target" />}
        {pts.map(([x, y], i) => <Point key={i} x={x} y={y} role="data" r={2.75} />)}
      </Plane>
      {e && (
        <Plane x={[0, MAX_DEGREE]} y={[0, Math.min(3, Math.max(...e) * 1.05)]} xStep={2} yStep={0.5} xLabel="степень" yLabel="ошибка" height={{ ratio: 0.35, min: 160, max: 220 }} initialWidth={480} label={`Ожидаемая ошибка по степеням; выбрана ${state.k}`}>
          <Polyline points={e.map((v, k) => [k, Math.min(3, v)] as [number, number])} role="target" />
          <Line from={[state.k, 0]} to={[state.k, 3]} role="param" />
        </Plane>
      )}
      <figcaption className="game__legend">{state.submitted ? "серые — 100 моделей выбранной степени, пурпурная — истина; внизу — ожидаемая ошибка по степени" : "одна из 100 выборок уровня; облако откроется после сдачи"}</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  return (
    <div className="game-eigen">
      <p className="game-matrix__facts">
        <span>
          n = <b>{state.level.n}</b>, σ = <b>{state.level.sigma}</b>
        </span>
      </p>
      <ParamSlider name="степень" value={state.k} min={0} max={MAX_DEGREE} step={1} digits={0} role="param" disabled={state.submitted} onChange={(k) => dispatch({ type: "set", k })} />
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm btn--primary" disabled={state.submitted} onClick={() => dispatch({ type: "submit" })}>
          Сдать степень
        </button>
      </div>
      {state.misses.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Непринятые степени">
          {state.misses.map((k, i) => (
            <li key={i}>степень {k}</li>
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
  feedback: (s) => overfitCloud.feedback(s),
  stats: (s) => [
    ["Сдач", s.misses.length + (s.submitted ? 1 : 0)],
    ["Моделей в облаке", 100],
  ],
  actions: (s) => s.misses.length + (s.submitted ? 1 : 0),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунке", "степень полинома от 0 до 10"],
    ["Enter на «Сдать степень»", "сравнить с лучшей степенью по ожидаемой ошибке"],
    ["Подсказка", "сначала как растёт разброс, потом цена одного веса"],
  ],
};

export function OverfitCloud({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={overfitCloud} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
