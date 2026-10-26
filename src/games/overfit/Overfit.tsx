// Представление «Переобучи, если сможешь»: на поле — обучающие точки (крупные), валидационные (мелкие) и подогнанный
// полином; после сдачи — скрытые тестовые точки. Справа — бегунки степени и log₁₀ λ, ошибки и «Сдать модель».
// Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { ParamSlider, Plane, Point, Polyline, Readout } from "../../widgets/_kit";
import { DEBRIEF, DEGREES, errors, LEVEL_NAMES, LEVELS, LOG_LAMBDA, overfit, pow10, predict, type Action, type Level, type State } from "./model";

const Y = 2.5;
const clampY = (y: number) => Math.max(-Y - 1, Math.min(Y + 1, y));

function Board({ state }: { state: State }) {
  const l = state.level;
  const { theta } = errors(l, state.choice);
  const curve = Array.from({ length: 201 }, (_, i) => -1 + i / 100).map((x) => [x, clampY(predict(theta, x))] as [number, number]);
  const shown = state.submits.length > 0;
  return (
    <figure className="game__figure">
      <Plane x={[-1, 1]} y={[-Y, Y]} xStep={0.5} yStep={1} xLabel="x" yLabel="y" height={{ ratio: 0.6, min: 220, max: 360 }} initialWidth={480} label={`${l.train.length} обучающих и ${l.val.length} валидационных точек; полином степени ${state.choice.degree} при λ = ${pow10(state.choice.logLambda)}${shown ? `; показаны ${l.test.length} тестовых точек` : ""}`}>
        {shown && l.test.map(([x, y], i) => <Point key={`t${i}`} x={x} y={y} role="aux" r={1.75} />)}
        {l.val.map(([x, y], i) => (
          <Point key={`v${i}`} x={x} y={y} role="target" r={3} />
        ))}
        {l.train.map(([x, y], i) => (
          <Point key={`a${i}`} x={x} y={y} role="data" r={5} />
        ))}
        <Polyline points={curve} role="param" />
      </Plane>
      <figcaption className="game__legend">крупные точки — обучение, мелкие — валидация{shown ? ", самые мелкие — тест" : ""}; линия — подогнанный полином</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const e = errors(state.level, state.choice);
  const done = state.solved;
  const last = state.submits[state.submits.length - 1];
  return (
    <div className="game-eigen game-overfit">
      <ParamSlider name="степень" value={state.choice.degree} min={DEGREES.min} max={DEGREES.max} step={1} digits={0} role="param" disabled={done} onChange={(degree) => dispatch({ type: "set", degree })} />
      <ParamSlider name="log_{10} λ" value={state.choice.logLambda} min={LOG_LAMBDA.min} max={LOG_LAMBDA.max} step={1} digits={0} role="param" disabled={done} onChange={(logLambda) => dispatch({ type: "set", logLambda })} />
      <div className="game-range__readouts">
        <Readout name="обучение" value={e.train} digits={3} />
        <Readout name="валидация" value={e.val} digits={3} />
        {last && <Readout name="тест" value={last.test} digits={3} />}
      </div>
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "submit" })}>
          Сдать модель
        </button>
      </div>
      {state.submits.length > 0 && (
        <ol className="game-diverge__runs" aria-label="Сданные модели">
          {state.submits.map((x, i) => (
            <li key={i}>
              степень {x.degree}, λ = {pow10(x.logLambda)}: тест {x.test.toFixed(3)}
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
  feedback: (s) => overfit.feedback(s),
  stats: (s) => [
    ["Сдано моделей", s.submits.length],
    ["Обучающих точек", s.level.train.length],
  ],
  actions: (s) => s.submits.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["← → на бегунках", "степень на 1, log₁₀ λ на 1"],
    ["Enter на «Сдать модель»", "открыть ошибку на скрытом тесте"],
    ["Подсказка", "сначала на что смотреть, потом лучшая модель по валидации"],
  ],
};

export function Overfit({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={overfit} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
