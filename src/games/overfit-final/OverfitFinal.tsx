// Представление «Переобучи, если сможешь: финал»: на поле — n объектов и подогнанный по всем полином; после сдачи —
// скрытые тестовые точки. Справа — способ оценки (отложенная часть или кросс-валидация), степень, log₁₀ λ,
// оценка ошибки (± SE для кросс-валидации) и «Сдать модель» — тест открывается один раз. Логика — model.ts.
import type { ReactNode } from "react";
import { GameShell, type ShellView } from "../_engine/GameShell";
import { ParamSlider, Plane, Point, Polyline, Readout } from "../../widgets/_kit";
import { fit, predict } from "../overfit/model";
import { DEBRIEF, DEGREES, estimate, K, LEVEL_NAMES, LEVELS, LOG_LAMBDA, methodName, overfitFinal, pow10, trainError, type Action, type Level, type Method, type State } from "./model";

const Y = 3;
const clampY = (y: number) => Math.max(-Y - 1, Math.min(Y + 1, y));

function Board({ state }: { state: State }) {
  const l = state.level;
  const theta = fit(l.data, state.choice);
  const curve = Array.from({ length: 201 }, (_, i) => -1 + i / 100).map((x) => [x, clampY(predict(theta, x))] as [number, number]);
  const shown = state.test !== null;
  return (
    <figure className="game__figure">
      <Plane x={[-1, 1]} y={[-Y, Y]} xStep={0.5} yStep={1} xLabel="x" yLabel="y" height={{ ratio: 0.6, min: 220, max: 360 }} initialWidth={480} label={`${l.data.length} объектов; полином степени ${state.choice.degree} при λ = ${pow10(state.choice.logLambda)}, обученный по всем${shown ? `; показаны ${l.test.length} тестовых точек` : ""}`}>
        {shown && l.test.map(([x, y], i) => <Point key={`t${i}`} x={x} y={y} role="aux" r={1.75} />)}
        {l.data.map(([x, y], i) => (
          <Point key={`d${i}`} x={x} y={y} role="data" r={l.data.length > 100 ? 3 : 5} />
        ))}
        <Polyline points={curve} role="param" />
      </Plane>
      <figcaption className="game__legend">точки — {l.data.length} объектов{shown ? ", мелкие — тест" : ""}; линия — полином, обученный по всем объектам</figcaption>
    </figure>
  );
}

function Controls({ state, dispatch }: { state: State; dispatch: (a: Action) => void }) {
  const done = state.test !== null;
  const e = estimate(state.level, state.method, state.choice);
  const pick = (method: Method) => (
    <button type="button" className="btn btn--sm" aria-pressed={state.method === method} disabled={done} onClick={() => dispatch({ type: "method", method })}>
      {method === "holdout" ? "отложенная часть 25 %" : `кросс-валидация, ${K} фолдов`}
    </button>
  );
  return (
    <div className="game-eigen game-overfit">
      <div className="game-eigen__actions" role="group" aria-label="Способ оценки">
        {pick("holdout")}
        {pick("cv")}
      </div>
      <ParamSlider name="степень" value={state.choice.degree} min={DEGREES.min} max={DEGREES.max} step={1} digits={0} role="param" disabled={done} onChange={(degree) => dispatch({ type: "set", degree })} />
      <ParamSlider name="log_{10} λ" value={state.choice.logLambda} min={LOG_LAMBDA.min} max={LOG_LAMBDA.max} step={1} digits={0} role="param" disabled={done} onChange={(logLambda) => dispatch({ type: "set", logLambda })} />
      <div className="game-range__readouts">
        <Readout name="обучение" value={trainError(state.level, state.choice)} digits={3} />
        <Readout name={state.method === "cv" ? "CV" : "отложенная"} value={e.mean} digits={3} />
        {e.se !== null && <Readout name="± SE" value={e.se} digits={3} />}
        {done && <Readout name="тест" value={state.test!} digits={3} />}
      </div>
      <div className="game-eigen__actions">
        <button type="button" className="btn btn--sm btn--primary" disabled={done} onClick={() => dispatch({ type: "submit" })}>
          Сдать модель (тест один раз)
        </button>
      </div>
      {done && (
        <p className="game__legend">
          Сдано: степень {state.choice.degree}, λ = {pow10(state.choice.logLambda)}, оценка — {methodName(state.method)}.
        </p>
      )}
    </div>
  );
}

const view: ShellView<State, Action, Level> = {
  reset: { type: "reset" },
  hint: { type: "hint" },
  levelName: (l) => LEVEL_NAMES[l.kind],
  feedback: (s) => overfitFinal.feedback(s),
  stats: (s) => [
    ["Объектов", s.level.data.length],
    ["Тест", s.test === null ? "закрыт" : "открыт"],
  ],
  actions: (s) => (s.test === null ? 0 : 1),
  hints: (s) => s.hints,
  debrief: (l) => DEBRIEF[l.kind],
  board: (s) => <Board state={s} />,
  controls: (s, dispatch) => <Controls state={s} dispatch={dispatch} />,
  keys: [
    ["Tab, Enter на кнопках оценки", "отложенная часть или кросс-валидация"],
    ["← → на бегунках", "степень на 1, log₁₀ λ на 1"],
    ["Enter на «Сдать модель»", "открыть тест — один раз, уровень окончен"],
  ],
};

export function OverfitFinal({ seed = 1, children }: { seed?: number; children?: ReactNode }) {
  return (
    <GameShell spec={overfitFinal} view={view} levels={LEVELS} seed={seed}>
      {children}
    </GameShell>
  );
}
