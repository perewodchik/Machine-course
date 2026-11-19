// Представление «Переобучи, если сможешь: λ»: на поле — 20 весов модели столбиками (после первой сдачи — и истинные
// веса крестиками-точками), справа — тип штрафа, бегунок log₁₀ λ, ошибки на обучении и валидации, «Сдать модель».
// Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { Line, ParamSlider, Plane, Point, Readout } from "../../widgets/_kit";
import { D, DEBRIEF, errors, LEVEL_NAMES, LEVELS, LOG_LAMBDA, nonzero, overfitLambda, penaltyName, pow10, type Action, type Level, type Penalty, type State } from "./model";

const Y = 2.5;
const clampY = (y: number) => Math.max(-Y, Math.min(Y, y));

function Board({ state }: { state: State }) {
  const { fit } = errors(state.level, state.choice);
  const shown = state.submits.length > 0;
  const k = nonzero(fit);
  return (
    <figure className="game__figure">
      <Plane x={[0, D + 1]} y={[-Y, Y]} xStep={5} yStep={1} xLabel="j" yLabel="θ_j" height={{ ratio: 0.55, min: 220, max: 340 }} initialWidth={480} label={`Веса ${D} признаков: ненулевых ${k}${shown ? "; точками показаны истинные веса" : ""}`}>
        {fit.theta.map((t, j) => (
          <Line key={`w${j}`} from={[j + 1, 0]} to={[j + 1, clampY(t)]} role="param" />
        ))}
        {fit.theta.map((t, j) => (Math.abs(t) > 1e-9 ? <Point key={`p${j}`} x={j + 1} y={clampY(t)} role="param" r={3} /> : null))}
        {shown && state.level.truth.map((t, j) => <Point key={`t${j}`} x={j + 1} y={t} role="data" r={4} />)}
      </Plane>
      <figcaption className="game__legend">столбики — веса модели θ̂ⱼ{shown ? ", точки — истинные веса" : ""}; ненулевых весов: {k} из {D}</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const e = errors(state.level, state.choice);
  const done = state.solved;
  const last = state.submits[state.submits.length - 1];
  const pick = (penalty: Penalty) => (
    <button type="button" className="btn btn--sm" aria-pressed={state.choice.penalty === penalty} disabled={done} onClick={() => dispatch({ type: "set", penalty })}>
      {penalty === "l2" ? "L2 (гребневая)" : "L1 (лассо)"}
    </button>
  );
  return (
    <div className="game-eigen game-overfit">
      <div className="game-eigen__actions" role="group" aria-label="Тип штрафа">
        {pick("l2")}
        {pick("l1")}
      </div>
      <ParamSlider name="log_{10} λ" value={state.choice.logLambda} min={LOG_LAMBDA.min} max={LOG_LAMBDA.max} step={LOG_LAMBDA.step} digits={1} role="param" disabled={done} onChange={(logLambda) => dispatch({ type: "set", logLambda })} />
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
              {penaltyName(x.penalty)}, λ = {pow10(x.logLambda)}: тест {x.test.toFixed(3)}
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
  feedback: (s) => overfitLambda.feedback(s),
  stats: (s) => [
    ["Сдано моделей", s.submits.length],
    ["Обучающих объектов", s.level.train.y.length],
  ],
  actions: (s) => s.submits.length,
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab, Enter на «L2» и «L1»", "тип штрафа"],
    ["← → на бегунке", "log₁₀ λ на 0.5"],
    ["Enter на «Сдать модель»", "открыть ошибку на скрытом тесте"],
  ],
};

export function OverfitLambda({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={overfitLambda} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
